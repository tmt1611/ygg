import React from 'react';
import ContextualHelpTooltip from '../ContextualHelpTooltip.js';
import { getPromptTextFor } from '../../services/geminiService.js';

const DataOperationsPanel = ({
  handleDownloadTree,
  onExtractData,
  extractionMode,
  setExtractionMode,
  isSummarizing,
  currentTreeExists,
  controlsDisabled,
  apiKeyIsSet,
  modalManager,
  techTreeData,
  contextText
}) => {
  const extractButtonDisabled = controlsDisabled || !currentTreeExists || (extractionMode === 'summary' && !apiKeyIsSet);

  const handleShowSummaryPrompt = () => {
    if (!apiKeyIsSet || !currentTreeExists || !techTreeData) return;
    const projectSummaryContext = `Project: ${contextText || 'Unnamed Project'}\nContext: ${contextText}\nNodes:\n${JSON.stringify(techTreeData, (key, value) => (key.startsWith('_') ? undefined : value), 2)}`;
    const promptText = getPromptTextFor('summarize', { text: projectSummaryContext });
    modalManager.openTechExtractionModal(promptText, "AI Summary Prompt");
  };

  const handleManualSummary = () => {
    let pastedText = '';
    const handleInputChange = (e) => { pastedText = e.target.value; };
    modalManager.openConfirmModal({
      title: "Paste Manual Summary",
      message: React.createElement('div', null,
        React.createElement('p', {style: {marginBottom: '10px'}}, 'Paste the summary text from your external AI tool below.'),
        React.createElement('textarea', {
          onChange: handleInputChange,
          style: { width: '100%', minHeight: '150px', resize: 'vertical' },
          placeholder: 'The project is about...'
        })
      ),
      confirmText: "Show Summary",
      onConfirm: () => {
        if (!pastedText.trim()) return;
        modalManager.openTechExtractionModal(pastedText, "Manual AI Summary");
        modalManager.closeConfirmModal();
      }
    });
  };

  return (
    React.createElement("div", null,
      React.createElement("div", { style: { display: 'flex', flexDirection: 'column', gap: '15px' }},
        React.createElement("button", { onClick: handleDownloadTree, disabled: !currentTreeExists || controlsDisabled, className: "secondary", title: !currentTreeExists ? "No active project or tree data to save/download" : "Save the current state of the active project (or save new if based on example) and download it as a .project.json file" },
          "Save Active Project & Download"
        ),
        React.createElement("hr", { style: { margin: '5px 0' }}),
        React.createElement("div", null, 
          React.createElement("h4", { style: { fontSize: '1.05em', marginBottom: '10px', color: 'var(--text-primary)' }}, "Data Extraction Mode:"),
          React.createElement("div", { style: { border: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}, 
            React.createElement("label", { style: { display: 'flex', alignItems: 'center', cursor: (controlsDisabled || !currentTreeExists) ? 'not-allowed' : 'pointer' }},
              React.createElement("input", { type: "radio", name: "extractionMode", value: "raw", checked: extractionMode === 'raw', onChange: () => setExtractionMode('raw'), style: { marginRight: '8px' }, disabled: controlsDisabled || !currentTreeExists }),
              "Raw Text (Nodes & Context)",
              React.createElement(ContextualHelpTooltip, { helpText: "Outputs node names, descriptions, and the current project context as plain text." })
            ),
            React.createElement("label", { style: { display: 'flex', alignItems: 'center', cursor: !apiKeyIsSet || controlsDisabled || !currentTreeExists ? 'not-allowed' : 'pointer' }},
              React.createElement("input", { type: "radio", name: "extractionMode", value: "summary", checked: extractionMode === 'summary',
                onChange: () => setExtractionMode('summary'), style: { marginRight: '8px' },
                disabled: !apiKeyIsSet || controlsDisabled || !currentTreeExists }),
              "AI Summary of Structure",
              React.createElement(ContextualHelpTooltip, { helpText: "Uses AI to generate a concise summary of the current project's structure. Requires a valid API Key." }),
              React.createElement("button", {
                onClick: (e) => { e.preventDefault(); handleShowSummaryPrompt(); },
                disabled: !apiKeyIsSet || !currentTreeExists,
                className: "base-icon-button",
                style: { marginLeft: 'auto', padding: '2px', fontSize: '1em' },
                title: "Show summary prompt"
              }, "📋"),
              !apiKeyIsSet && currentTreeExists && React.createElement("span", { style: { fontSize: '0.8em', color: 'var(--error-color)', marginLeft: '8px' }}, "(API Key Required)")
            )
          ),
          React.createElement("button", { onClick: onExtractData,
            disabled: extractButtonDisabled,
            className: "secondary", style: { width: '100%', marginTop: '12px' },
            title: extractButtonDisabled ? (apiKeyIsSet && currentTreeExists ? "AI is busy or no active project" : currentTreeExists ? "API Key required for summary" : "No active project") : "Extract data from the active project based on selected mode"
          },
            isSummarizing ? (
              React.createElement("span", { style: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }},
                React.createElement("span", { className: "basic-spinner-animation" }),
                "Summarizing..."
              )
            ) : 'Extract Data'
          ),
          React.createElement("hr", { style: { margin: '15px 0' }}),
          React.createElement("button", {
            onClick: handleManualSummary,
            disabled: controlsDisabled,
            className: "secondary",
            style: { width: '100%' },
            title: "Paste a summary from an external AI tool to view it in a modal."
          }, "Paste & View Manual Summary...")
        )
      )
    )
  );
};

export default DataOperationsPanel;