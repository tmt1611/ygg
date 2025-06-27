import React, { useState } from 'react';
import LoadingSpinner from '../LoadingSpinner.js';
import ErrorMessage from '../ErrorMessage.js';
import { getPromptTextFor } from '../../services/geminiService.js';


const AiInsightsTab = ({
  insightsData,
  isLoading,
  error,
  onGenerateInsights,
  onApplyManualInsights,
  onPreviewAndUseDescription,
  onAddSuggestedChildToNode,
  onAddNewBranchToRoot,
  setModificationPrompt,
  setActiveSidebarTab,
  isAppBusy,
  apiKeyIsSet,
  hasTechTreeData,
  techTreeData,
  contextText,
  modalManager,
}) => {
  const [selectedCritiques, setSelectedCritiques] = useState(new Set());

  const handleCritiqueSelectionChange = (critiqueIdentifier, isSelected) => {
    setSelectedCritiques(prev => {
      const newSet = new Set(prev);
      if (isSelected) {
        newSet.add(critiqueIdentifier);
      } else {
        newSet.delete(critiqueIdentifier);
      }
      return newSet;
    });
  };

  const handleSendCritiquesToModifier = () => {
    if (selectedCritiques.size === 0) return;

    const critiquesToApply = insightsData.key_node_insights
      .filter(item => selectedCritiques.has(item.node_id))
      .map(item => `Regarding the node "${item.node_name}", the AI suggested: "${item.critique}". Please apply this critique.`);
    
    const fullPrompt = `Please apply the following critiques to the tech tree:\n- ${critiquesToApply.join('\n- ')}`;
    
    setModificationPrompt(fullPrompt);
    setActiveSidebarTab('ai-tools');
    setSelectedCritiques(new Set()); // Clear selection after use
  };

  const fetchButtonDisabled = !hasTechTreeData || !apiKeyIsSet || isLoading || isAppBusy;
  let fetchButtonTitle = "Generate AI-powered insights for the entire project";
  if (!hasTechTreeData) fetchButtonTitle = "Load a project to generate insights";
  else if (!apiKeyIsSet) fetchButtonTitle = "API key required for insights";
  else if (isLoading) fetchButtonTitle = "Insights generation in progress...";
  else if (isAppBusy) fetchButtonTitle = "Application is busy, please wait.";
  
  const handleShowPrompt = () => {
    if (!techTreeData) return;
    const promptText = getPromptTextFor('projectInsights', { tree: techTreeData, context: contextText });
     modalManager.openTechExtractionModal(
      promptText,
      "AI Project Insights Prompt"
    );
  };

  const handlePasteInsights = () => {
    let pastedJson = '';
    const handleInputChange = (e) => {
      pastedJson = e.target.value;
    };
    modalManager.openConfirmModal({
      title: "Paste AI Insights JSON",
      message: React.createElement('div', null,
        React.createElement('p', {style: {marginBottom: '10px'}}, 'Paste the complete JSON object from your external AI tool below.'),
        React.createElement('textarea', {
          onChange: handleInputChange,
          style: { width: '100%', minHeight: '200px', resize: 'vertical', fontFamily: 'monospace' },
          placeholder: '{"overall_summary": "...", "key_node_insights": [...], "suggested_new_branches": [...] }'
        })
      ),
      confirmText: "Apply Insights",
      onConfirm: () => {
        if (!pastedJson.trim()) {
          return;
        }
        onApplyManualInsights(pastedJson);
        modalManager.closeConfirmModal();
      },
    });
  };

  return (
    React.createElement("div", { className: "ai-insights-panel" },
      React.createElement("div", { className: "panel-header", style: { display: 'block' } },
        React.createElement("div", { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center'}},
          React.createElement("span", { className: "panel-header-icon", style: { fontSize: '1.2em' } }, "💡"),
          React.createElement("h3", { style: { fontSize: '1.05em', flexGrow: 1 } }, "Project Insights"),
        ),
        React.createElement("div", { style: { display: 'flex', gap: '8px', marginTop: '10px' } },
          React.createElement("button", {
            onClick: onGenerateInsights,
            disabled: fetchButtonDisabled,
            className: "primary panel-button",
            style: { flexGrow: 1 },
            title: fetchButtonTitle
          }, isLoading ? React.createElement("span", { className: "basic-spinner-animation" }) : '✨ Generate'),
          React.createElement("button", {
            onClick: handlePasteInsights,
            disabled: !hasTechTreeData || isLoading || isAppBusy,
            className: "secondary panel-button",
            style: { flexGrow: 1 },
            title: "Paste insights from an external AI tool"
          }, "Paste..."),
          React.createElement("button", {
            onClick: handleShowPrompt,
            disabled: !hasTechTreeData || isLoading || isAppBusy,
            className: "secondary panel-button",
            title: "Show the prompt that will be sent to the AI"
          }, '📋')
        )
      ),

      isLoading && !insightsData && React.createElement(LoadingSpinner, { message: "Analyzing Project..." }),
      error && React.createElement(ErrorMessage, { error: error, mode: "inline" }),

      insightsData ? (
        React.createElement("div", { className: "ai-insights-content-sections" },
          React.createElement("div", { className: "ai-insights-section" },
            React.createElement("h4", null, "Overall Summary"),
            React.createElement("p", { className: "ai-insight-text" }, insightsData.overall_summary)
          ),

          insightsData.key_node_insights?.length > 0 && (
            React.createElement("div", { className: "ai-insights-section" },
              React.createElement("div", { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' } },
                React.createElement("h4", null, "Key Node Insights"),
                React.createElement("button", {
                  onClick: handleSendCritiquesToModifier,
                  disabled: selectedCritiques.size === 0 || isAppBusy,
                  className: "secondary panel-button",
                  style: { padding: '3px 8px', fontSize: '0.8em' },
                  title: "Send selected critiques to the Tree Modifier AI"
                }, `Send ${selectedCritiques.size} to Modifier`)
              ),
              React.createElement("ul", { className: "ai-insights-list" },
                insightsData.key_node_insights.map((item, index) => (
                  React.createElement("li", { key: `key-node-${index}`, style: { alignItems: 'flex-start', gap: '8px' }},
                    React.createElement("input", {
                      type: "checkbox",
                      id: `critique-checkbox-${item.node_id}`,
                      checked: selectedCritiques.has(item.node_id),
                      onChange: (e) => handleCritiqueSelectionChange(item.node_id, e.target.checked),
                      "aria-label": `Select critique for ${item.node_name}`,
                      style: { marginTop: '6px', flexShrink: 0 }
                    }),
                    React.createElement("div", { className: "ai-insights-list-item-content", style: { display: 'flex', flexDirection: 'column', gap: '6px'} },
                      React.createElement("label", { htmlFor: `critique-checkbox-${item.node_id}`, style: { cursor: 'pointer' } },
                        React.createElement("span", { className: "ai-insights-list-item-name" }, item.node_name),
                        React.createElement("p", { className: "ai-insights-list-item-desc" }, item.critique)
                      ),
                       item.suggested_description && React.createElement("button", {
                        onClick: () => onPreviewAndUseDescription(item.node_id, item.node_name, item.suggested_description),
                        disabled: isAppBusy,
                        className: "secondary panel-button ai-insights-action-button",
                        title: `Preview and apply suggested description for "${item.node_name}"`
                      }, "Preview & Use Description"),
                      item.suggested_children && item.suggested_children.length > 0 && (
                        React.createElement("div", { style: { marginTop: '8px' } },
                          React.createElement("h5", { style: { fontSize: '0.8em', fontWeight: 'bold', color: 'var(--text-secondary)', margin: '0 0 4px 0', textTransform: 'uppercase', letterSpacing: '0.5px' } }, "Suggested Children:"),
                          React.createElement("ul", { className: "ai-insights-list" },
                            item.suggested_children.map((child, childIndex) => (
                              React.createElement("li", { key: `sug-child-${item.node_id}-${childIndex}` },
                                React.createElement("div", { className: "ai-insights-list-item-content" },
                                  React.createElement("span", { className: "ai-insights-list-item-name" }, child.name),
                                  React.createElement("p", { className: "ai-insights-list-item-desc" }, child.description)
                                ),
                                React.createElement("button", {
                                  onClick: () => onAddSuggestedChildToNode(item.node_id, child.name, child.description),
                                  disabled: isAppBusy,
                                  className: "add-child-btn base-icon-button",
                                  title: `Add "${child.name}" as a child to "${item.node_name}"`
                                }, "➕")
                              )
                            ))
                          )
                        )
                      )
                    )
                  )
                ))
              )
            )
          ),

          insightsData.suggested_new_branches?.length > 0 && (
            React.createElement("div", { className: "ai-insights-section" },
              React.createElement("h4", null, "Suggested New Branches"),
              React.createElement("ul", { className: "ai-insights-list" },
                insightsData.suggested_new_branches.map((branch, index) => (
                  React.createElement("li", { key: `new-branch-${index}`},
                    React.createElement("div", { className: "ai-insights-list-item-content" },
                      React.createElement("span", { className: "ai-insights-list-item-name" }, branch.name),
                      React.createElement("p", { className: "ai-insights-list-item-desc" }, branch.description)
                    ),
                    React.createElement("button", {
                      onClick: () => onAddNewBranchToRoot(branch.name, branch.description),
                      disabled: isAppBusy,
                      className: "add-child-btn base-icon-button",
                      title: `Add "${branch.name}" as a new top-level branch`
                    }, "➕")
                  )
                ))
              )
            )
          )
        )
      ) : (
        !isLoading && !error && React.createElement("p", { style: { fontStyle: 'italic', textAlign: 'center', color: 'var(--text-tertiary)', padding: '10px' } }, "Click ✨ to generate insights for the current project.")
      )
    )
  );
};
export default AiInsightsTab;