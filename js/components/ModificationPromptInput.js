
import React from 'react';

const ModificationPromptInput = ({
  prompt,
  setPrompt,
  onModify,
  isLoading,
  disabled,
  isApiKeySet,
  hasTreeData,
  labelOverride,
}) => {
  
  let disabledMessage = "";
  if (disabled) {
    if (!isApiKeySet) {
      disabledMessage = "AI modifications disabled. Please set a valid API Key.";
    } else if (!hasTreeData) {
      disabledMessage = "No base structure to modify. Generate or load a structure first, or ensure a suggestion is active.";
    }
  }

  return (
    React.createElement("div", { style: { display: 'flex', flexDirection: 'column', gap: '10px' }},
      React.createElement("label", { htmlFor: "techTreeModificationPrompt" },
        labelOverride || "Editor AI" 
      ),
      React.createElement("textarea", {
        id: "techTreeModificationPrompt",
        style: { width: '100%', minHeight: '80px', resize: 'vertical' },
        placeholder: "e.g., 'Make the 'Elven Armor' node more detailed.'",
        value: prompt,
        onChange: (e) => setPrompt(e.target.value),
        disabled: isLoading || disabled,
        "aria-label": labelOverride || "Editor AI prompt input"
      }),
      React.createElement("button", {
        onClick: onModify,
        disabled: isLoading || disabled || !prompt.trim(),
        style: { width: '100%', padding: '8px' },
        className: "primary",
        "aria-busy": isLoading
      },
        isLoading ? (
          React.createElement("span", {style: {display: 'flex', alignItems: 'center', justifyContent: 'center'}},
            React.createElement("span", {className: "basic-spinner-animation", style: {display: 'inline-block', width: '1.2em', height: '1.2em', border: '3px solid rgba(255,255,255,0.3)', borderLeftColor: '#fff', borderRadius: '50%', marginRight: '8px', verticalAlign: 'middle'}}),
            "Suggesting..."
          )
        ) : (
          'Suggest Modifications'
        )
      ),
      disabled && disabledMessage && React.createElement("p", { style: { fontSize: '0.9em', color: 'var(--text-secondary)', marginTop: '5px', textAlign: 'center' }}, disabledMessage)
    )
  );
};

export default ModificationPromptInput;
