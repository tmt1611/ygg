
import { GoogleGenerativeAI } from "@google/generative-ai";
import { initializeNodes, isValidTechTreeNodeShape } from "../utils.js";

let apiClientState = {
  client: null,
  isKeyAvailable: false,
  activeKey: null,
  activeSource: null,
};

const _initializeClient = (key, source) => {
  if (!key?.trim()) {
    apiClientState = { client: null, isKeyAvailable: false, activeKey: null, activeSource: null };
    return { success: false, message: source === 'environment' ? "Environment API Key is missing or empty." : "Pasted API Key cannot be empty." };
  }

  try {
    const newClient = new GoogleGenerativeAI(key);
    apiClientState = { client: newClient, isKeyAvailable: true, activeKey: key, activeSource: source };
    return { success: true, message: `API Key from ${source} set successfully. AI features enabled.` };
  } catch (error) {
    apiClientState = { client: null, isKeyAvailable: false, activeKey: null, activeSource: null };
    console.error(`Error initializing Gemini API client with ${source} API Key:`, error);
    let userMessage = `Failed to initialize AI client with ${source} API Key.`;
    if (error.message?.toLowerCase().includes("api key not valid") || 
        error.message?.toLowerCase().includes("provide an api key") ||
        error.message?.toLowerCase().includes("api_key_invalid")) {
        userMessage = `The ${source} API Key appears to be invalid. Please check the key and try again.`;
    } else if (error.message) {
        userMessage += ` Details: ${error.message.substring(0, 100)}${error.message.length > 100 ? '...' : ''}`;
    }
    return { success: false, message: userMessage };
  }
};

export const attemptLoadEnvKey = async () => {
  let envKey;
  try {
    // Safely access process.env, which may not exist in all browser environments
    if (typeof process !== 'undefined' && process.env) {
      envKey = process.env.API_KEY;
    }
  } catch (e) {
    console.warn("Could not access process.env.API_KEY. This is expected in some browser environments.");
    envKey = undefined;
  }

  if (envKey?.trim()) {
    const result = _initializeClient(envKey, 'environment');
    return { ...result, source: result.success ? 'environment' : null };
  }
  
  // If envKey is not found or empty, and there's no active key from another source, reset.
  if (!apiClientState.isKeyAvailable) { 
    apiClientState = { client: null, isKeyAvailable: false, activeKey: null, activeSource: null };
  }
  
  return { success: false, message: "API_KEY not found in environment. Provide key manually or set in deployment.", source: null };
};

export const setPastedApiKey = async (pastedKey) => {
  const result = _initializeClient(pastedKey, 'pasted');
  return { ...result, source: result.success ? 'pasted' : null };
};

export const clearActiveApiKey = () => {
    apiClientState = { client: null, isKeyAvailable: false, activeKey: null, activeSource: null };
    return { success: true, message: "API Key cleared. Provide a new key to enable AI features.", source: null };
};


export const isApiKeySet = () => apiClientState.isKeyAvailable && apiClientState.client !== null;

const constructApiError = (error, baseMessage, context = {}) => {
  const errorToThrow = new Error();
  if (context.prompt) errorToThrow.prompt = context.prompt;
  if (context.rawResponse) errorToThrow.rawResponse = context.rawResponse;

  if (!isApiKeySet()) {
     errorToThrow.message = "API Key not set or invalid. Please provide a valid API Key in 'Workspace' -> 'API Key Setup'.";
     return errorToThrow;
  }
  
  let detailedMessage = baseMessage;
  if (error?.message) {
    const errorMsgLower = error.message.toLowerCase();
    if (!error.message.startsWith("AI returned invalid JSON")) {
        detailedMessage += ` Details: `;
    }
    detailedMessage += `${error.message.substring(0,150)}${error.message.length > 150 ? '...' : ''}`;
    
    const quotaIndicators = ["quota", "user_rate_limit", "resource_exhausted", "rate limit"];
    if (quotaIndicators.some(indicator => errorMsgLower.includes(indicator)) || error.status === 429) {
      detailedMessage = `API quota exceeded or rate limit hit. Please check your Gemini API usage and limits, or try again later. (Source: ${apiClientState.activeSource || 'current key'})`;
      errorToThrow.message = detailedMessage;
      return errorToThrow;
    }
    
    const invalidKeyIndicators = ["api key not valid", "provide an api key", "api_key_invalid", "permission denied", "authentication failed", "invalid api key", "api key authorization failed"];
    const httpErrorCodes = [400, 401, 403]; 

    if (invalidKeyIndicators.some(indicator => errorMsgLower.includes(indicator)) || 
        (error.status && httpErrorCodes.includes(error.status))) { 
      const previousSource = apiClientState.activeSource;
      clearActiveApiKey(); 
      detailedMessage = `The API Key (from ${previousSource || 'previous source'}) is invalid or lacks permissions, and has been cleared. Please set a new key in Workspace > API Key Setup.`;
    }
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

const parseGeminiJsonResponseForInsights = (responseText) => {
    const jsonStr = extractJsonFromMarkdown(responseText);
    if (!jsonStr) {
      throw new Error("AI returned an empty response for insights.");
    }
    
    try {
        const parsed = JSON.parse(jsonStr);
        if (typeof parsed !== 'object' || parsed === null ||
            typeof parsed.suggested_description !== 'string' ||
            !Array.isArray(parsed.potential_children) || 
            !parsed.potential_children.every((item) => 
                typeof item === 'object' && item !== null && 
                typeof item.name === 'string' && 
                typeof item.description === 'string'
            ) ||
            !Array.isArray(parsed.alternative_names) || 
            !parsed.alternative_names.every((item) => typeof item === 'string') ||
            !Array.isArray(parsed.key_concepts) || 
            !parsed.key_concepts.every((item) => typeof item === 'string')) {
            console.error("Gemini Insights JSON parsing error: Invalid structure.", parsed);
            throw new Error("AI returned malformed JSON for insights. Expected 'suggested_description' (string), 'alternative_names' (array of strings), 'potential_children' (array of {name: string, description: string}), and 'key_concepts' (array of strings).");
        }
        return parsed;
    } catch (e) {
        console.error("Gemini Insights JSON parsing critical error. Raw text:", responseText, "Attempted to parse:", jsonStr, "Error:", e);
        throw new Error(`AI returned invalid JSON for insights. ${e.message || 'Parsing failed.'}`);
    }
};

const COMMON_NODE_FORMAT_INSTRUCTION = `{ "id": "auto-gen-if-new", "name": "Concise Name (max 50 chars)", "description": "Brief Desc (optional, max 150 chars, '' if none)", "isLocked": false, "importance": "common", "children": [] }`;
const COMMON_JSON_SYNTAX_RULES = `
Strict JSON Rules:
1. Keys and string values in DOUBLE QUOTES. No trailing commas.
2. Valid importances: "minor", "common", "major". Default: "common" for new nodes.
3. Output ONLY the single JSON object (for new tree) or the complete modified tree's root JSON object. NO extra text/markdown.
4. Every single node, from the root to the deepest child, MUST contain all of these exact keys: "id", "name", "description", "isLocked", "importance", "children". If a node has no description, use an empty string: "description": "".
5. Ensure all string values are properly escaped for JSON.
`;

export const generateTechTree = async (userPrompt) => {
  if (!apiClientState.client || !apiClientState.isKeyAvailable) {
    throw new Error("Gemini API client not initialized. Set a valid API Key in 'Workspace' -> 'API Key Setup'.");
  }

  try {
    const model = apiClientState.client.getGenerativeModel({ 
      model: "gemini-1.5-flash-latest",
      systemInstruction: {
        parts: [{ text: `
You are an AI assistant that generates structured technology trees.
You MUST respond with a single, valid JSON object representing the root node.
Node format example: ${COMMON_NODE_FORMAT_INSTRUCTION}
${COMMON_JSON_SYNTAX_RULES}
Ensure: Logical hierarchy, 2-4 levels deep, 2-5 children per parent. Prioritize clarity and key items.
`}],
        role: "model"
      },
      generationConfig: { 
        responseMimeType: "application/json", 
        temperature: 0.25, topK: 40, topP: 0.92 
      },
    });

    const result = await model.generateContent( `Topic: "${userPrompt}"` );
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
};

export const modifyTechTreeByGemini = async (
  currentTree,
  modificationPrompt,
  lockedNodeIds
) => {
  if (!apiClientState.client || !apiClientState.isKeyAvailable) {
    throw new Error("Gemini API client not initialized. Set a valid API Key in 'Workspace' -> 'Project Management'.");
  }

  const systemInstruction = `You are an AI assistant that modifies a JSON tech tree based on user instructions.
**MANDATORY RULES:**
1.  **Preserve IDs & Locks:**
    - RETAIN existing 'id' values for all nodes. For NEW nodes you create, use "NEW_NODE" as the 'id' value.
    - DO NOT change the 'isLocked' value for ANY node.
2.  **Locked Node Content:** If a node's ID is in the 'Locked Node IDs' list, you MUST NOT change its 'name', 'description', or 'importance'. You CAN add new children to it or move it.
3.  **Node Importance:** Must be one of "minor", "common", or "major".
4.  **Mandatory Fields:** ALL nodes in your output MUST have these fields: 'id', 'name', 'description' (use "" if empty), 'isLocked' (boolean), 'importance' (string), and 'children' (array, can be empty []).
5.  **Output Format:** Respond ONLY with a single, valid JSON object for the modified tree's root node. NO EXTRA TEXT, explanations, or markdown fences.
6.  **JSON Syntax:** Strictly follow JSON rules. Example node: ${COMMON_NODE_FORMAT_INSTRUCTION}
7.  **Maintain Structure:** Avoid unnecessarily drastic changes to the overall tree shape (e.g., adding many new levels of depth) unless the user's instruction explicitly asks for it.
8.  **Final Check:** Before outputting, double-check that your entire response is a single JSON object starting with { and ending with }, and that the root object and all its children have all the mandatory fields.
`;

  const fullPrompt = `
Current Tree (JSON):
\`\`\`json
${JSON.stringify(currentTree, null, 2)}
\`\`\`
Locked Node IDs (core properties must not change): ${JSON.stringify(lockedNodeIds)}
User instruction: "${modificationPrompt}"

Output the complete, modified JSON for the tech tree, adhering to ALL rules above. Respond ONLY with the JSON.
`;
  try {
    const model = apiClientState.client.getGenerativeModel({ 
      model: "gemini-1.5-flash-latest",
      systemInstruction: { parts: [{ text: systemInstruction }], role: "model" },
      generationConfig: { 
        responseMimeType: "application/json", 
        temperature: 0.35, topK: 45, topP: 0.90 
      },
    });

    const result = await model.generateContent(fullPrompt);
    const response = result.response;
    
    let parsedData = parseGeminiJsonResponse(response.text(), true);

    if (Array.isArray(parsedData)) {
        if (parsedData.length > 0 && parsedData.every(isValidTechTreeNodeShape)) {
             parsedData = { 
                id: 'NEW_NODE_ROOT_WRAPPER', 
                name: `${currentTree.name || 'Modified Tree'} (Wrapped Multi-Root)`,
                description: "AI suggested multiple root nodes; this is an auto-generated wrapper.",
                isLocked: false, importance: 'common', children: parsedData,
                linkedProjectId: currentTree.linkedProjectId || null,
                linkedProjectName: currentTree.linkedProjectName || null,
            };
        } else { 
            console.error("Gemini modification resulted in an un-wrappable array or array with invalid items:", parsedData);
            throw new Error("AI suggestion resulted in an array of nodes that cannot be auto-wrapped or contains invalid nodes.");
        }
    }

    if (!isValidTechTreeNodeShape(parsedData)) {
        console.error("Gemini modification resulted in invalid JSON root structure after potential wrap.", parsedData);
        throw new Error("AI suggestion has an invalid root structure (e.g., name/children/importance missing or invalid type).");
    }
    
    return initializeNodes(parsedData);

  } catch (error) {
    console.error("Error modifying tech tree via Gemini API:", error);
    throw constructApiError(error, "Failed to modify tech tree using AI.", { prompt: fullPrompt, rawResponse: error.rawResponse });
  }
};

export const summarizeText = async (textToSummarize) => {
  if (!apiClientState.client || !apiClientState.isKeyAvailable) {
    throw new Error("Gemini API client not initialized. Set a valid API Key in 'Workspace' -> 'API Key Setup'.");
  }

  const prompt = `You are a helpful assistant. Summarize the following text, which describes a hierarchical tech tree or skill tree. 
Provide a concise overview (100-150 words), highlighting its main purpose, key branches, and overall theme or focus.
Do not use markdown formatting in your response.

Raw Text to Summarize:
---
${textToSummarize.substring(0, 30000)} 
---

Concise Summary (100-150 words, plain text only):`;

  try {
    const model = apiClientState.client.getGenerativeModel({ 
      model: "gemini-1.5-flash-latest",
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
};

export const generateNodeInsights = async (
    node,
    parentNode,
    siblingNodes, 
    childNodes,
    projectContext
) => {
    if (!apiClientState.client || !apiClientState.isKeyAvailable) {
        throw new Error("Gemini API client not initialized. Set a valid API Key.");
    }

    const parentInfo = parentNode ? `It is a child of "${parentNode.name}".` : "It is a root node.";
    const childrenInfo = childNodes.length > 0
        ? `Its current children are: ${childNodes.map(c => `"${c.name}"`).join(', ')}.`
        : "It currently has no children.";
    const siblingInfo = siblingNodes.length > 0
        ? `Its sibling nodes (other children of the same parent) are: ${siblingNodes.map(s => `"${s.name}"`).join(', ')}.`
        : "It has no sibling nodes (it's either a root or an only child).";

    const prompt = `
Context for the entire tech tree project: "${projectContext || 'General Technology/Skills'}"

Analyze the following specific node within this tech tree:
Node Name: "${node.name}"
Node Description: "${node.description || '(No description provided)'}"
Node Importance: "${node.importance || 'Common'}"
${parentInfo}
${siblingInfo}
${childrenInfo}

Based on this information and the project context, provide the following insights in JSON format:
1.  "suggested_description": A concise (1-2 sentences, max 150 characters) and insightful alternative or improved description for this node. This string must be valid JSON content.
2.  "alternative_names": An array of 2-3 short, distinct strings. Each string must be a valid JSON string value (e.g., ["Synonym 1", "Alternate Term"]).
3.  "potential_children": An array of 2-4 distinct potential new child nodes that would logically extend from THIS node ("${node.name}"). For each potential child, provide a "name" (string, concise) and a "description" (string, 1 sentence, max 100 characters). All strings must be valid JSON content.
4.  "key_concepts": An array of 2-3 key concepts, technologies, or skills closely related to THIS node but not necessarily direct children. Each string must be a valid JSON string value.

Output JSON structure must be:
{
  "suggested_description": "string",
  "alternative_names": ["string", "string", ...],
  "potential_children": [
    { "name": "string", "description": "string" },
    { "name": "string", "description": "string" },
    ...
  ],
  "key_concepts": ["string", "string", ...]
}
Adhere strictly to JSON syntax: all strings enclosed in double quotes, no trailing commas. Ensure no extraneous text appears between a field's value (e.g., after a description string's closing quote) and the next comma or closing brace/bracket, or after the final closing brace of the JSON object.
Respond ONLY with the JSON object. No extra text or markdown.
`;

    try {
        const model = apiClientState.client.getGenerativeModel({ 
          model: "gemini-1.5-flash-latest",
          generationConfig: { 
            responseMimeType: "application/json", 
            temperature: 0.45, topK: 50, topP: 0.93 
          },
        });
        
        const result = await model.generateContent(prompt);
        const response = result.response;
        return parseGeminiJsonResponseForInsights(response.text());
    } catch (error) {
        console.error("Error generating node insights from Gemini API:", error);
        throw constructApiError(error, "Failed to generate AI insights for the node.");
    }
};

export const generateStrategicSuggestions = async (
  projectContext,
  currentTreeSummary
) => {
  if (!apiClientState.client || !apiClientState.isKeyAvailable) {
    throw new Error("Gemini API client not initialized. Set a valid API Key.");
  }

  const systemInstruction = `You are an AI assistant that provides strategic suggestions for a project.
You MUST respond with a single, valid JSON array of strings.
Example: ["Suggestion 1", "Suggestion 2", "Suggestion 3"]
Output ONLY the JSON array. NO extra text, explanations, or markdown fences.
`;

  const prompt = `
Project Context: "${projectContext}"
Current Tree Summary: "${currentTreeSummary}"

Based on the project context and the current state of the tree, suggest 3-5 high-level strategic next steps, new major branches, or key areas of focus that would logically extend, complement, or significantly enhance this project.
Each suggestion should be a concise, actionable phrase or short sentence.
`;

  try {
    const model = apiClientState.client.getGenerativeModel({ 
      model: "gemini-1.5-flash-latest",
      systemInstruction: { parts: [{ text: systemInstruction }], role: "model" },
      generationConfig: { 
        responseMimeType: "application/json", 
        temperature: 0.6, topK: 50, topP: 0.95 
      },
    });
    
    const result = await model.generateContent(prompt);
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
    throw constructApiError(error, "Failed to generate AI strategic suggestions.");
  }
};




