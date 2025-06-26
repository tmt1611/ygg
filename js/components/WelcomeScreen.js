import React, { useState } from 'react';
import { getPromptTextFor } from '../services/geminiService.js';

const WelcomeScreen = ({
  initialPrompt,
  setInitialPrompt,
  handleGenerateTree,
  isLoadingInitial,
  apiKeyIsSet,
  onAddNewProjectFromFile,
  onPasteNewProject,
  onLoadAndGoToGraph,
  exampleProjects,
  isAppBusy,
  apiKeyHook,
  modalManager,
}) => {
  
  const [localApiKey, setLocalApiKey] = useState('');

  const handleShowPrompt = () => {
    if (!initialPrompt.trim() || !modalManager) return;
    const promptText = getPromptTextFor('generateTree', { prompt: initialPrompt });
    modalManager.openTechExtractionModal(promptText, "AI Structure Generation Prompt");
  };

  const handleImportClick = () => {
    document.getElementById('import-project-input-welcome')?.click();
  };

  const handleSetApiKey = () => {
    if (apiKeyHook && localApiKey.trim()) {
      apiKeyHook.setApiKey(localApiKey.trim());
    }
  };

  return (
    React.createElement("div", { className: "welcome-screen-container" },
      React.createElement("div", { className: "welcome-screen-content" },
        React.createElement("h1", { className: "welcome-screen-title" }, "Welcome to Yggdrasil"),
        React.createElement("p", { className: "welcome-screen-subtitle" }, "The World Tree of Knowledge. Plant a seed of an idea and watch it grow."),
        
        React.createElement("div", { className: "welcome-screen-main-action" },
          React.createElement("textarea", { 
            id: "welcome-prompt-input",
            placeholder: "Enter a topic to generate your first project, e.g., 'The History of Ancient Rome'",
            value: initialPrompt,
            onChange: (e) => setInitialPrompt(e.target.value),
            disabled: isLoadingInitial || isAppBusy,
            rows: 3
          }),

          !apiKeyIsSet && (
            React.createElement("div", { style: { margin: '15px 0', borderTop: '1px solid var(--border-color)', paddingTop: '15px' }},
              React.createElement("p", { style: { fontSize: '0.9em', color: 'var(--text-secondary)', margin: '0 0 8px 0' }},
                "To generate a project, first enter your Gemini API Key. ",
                React.createElement("a", { href: "https://aistudio.google.com/app/apikey", target: "_blank", rel: "noopener noreferrer" }, "Get a key here.")
              ),
              React.createElement("div", { style: { display: 'flex', gap: '8px' }},
                React.createElement("input", {
                  type: "password",
                  placeholder: "Paste your Gemini API Key here",
                  value: localApiKey,
                  onChange: (e) => setLocalApiKey(e.target.value),
                  disabled: isLoadingInitial || isAppBusy || apiKeyHook.isProcessing,
                  style: { flexGrow: 1 }
                }),
                React.createElement("button", {
                  onClick: handleSetApiKey,
                  disabled: !localApiKey.trim() || isLoadingInitial || isAppBusy || apiKeyHook.isProcessing,
                  className: "secondary"
                },
                  apiKeyHook.isProcessing ? 'Setting...' : 'Set Key'
                )
              ),
              apiKeyHook.status.message && apiKeyHook.status.type === 'error' && (
                React.createElement("p", { style: { fontSize: '0.85em', color: 'var(--error-color)', marginTop: '5px', textAlign: 'left' }},
                  apiKeyHook.status.message
                )
              )
            )
          ),

          React.createElement("button", {
            onClick: handleGenerateTree,
            disabled: !apiKeyIsSet || isLoadingInitial || isAppBusy || !initialPrompt.trim(),
            className: "primary welcome-generate-button"
          }, 
            isLoadingInitial ? "Generating..." : "🌳 Generate Project"
          ),
          !apiKeyIsSet && !apiKeyHook.status.message && React.createElement("p", { className: "welcome-api-key-warning" }, "An API Key is required for AI generation.")
        ),

        React.createElement("div", { className: "welcome-screen-secondary-actions" },
          React.createElement("button", { onClick: handleImportClick, className: "secondary" }, "Import from File..."),
          React.createElement("input", { type: "file", id: "import-project-input-welcome", accept: ".json,.project.json", onChange: onAddNewProjectFromFile, style: { display: 'none' } }),
          React.createElement("span", null, "or"),
          React.createElement("button", { onClick: onPasteNewProject, className: "secondary" }, "Paste from JSON..."),
          React.createElement("span", null, "or start from an example:")
        ),

        React.createElement("div", { className: "welcome-example-projects" },
          exampleProjects.map(project => (
            React.createElement("button", { 
              key: project.id,
              className: "example-project-card",
              onClick: () => onLoadAndGoToGraph(project.id),
              disabled: isAppBusy
            },
              React.createElement("span", { className: "example-project-icon" }, "⭐"),
              React.createElement("span", { className: "example-project-name" }, project.name)
            )
          ))
        )
      )
    )
  );
};

export default WelcomeScreen;