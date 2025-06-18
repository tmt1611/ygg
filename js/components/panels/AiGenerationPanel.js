import React from 'react';
import ContextualHelpTooltip from '../ContextualHelpTooltip.js';

const AiGenerationPanel = ({
  initialPrompt,
  setInitialPrompt,
  handleGenerateTree,
  isLoadingInitial,
  generateUIDisabled,
  activeUserProjectExists,
  apiKeyIsSet
}) => {
  return (
    React.createElement("fieldset", null,
      React.createElement("legend", null, "AI Structure Generation / Context ", React.createElement(ContextualHelpTooltip, { helpText: "Describe the main topic or overall context for your tech tree. The AI will use this to generate an initial structure or regenerate the structure for the active project. If no project is active, a new one will be created using this context as its name." })),
      React.createElement("label", { htmlFor: "techTreeContextPrompt", style: {marginBottom: '5px'}}, "Project Context / AI Topic:"),
      React.createElement("textarea", { id: "techTreeContextPrompt", style: { width: '100%', minHeight: '100px', resize: 'vertical', marginBottom: '10px' },
        placeholder: "e.g., 'Machine Learning Fundamentals', 'Game Development Pipeline', 'Sustainable Energy Sources'",
        value: initialPrompt, onChange: (e) => setInitialPrompt(e.target.value),
        disabled: generateUIDisabled, "aria-describedby": generateUIDisabled && !apiKeyIsSet ? "prompt-disabled-reason-gen" : undefined, 
        title: "Describe the main topic or context for the tech tree. This will guide AI generation."
      }),
      React.createElement("button", { onClick: handleGenerateTree, disabled: generateUIDisabled || !initialPrompt.trim(),
        style: { width: '100%', padding: '10px' }, className: "primary", "aria-busy": isLoadingInitial,
        title: generateUIDisabled ? (apiKeyIsSet ? "Enter a prompt first" : "API Key required") : (activeUserProjectExists ? "Regenerate structure for current project based on this context" : "Generate a new project and structure based on this context")
      },
        isLoadingInitial ? ( 
          React.createElement("span", {style: {display: 'flex', alignItems: 'center', justifyContent: 'center'}},
            React.createElement("span", {className: "basic-spinner-animation", style: {display: 'inline-block', width: '1.2em', height: '1.2em', border: '3px solid rgba(255,255,255,0.3)', borderLeftColor: '#fff', borderRadius: '50%', marginRight: '8px'}}),
            "Generating..."
          )
        ) : (activeUserProjectExists ? 'Regenerate Structure for Context' : 'Generate New Structure')
      ),
      React.createElement("p", {style: {fontSize: '0.85em', color: 'var(--text-tertiary)', marginTop: '8px'}},
        "This will generate or regenerate the tree for the current project context (topic). If no project is active (e.g., after starting from an example), a new one will be created using this context as its name."
      ),
      generateUIDisabled && !apiKeyIsSet && React.createElement("p", { id: "prompt-disabled-reason-gen", style: { fontSize: '0.9em', textAlign: 'center', marginTop: '10px', color: 'var(--error-color)' }}, "AI features disabled. Set API Key.")
    )
  );
};

export default AiGenerationPanel;