import React from 'react';
import ContextualHelpTooltip from '../ContextualHelpTooltip.js';
import { AVAILABLE_MODELS } from '../../services/geminiService.js';

const ApiKeySetupPanel = ({ apiKeyHook, controlsDisabled }) => {
  const {
    selectedModel,
    setSelectedModel,
    inputKey: apiKeyInput,
    setInputKey: setApiKeyInput,
    setApiKey: handleSetApiKey,
    status: apiKeyStatus,
    isProcessing: isApiKeyProcessing,
    clearActiveUserKey
  } = apiKeyHook;

  return (
    React.createElement("div", null,
      React.createElement("div", { style: { display: 'flex', flexDirection: 'column', gap: '10px' }},
        React.createElement("div", null,
          React.createElement("h4", { className: "panel-sub-header", style: { margin: '0 0 8px 0' } }, "Gemini API Key"),
          React.createElement("p", { style: { fontSize: '0.85em', color: 'var(--text-tertiary)', marginBottom: '5px' }},
            "Key stored in memory for this session. Get your key from ", React.createElement("a", { href: "https://aistudio.google.com/app/apikey", target: "_blank", rel: "noopener noreferrer", title: "Opens Google AI Studio in a new tab" }, "Google AI Studio"), "."
          ),
          React.createElement("div", { style: { display: 'flex', flexDirection: 'column', gap: '8px' }},
            React.createElement("input", { type: "password", id: "apiKeyInput", value: apiKeyInput, onChange: (e) => setApiKeyInput(e.target.value),
              placeholder: "Paste your Gemini API Key", style: { flexGrow: 1, minWidth: 0 },
              "aria-label": "Gemini API Key input", disabled: isApiKeyProcessing || controlsDisabled }),
            React.createElement("button", { 
              onClick: () => handleSetApiKey(apiKeyInput), 
              disabled: isApiKeyProcessing || controlsDisabled || !apiKeyInput.trim(), 
              className: "secondary",
              title: "Submit and use the entered API Key for the current session"
            },
              isApiKeyProcessing ? 'Setting...' : 'Set API Key'
            )
          ),
          apiKeyStatus.isSet && (
            React.createElement("button", { onClick: clearActiveUserKey, disabled: isApiKeyProcessing || controlsDisabled, className: "secondary", style: {width: '100%', marginTop: '10px'}, title: "Clear the currently active API key."},
              isApiKeyProcessing ? 'Clearing...' : 'Clear Active Key'
            )
          ),
          apiKeyStatus.message && ( React.createElement("p", { className: `api-key-status-message ${apiKeyStatus.type || 'info'}`}, apiKeyStatus.message) )
        ),

        React.createElement("div", null,
          React.createElement("h4", { className: "panel-sub-header", style: { margin: '8px 0' } }, "AI Model Selection"),
          React.createElement("select", {
            id: "ai-model-select",
            value: selectedModel,
            onChange: e => setSelectedModel(e.target.value),
            disabled: controlsDisabled,
            title: "Select the AI model for generation and modification tasks"
          },
            AVAILABLE_MODELS.map(model => 
              React.createElement("option", { key: model.id, value: model.id }, model.name)
            )
          ),
          !apiKeyStatus.isSet && !isApiKeyProcessing && ( 
            React.createElement("div", { className: "api-key-warning-block", style: {marginTop: '15px'}}, React.createElement("p", null, "AI Features Disabled"), React.createElement("p", null, "Configure a valid Gemini API Key above."))
          )
        )
      )
    )
  );
};

export default ApiKeySetupPanel;