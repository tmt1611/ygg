import { GoogleGenerativeAI } from "@google/generative-ai";
import { initializeNodes, isValidTechTreeNodeShape } from "../utils.js";

export const AVAILABLE_MODELS = [
  { id: "gemini-1.5-flash-latest", name: "Gemini 1.5 Flash (Latest)" },
  { id: "gemini-1.5-pro-latest", name: "Gemini 1.5 Pro (Latest)" },
];

const COMMON_NODE_FORMAT_INSTRUCTION = `{
  "id": "string (or 'NEW_NODE' for new nodes)",
  "name": "string",
  "description": "string",
  "isLocked": boolean,
  "importance": "string ('minor', 'common', or 'major')",
  "children": [ ... (array of node objects) ],
  "linkedProjectId": "string or null (if exists)",
  "linkedProjectName": "string or null (if exists)"
}`;

const COMMON_JSON_SYNTAX_RULES = `Strictly follow JSON syntax: all strings enclosed in double quotes, no trailing commas.`;

let apiClientState = {
  client: null,
  isKeyAvailable: false,
  activeKey: null,
  activeModel: AVAILABLE_MODELS[0].id,
};

const _initializeClient = (key) => {
  if (!key?.trim()) {
    apiClientState = { ...apiClientState, client: null, isKeyAvailable: false, activeKey: null };
    return { success: false, message: "API Key cannot be empty." };
  }

  try {
    const newClient = new GoogleGenerativeAI(key);
    apiClientState = { ...apiClientState, client: newClient, isKeyAvailable: true, activeKey: key };
    return { success: true, message: `API Key set successfully. AI features enabled.` };
  } catch (error) {
    apiClientState = { ...apiClientState, client: null, isKeyAvailable: false, activeKey: null };
    console.error(`Error initializing Gemini API client:`, error);
    let userMessage = `Failed to initialize AI client.`;
    if (error.message?.toLowerCase().includes("api key not valid") ||
        error.message?.toLowerCase().includes("provide an api key") ||
        error.message?.toLowerCase().includes("api_key_invalid")) {
        userMessage = `The provided API Key appears to be invalid. Please check the key and try again.`;
    } else if (error.message) {
        userMessage += ` Details: ${error.message.substring(0, 100)}${error.message.length > 100 ? '...' : ''}`;
    }
    return { success: false, message: userMessage };
  }
};

export const setApiKey = async (apiKey) => {
  return _initializeClient(apiKey);
};

export const clearActiveApiKey = () => {
    apiClientState = { ...apiClientState, client: null, isKeyAvailable: false, activeKey: null };
    return { success: true, message: "API Key cleared. Provide a new key to enable AI features." };
};

export const setActiveModel = (modelId) => {
  if (AVAILABLE_MODELS.some(m => m.id === modelId)) {
    apiClientState.activeModel = modelId;
    return { success: true, message: `AI model set to ${modelId}.` };
  }
  return { success: false, message: `Invalid model ID: ${modelId}.` };
};


export const isApiKeySet = () => apiClientState.isKeyAvailable && apiClientState.client !== null;

const withApiClient = (fn) => {
  return async (...args) => {
    if (!apiClientState.client || !apiClientState.isKeyAvailable) {
      throw constructApiError(
        new Error("Gemini API client not initialized."),
        "Failed to call API."
      );
    }
    return fn(...args);
  };
};

const constructApiError = (error, baseMessage, context = {}) => {
  // Use the original error object to preserve its stack trace, or create a new one.
  const errorToThrow = error instanceof Error ? error : new Error(baseMessage);
  
  if (context.prompt) errorToThrow.prompt = context.prompt;
  if (context.rawResponse) errorToThrow.rawResponse = context.rawResponse;

  if (!isApiKeySet() && !error.message?.includes("Gemini API client not initialized")) {
     errorToThrow.message = "API Key not set or invalid. Please provide a valid API Key in 'Workspace' -> 'API Key Setup'.";
     return errorToThrow;
  }
  
  let detailedMessage = baseMessage;
  if (error?.message) {
    const errorMsgLower = error.message.toLowerCase();
    
    const quotaIndicators = ["quota", "user_rate_limit", "resource_exhausted", "rate limit"];
    if (quotaIndicators.some(indicator => errorMsgLower.includes(indicator)) || error.status === 429) {
      errorToThrow.message = `API quota exceeded or rate limit hit. Please check your Gemini API usage and limits, or try again later.`;
      return errorToThrow;
    }
    
    const invalidKeyIndicators = ["api key not valid", "provide an api key", "api_key_invalid", "permission denied", "authentication failed", "invalid api key", "api key authorization failed"];
    const httpErrorCodes = [400, 401, 403]; 

    if (invalidKeyIndicators.some(indicator => errorMsgLower.includes(indicator)) || 
        (error.status && httpErrorCodes.includes(error.status))) {
      clearActiveApiKey();
      errorToThrow.message = `The API Key is invalid or lacks permissions, and has been cleared. Please set a new key in Workspace > API Key Setup.`;
      return errorToThrow;
    }
    
    // For other errors, append details to the base message.
    if (!error.message.startsWith("AI returned invalid JSON")) {
        detailedMessage += ` Details: `;
    }
    detailedMessage += `${error.message.substring(0,150)}${error.message.length > 150 ? '...' : ''}`;
  }

  errorToThrow.message = detailedMessage;
  return errorToThrow;
};



const extractJsonFromMarkdown = (text) => {
  if (!text) return null;
  const trimmedText = text.trim();
  // This regex finds a JSON code block even if it's not at the start/end of the string.
  const fenceRegex = /```(?:json|JSON)?\s*\n?([\s\S]*?)\n?\s*```/m;
  const match = trimmedText.match(fenceRegex);
  if (match && match[1]) {
      return match[1].trim();
  }

  // Fallback for cases where the AI doesn't use a markdown fence correctly
  // or includes extra text. It finds the first '{' or '[' and the last '}' or ']'.
  const firstBrace = trimmedText.indexOf('{');
  const lastBrace = trimmedText.lastIndexOf('}');
  const firstBracket = trimmedText.indexOf('[');
  const lastBracket = trimmedText.lastIndexOf(']');

  // Determine if the content is primarily an object or an array
  if (firstBrace !== -1 && lastBrace > firstBrace && (firstBracket === -1 || firstBrace < firstBracket)) {
      // It's likely an object
      return trimmedText.substring(firstBrace, lastBrace + 1);
  }
  if (firstBracket !== -1 && lastBracket > firstBracket && (firstBrace === -1 || firstBracket < firstBrace)) {
      // It's likely an array
      return trimmedText.substring(firstBracket, lastBracket + 1);
  }

  return trimmedText; // Return as-is if no clear JSON object/array is found
};

const parseGeminiJsonResponse = (responseText, forModification = false) => {
  const jsonStr = extractJsonFromMarkdown(responseText);
  if (!jsonStr) {
    throw new Error("AI returned an empty response.");
  }

  try {
    const parsed = JSON.parse(jsonStr);
    if (Array.isArray(parsed)) {
        if (forModification && parsed.every(item => isValidTechTreeNodeShape(item))) return parsed;
        if (!forModification) {
            console.error("Gemini JSON parsing error: Expected single root object for new tree, got array.", parsed);
            throw new Error("AI returned an array; expected a single root node object for initial generation.");
        }
        console.error("Gemini JSON parsing error: Array for modification contains invalid node structures.", parsed);
        throw new Error("AI returned an array for modification with one or more malformed node objects.");
    }
    if (!isValidTechTreeNodeShape(parsed)) {
        console.error("Gemini JSON parsing error: Root object structure invalid.", parsed);
        throw new Error("AI returned malformed JSON (root object invalid). Ensure AI is configured for valid node JSON output (name, description, isLocked, importance, children).");
    }
    return parsed;
  } catch(e) {
    console.error("Gemini JSON parsing critical error. Raw text:", responseText, "Attempted to parse:", jsonStr, "Error:", e);
    const newError = new Error(`AI returned invalid JSON. ${e.message || 'Parsing failed.'} Check console for raw response.`);
    newError.rawResponse = responseText;
    throw newError;
  }
};





const getQuickEditPrompt = (nodeToEdit, modificationPrompt) => {
  const systemInstruction = `You are an AI assistant that modifies a single JSON node object based on a user instruction.
**RULES:**
1.  **Minimal Changes:** Only modify the parts of the node object (e.g., name, description, children) that are directly requested by the user's instruction.
2.  **Preserve Core Properties:** You MUST preserve the original 'id', 'isLocked', 'linkedProjectId', and 'linkedProjectName' values.
3.  **Mandatory Fields:** Your output MUST be a single, valid JSON object representing the node. It MUST contain all these keys: "id", "name", "description", "isLocked", "importance", "children", "linkedProjectId", "linkedProjectName".
4.  **Child Nodes:** If the user asks to add children, add new child objects to the 'children' array. For new children, use "NEW_NODE" as the 'id'. Preserve existing children unless the user explicitly asks to remove them.
5.  **Output Format:** Respond ONLY with the single, modified JSON object. Do not wrap it in markdown fences or add any other text.
`;

  const userPrompt = `
Current Node JSON:
\`\`\`json
${JSON.stringify(nodeToEdit, null, 2)}
\`\`\`

User instruction: "${modificationPrompt}"

Based on the instruction, provide the complete, modified JSON object for this single node.
`;
  return { systemInstruction, userPrompt };
};

export const generateQuickEdit = withApiClient(async (nodeToEdit, modificationPrompt, modelId) => {
  const { systemInstruction, userPrompt } = getQuickEditPrompt(nodeToEdit, modificationPrompt);

  try {
    const model = apiClientState.client.getGenerativeModel({ 
      model: modelId || apiClientState.activeModel,
      systemInstruction: { parts: [{ text: systemInstruction }], role: "model" },
      generationConfig: { 
        responseMimeType: "application/json", 
        temperature: 0.2, // Lower temperature for more predictable, focused edits
        topK: 40, 
        topP: 0.95 
      },
    });

    const result = await model.generateContent(userPrompt);
    const response = result.response;
    
    let parsedData = parseGeminiJsonResponse(response.text(), true); // `true` for modification allows array returns, but we expect an object here.

    if (Array.isArray(parsedData)) {
        console.error("Gemini quick edit returned an array, expected a single node object:", parsedData);
        throw new Error("AI suggestion resulted in an array of nodes, but a single node object was expected for a quick edit.");
    }

    if (!isValidTechTreeNodeShape(parsedData)) {
        console.error("Gemini quick edit resulted in invalid JSON structure.", parsedData);
        throw new Error("AI suggestion has an invalid node structure.");
    }
    
    // The AI should preserve the ID, but as a safeguard, we enforce it.
    parsedData.id = nodeToEdit.id;

    // The AI might forget to initialize children, so we do it here.
    return initializeNodes(parsedData, nodeToEdit._parentId);

  } catch (error) {
    console.error("Error during quick edit via Gemini API:", error);
    throw constructApiError(error, "Failed to perform quick edit.", { prompt: userPrompt, rawResponse: error.rawResponse });
  }
});



const getGenerateTechTreePrompt = (userPrompt) => {
  const systemInstruction = `
You are an AI assistant that generates structured technology trees.
You MUST respond with a single, valid JSON object representing the root node.
Node format example: ${COMMON_NODE_FORMAT_INSTRUCTION}
${COMMON_JSON_SYNTAX_RULES}
Ensure: Logical hierarchy, 2-4 levels deep, 2-5 children per parent. Prioritize clarity and key items.
`;
  const finalUserPrompt = `Topic: "${userPrompt}"`;
  return { systemInstruction, userPrompt: finalUserPrompt };
};

export const generateTechTree = withApiClient(async (userPrompt, modelId) => {
  const { systemInstruction, userPrompt: finalUserPrompt } = getGenerateTechTreePrompt(userPrompt);
  try {
    const model = apiClientState.client.getGenerativeModel({ 
      model: modelId || apiClientState.activeModel,
      systemInstruction: {
        parts: [{ text: systemInstruction }],
        role: "model"
      },
      generationConfig: { 
        responseMimeType: "application/json", 
        temperature: 0.25, topK: 40, topP: 0.92 
      },
    });

    const result = await model.generateContent(finalUserPrompt);
    const response = result.response;
    const parsedData = parseGeminiJsonResponse(response.text(), false);
     if (Array.isArray(parsedData) || !isValidTechTreeNodeShape(parsedData)) {
        console.error("Generated JSON root structure error after parsing for new tree:", parsedData);
        throw new Error("Generated JSON root structure invalid (expected single object with name, children, importance, etc.).");
    }
    return initializeNodes(parsedData);
  } catch (error) {
    console.error("Error generating tech tree from Gemini API:", error);
    throw constructApiError(error, "Failed to generate tech tree.");
  }
});
const getModifyTechTreePrompt = (currentTree, modificationPrompt, lockedNodeIds) => {
  const systemInstruction = `You are an AI assistant that modifies a JSON tech tree based on user instructions.
**MANDATORY RULES:**
1.  **Minimal Changes:** Only modify nodes directly relevant to the user's instruction. Leave all other nodes completely unchanged, preserving their exact original content and structure.
2.  **Critical: Preserve IDs & Locks:**
    - You MUST RETAIN the original 'id' for every existing node, even if you change its name, description, or move it. This is the most important rule. An existing node in the output MUST have the same 'id' it had in the input.
    - If you create a completely new node, use "NEW_NODE" for its 'id'.
    - You MUST NOT change the 'isLocked' value for any node.
3.  **Locked Node Content:** If a node's ID is in the 'Locked Node IDs' list, you MUST NOT change its 'name', 'description', or 'importance'. You CAN add new children to it or move it.
4.  **Node Importance:** Must be one of "minor", "common", or "major".
5.  **Mandatory Fields:** Every single node in your output, including unchanged nodes, MUST contain all of these exact keys: "id", "name", "description", "isLocked", "importance", "children". If a node has no description, use an empty string: "description": "". Also preserve "linkedProjectId" and "linkedProjectName" if they exist on a node.
6.  **Output Format:** Respond ONLY with a single, valid JSON object for the modified tree's root node. NO EXTRA TEXT, explanations, or markdown fences.
7.  **JSON Syntax:** Strictly follow JSON rules. Example node: ${COMMON_NODE_FORMAT_INSTRUCTION}
8.  **Maintain Structure:** Avoid unnecessarily drastic changes to the overall tree shape (e.g., adding many new levels of depth) unless the user's instruction explicitly asks for it.
9.  **Final Check:** Before outputting, double-check that your entire response is a single JSON object starting with { and ending with }, and that every single node in the tree has all the mandatory fields from rule #5.
`;

  const userPrompt = `
Current Tree (JSON):
\`\`\`json
${JSON.stringify(currentTree, null, 2)}
\`\`\`
Locked Node IDs (core properties must not change): ${JSON.stringify(lockedNodeIds)}
User instruction: "${modificationPrompt}"

Output the complete, modified JSON for the tech tree, adhering to ALL rules above. Respond ONLY with the JSON.
`;
  return { systemInstruction, userPrompt };
};

export const modifyTechTreeByGemini = withApiClient(async (
  currentTree,
  modificationPrompt,
  lockedNodeIds,
  modelId
) => {
  const { systemInstruction, userPrompt } = getModifyTechTreePrompt(currentTree, modificationPrompt, lockedNodeIds);
  try {
    const model = apiClientState.client.getGenerativeModel({ 
      model: modelId || apiClientState.activeModel,
      systemInstruction: { parts: [{ text: systemInstruction }], role: "model" },
      generationConfig: { 
        responseMimeType: "application/json", 
        temperature: 0.35, topK: 45, topP: 0.90 
      },
    });

    const result = await model.generateContent(userPrompt);
    const response = result.response;
    
    let parsedData = parseGeminiJsonResponse(response.text(), true);

    // This reconciliation step attempts to restore IDs and lock states that the AI might have omitted.
    // This prevents existing nodes from being incorrectly flagged as 'new'.
    const reconcileData = (original, modified) => {
        if (!original || !modified) return;

        // Force the modified node to take the ID and lock state of the original node it's being compared against.
        if (original.id) {
            modified.id = original.id;
        }
        modified.isLocked = original.isLocked;

        const originalChildren = original.children || [];
        const modifiedChildren = modified.children || [];
        if (modifiedChildren.length === 0) return;

        // Create maps for faster lookups
        const originalChildrenById = new Map(originalChildren.map(c => [c.id, c]));
        const originalChildrenByName = new Map(originalChildren.map(c => [c.name, c]));
        const usedOriginalIds = new Set();

        // Pass 1: Match by ID. This is the most reliable.
        modifiedChildren.forEach(modChild => {
            if (modChild.id && modChild.id !== 'NEW_NODE' && originalChildrenById.has(modChild.id)) {
                const originalChild = originalChildrenById.get(modChild.id);
                reconcileData(originalChild, modChild);
                usedOriginalIds.add(originalChild.id);
            }
        });

        // Pass 2: Match by name for nodes that didn't have a matching ID.
        modifiedChildren.forEach(modChild => {
            // Skip if it already has a valid, matched ID from pass 1
            if (modChild.id && modChild.id !== 'NEW_NODE' && usedOriginalIds.has(modChild.id)) return;

            const originalChild = originalChildrenByName.get(modChild.name);
            // Ensure this original child hasn't been matched by ID already
            if (originalChild && !usedOriginalIds.has(originalChild.id)) {
                reconcileData(originalChild, modChild);
                usedOriginalIds.add(originalChild.id);
            }
        });
    };
    
    if (Array.isArray(parsedData)) {
        if (parsedData.length > 0 && parsedData.every(isValidTechTreeNodeShape)) {
             parsedData = { 
                id: currentTree.id || 'NEW_NODE_ROOT_WRAPPER', // Try to preserve root ID
                name: `${currentTree.name || 'Modified Tree'} (Wrapped Multi-Root)`,
                description: "AI suggested multiple root nodes; this is an auto-generated wrapper.",
                isLocked: currentTree.isLocked || false, 
                importance: 'common', 
                children: parsedData,
                linkedProjectId: currentTree.linkedProjectId || null,
                linkedProjectName: currentTree.linkedProjectName || null,
            };
        } else { 
            console.error("Gemini modification resulted in an un-wrappable array or array with invalid items:", parsedData);
            throw new Error("AI suggestion resulted in an array of nodes that cannot be auto-wrapped or contains invalid nodes.");
        }
    } else if (parsedData) {
        reconcileData(currentTree, parsedData);
    }

    if (!isValidTechTreeNodeShape(parsedData)) {
        console.error("Gemini modification resulted in invalid JSON root structure after potential wrap.", parsedData);
        throw new Error("AI suggestion has an invalid root structure (e.g., name/children/importance missing or invalid type).");
    }
    
    return initializeNodes(parsedData);

  } catch (error) {
    console.error("Error modifying tech tree via Gemini API:", error);
    throw constructApiError(error, "Failed to modify tech tree using AI.", { prompt: userPrompt, rawResponse: error.rawResponse });
  }
});

const getSummarizeTextPrompt = (textToSummarize) => {
  return `You are a helpful assistant. Summarize the following text, which describes a hierarchical tech tree or skill tree. 
Provide a concise overview (100-150 words), highlighting its main purpose, key branches, and overall theme or focus.
Do not use markdown formatting in your response.

Raw Text to Summarize:
---
${textToSummarize.substring(0, 30000)} 
---

Concise Summary (100-150 words, plain text only):`;
};

export const summarizeText = withApiClient(async (textToSummarize, modelId) => {
  const prompt = getSummarizeTextPrompt(textToSummarize);
  try {
    const model = apiClientState.client.getGenerativeModel({ 
      model: modelId || apiClientState.activeModel,
      generationConfig: { 
        temperature: 0.5, topK: 40, topP: 0.95 
      },
    });

    const result = await model.generateContent(prompt);
    const response = result.response;
    return response.text().trim();
  } catch (error) {
    console.error("Error generating summary from Gemini API:", error);
    throw constructApiError(error, "Failed to generate AI summary.");
  }
});

const getProjectInsightsPrompt = (tree, projectContext) => {
  const systemInstruction = `You are an expert project analyst. Your task is to analyze a JSON representation of a technology or skill tree and provide high-level insights.
**RULES:**
1.  **Output Format:** You MUST respond with a single, valid JSON object.
2.  **JSON Structure:** The JSON object must have these exact keys:
    - \`overall_summary\`: A string (2-3 sentences) summarizing the project's scope, strengths, and potential weaknesses.
    - \`key_node_insights\`: An array of 2-4 objects. Each object represents a key node you've identified for improvement. Each object must have:
        - \`node_id\`: The string ID of the node from the input tree.
        - \`node_name\`: The string name of the node from the input tree.
        - \`critique\`: A string (1-2 sentences) explaining why this node is key and how it could be improved (e.g., vague description, needs more children).
        - \`suggested_description\`: A string with a new, improved description for the node.
    - \`suggested_new_branches\`: An array of 1-3 objects. Each object represents a potential new top-level branch to add to the root of the tree. Each object must have:
        - \`name\`: A string for the new branch's name.
        - \`description\`: A string explaining what this branch would cover and why it's a good addition.
3.  **JSON Syntax:** Strictly follow JSON rules. NO EXTRA TEXT, explanations, or markdown fences.
`;

  const userPrompt = `
Project Context: "${projectContext || 'General Technology/Skills'}"

Analyze the following tech tree and provide insights based on the rules. Identify key nodes that are underdeveloped or critically important. Suggest new high-level branches that would logically expand the project.

Tech Tree JSON:
\`\`\`json
${JSON.stringify(tree, null, 2)}
\`\`\`

Respond ONLY with the JSON object.
`;

  return { systemInstruction, userPrompt };
};

export const generateProjectInsights = withApiClient(async (tree, projectContext, modelId) => {
    const { systemInstruction, userPrompt } = getProjectInsightsPrompt(tree, projectContext);
    try {
        const model = apiClientState.client.getGenerativeModel({ 
          model: modelId || apiClientState.activeModel,
          systemInstruction: { parts: [{ text: systemInstruction }], role: "model" },
          generationConfig: { 
            responseMimeType: "application/json", 
            temperature: 0.5, topK: 50, topP: 0.95
          },
        });
        
        const result = await model.generateContent(userPrompt);
        const response = result.response;
        
        const jsonStr = extractJsonFromMarkdown(response.text());
        if (!jsonStr) {
          throw new Error("AI returned an empty response for project insights.");
        }
        
        // Manual validation because the structure is complex
        const parsed = JSON.parse(jsonStr);
        if (typeof parsed !== 'object' || parsed === null || typeof parsed.overall_summary !== 'string' || !Array.isArray(parsed.key_node_insights) || !Array.isArray(parsed.suggested_new_branches)) {
            throw new Error("Root structure of project insights is invalid.");
        }
        // Could add more detailed validation here if needed
        
        return parsed;
    } catch (error) {
        console.error("Error generating project insights from Gemini API:", error);
        throw constructApiError(error, "Failed to generate AI project insights.", { prompt: userPrompt, rawResponse: error.rawResponse });
    }
});

const getStrategicSuggestionsPrompt = (projectContext, currentTreeSummary) => {
  const systemInstruction = `You are an AI assistant that provides strategic suggestions for a project.
You MUST respond with a single, valid JSON array of strings.
Example: ["Suggestion 1", "Suggestion 2", "Suggestion 3"]
Output ONLY the JSON array. NO extra text, explanations, or markdown fences.
`;

  const userPrompt = `
Project Context: "${projectContext}"
Current Tree Summary: "${currentTreeSummary}"

Based on the project context and the current state of the tree, suggest 3-5 high-level strategic next steps, new major branches, or key areas of focus that would logically extend, complement, or significantly enhance this project.
Each suggestion should be a concise, actionable phrase or short sentence.
`;
  return { systemInstruction, userPrompt };
};

export const generateStrategicSuggestions = withApiClient(async (
  projectContext,
  currentTreeSummary,
  modelId
) => {
  const { systemInstruction, userPrompt } = getStrategicSuggestionsPrompt(projectContext, currentTreeSummary);
  try {
    const model = apiClientState.client.getGenerativeModel({ 
      model: modelId || apiClientState.activeModel,
      systemInstruction: { parts: [{ text: systemInstruction }], role: "model" },
      generationConfig: { 
        responseMimeType: "application/json", 
        temperature: 0.6, topK: 50, topP: 0.95 
      },
    });
    
    const result = await model.generateContent(userPrompt);
    const response = result.response;

    const jsonStr = extractJsonFromMarkdown(response.text());
    if (!jsonStr) {
      throw new Error("AI returned an empty response for strategic suggestions.");
    }

    const parsed = JSON.parse(jsonStr);
    if (!Array.isArray(parsed) || !parsed.every(item => typeof item === 'string')) {
      console.error("Strategic suggestions JSON parsing error: Expected array of strings.", parsed);
      throw new Error("AI returned malformed JSON for strategic suggestions. Expected an array of strings.");
    }
    return parsed;
  } catch (error) {
    console.error("Error generating strategic suggestions from Gemini API:", error);
    throw constructApiError(error, "Failed to generate AI strategic suggestions.", { prompt: userPrompt, rawResponse: error.rawResponse });
  }
});

export const getPromptTextFor = (type, payload) => {
  const getPromptFunctions = {
    generateTree: (p) => getGenerateTechTreePrompt(p.prompt),
    modifyTree: (p) => getModifyTechTreePrompt(p.tree, p.prompt, p.lockedIds),
    quickEdit: (p) => getQuickEditPrompt(p.node, p.prompt),
    projectInsights: (p) => getProjectInsightsPrompt(p.tree, p.context),
    strategicSuggestions: (p) => getStrategicSuggestionsPrompt(p.context, p.summary),
  };

  const getPrompt = getPromptFunctions[type];
  if (!getPrompt) {
    return "No prompt available for this action type.";
  }
  
  const instructions = getPrompt(payload);
  if (!instructions) return "Could not generate prompt preview.";

  const systemInstructionText = instructions.systemInstruction || "No system instruction provided.";
  
  // Re-construct the user prompt with placeholders if payload values are strings,
  // otherwise use the original prompt which contains the full data.
  // This allows for clean previews without duplicating prompt logic.
  const userPromptText = instructions.userPrompt
    .replace(
      JSON.stringify(payload.tree, null, 2), 
      typeof payload.tree === 'string' ? payload.tree : JSON.stringify(payload.tree, null, 2)
    )
    .replace(
      JSON.stringify(payload.node, null, 2), 
      typeof payload.node === 'string' ? payload.node : JSON.stringify(payload.node, null, 2)
    );

  return `--- SYSTEM INSTRUCTION ---\n${systemInstructionText}\n\n--- USER PROMPT ---\n${userPromptText}`;
};