import React from 'react';
import LoadingSpinner from '../LoadingSpinner.js';
import ErrorMessage from '../ErrorMessage.js';
import { getPromptTextFor } from '../../services/geminiService.js';


const AiInsightsTab = ({
  insightsData,
  isLoading,
  error,
  onGenerateInsights,
  onUseDescription,
  onAddSuggestedChildToNode,
  onAddNewBranchToRoot,
  isAppBusy,
  apiKeyIsSet,
  hasTechTreeData,
  techTreeData,
  contextText,
  modalManager,
}) => {

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
          }, isLoading ? React.createElement("span", { className: "basic-spinner-animation" }) : '✨ Generate Insights'),
          React.createElement("button", {
            onClick: handleShowPrompt,
            disabled: fetchButtonDisabled,
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
              React.createElement("h4", null, "Key Node Insights"),
              React.createElement("ul", { className: "ai-insights-list" },
                insightsData.key_node_insights.map((item, index) => (
                  React.createElement("li", { key: `key-node-${index}`},
                    React.createElement("div", { className: "ai-insights-list-item-content" },
                      React.createElement("span", { className: "ai-insights-list-item-name" }, item.node_name),
                      React.createElement("p", { className: "ai-insights-list-item-desc" }, item.critique),
                       React.createElement("button", {
                        onClick: () => onUseDescription(item.node_id, item.suggested_description),
                        disabled: isAppBusy,
                        className: "secondary panel-button ai-insights-action-button",
                        title: `Apply this description to "${item.node_name}"`
                      }, "Use Suggested Description")
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