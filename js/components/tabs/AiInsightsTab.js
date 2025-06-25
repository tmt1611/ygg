import React from 'react';
import LoadingSpinner from '../LoadingSpinner.js';
import ErrorMessage from '../ErrorMessage.js';

const InsightListItem = ({ item, onAction, actionIcon, actionTitle, isAppBusy, children }) => (
  React.createElement("li", null,
    React.createElement("div", { className: "ai-insights-list-item-content" },
      React.createElement("span", { className: "ai-insights-list-item-name" }, item.name || item),
      children
    ),
    React.createElement("button", { 
      onClick: () => onAction(item), 
      disabled: isAppBusy, 
      className: "add-child-btn base-icon-button", 
      title: actionTitle
    }, actionIcon)
  )
);

const AiInsightsTab = ({
  node,
  insightsData,
  isLoading,
  error,
  onGenerateInsights,
  onUseDescription,
  onUseAlternativeName,
  onAddSuggestedChild,
  isAppBusy,
  apiKeyIsSet,
  modalManager,
}) => {
  if (!node) {
    return React.createElement("p", { style: { textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '0.9em', padding: '15px 5px' } }, "Select a node in Graph, List, or Focus view to see Node Insight.");
  }

  const fetchButtonDisabled = !node || !apiKeyIsSet || isLoading || isAppBusy;
  let fetchButtonTitle = "Fetch AI-generated insights for this node";
  if (!apiKeyIsSet) fetchButtonTitle = "API key required for insights";
  else if (isLoading) fetchButtonTitle = "Insights generation in progress...";
  else if (isAppBusy) fetchButtonTitle = "Application is busy, please wait.";

  return (
    React.createElement("div", { className: "ai-insights-panel" },
      React.createElement("div", { className: "panel-header" },
        React.createElement("span", { className: "panel-header-icon", style: { fontSize: '1.2em' } }, "💡"),
        React.createElement("h3", { style: { fontSize: '1.05em' } }, `Analysis for: ${node.name.substring(0, 18)}${node.name.length > 18 ? '...' : ''}`),
        React.createElement("div", { className: "panel-header-actions" },
          React.createElement("button", {
            onClick: onGenerateInsights,
            disabled: fetchButtonDisabled,
            className: "base-icon-button primary",
            title: fetchButtonTitle,
            style: { padding: '5px' }
          }, isLoading ? React.createElement("span", { className: "basic-spinner-animation" }) : '✨')
        )
      ),

      isLoading && !insightsData && React.createElement(LoadingSpinner, { message: "Fetching Insights..." }),
      error && React.createElement(ErrorMessage, { error: error, mode: "inline" }),

      insightsData ? (
        React.createElement("div", { className: "ai-insights-content-sections" },
          React.createElement("div", { className: "ai-insights-section" },
            React.createElement("h4", null, "AI-Powered Actions"),
            React.createElement("button", {
              onClick: () => modalManager.openAiQuickEditModal({ targetNodeId: node.id }),
              disabled: isAppBusy || node.isLocked,
              className: "primary panel-button ai-insights-action-button",
              title: node.isLocked ? "Unlock node to use AI quick edit" : "Make a small, targeted change to this node using an AI prompt"
            }, "✍️ Quick Edit with AI...")
          ),
          React.createElement("div", { className: "ai-insights-section" },
            React.createElement("h4", null, "Suggested Description"),
            React.createElement("p", { className: "ai-insight-text" }, insightsData.suggested_description),
            React.createElement("button", {
              onClick: () => onUseDescription(insightsData.suggested_description),
              disabled: isAppBusy || !insightsData.suggested_description,
              className: "secondary panel-button ai-insights-action-button"
            }, "Use Description")
          ),

          insightsData.alternative_names?.length > 0 && (
            React.createElement("div", { className: "ai-insights-section" },
              React.createElement("h4", null, "Alternative Names"),
              React.createElement("ul", { className: "ai-insights-list" },
                insightsData.alternative_names.map((altName, index) => (
                  React.createElement(InsightListItem, { 
                    key: `alt-name-${index}`,
                    item: altName,
                    onAction: onUseAlternativeName,
                    actionIcon: "🔄",
                    actionTitle: `Rename to "${altName}"`,
                    isAppBusy: isAppBusy
                  })
                ))
              )
            )
          ),

          insightsData.potential_children?.length > 0 && (
            React.createElement("div", { className: "ai-insights-section" },
              React.createElement("h4", null, "Potential Children"),
              React.createElement("ul", { className: "ai-insights-list" },
                insightsData.potential_children.map((child, index) => (
                  React.createElement(InsightListItem, { 
                    key: `potential-child-${index}`,
                    item: child,
                    onAction: () => onAddSuggestedChild(child.name, child.description),
                    actionIcon: "➕",
                    actionTitle: `Add "${child.name}"`,
                    isAppBusy: isAppBusy
                  },
                    child.description && React.createElement("p", { className: "ai-insights-list-item-desc" }, child.description)
                  )
                ))
              )
            )
          ),

          insightsData.key_concepts?.length > 0 && (
            React.createElement("div", { className: "ai-insights-section" },
              React.createElement("h4", null, "Key Concepts"),
              React.createElement("div", { className: "ai-insights-tag-list" },
                insightsData.key_concepts.map((concept, index) => (
                  React.createElement("span", { key: `concept-${index}`, className: "ai-insights-tag" }, concept)
                ))
              )
            )
          )
        )
      ) : (
        !isLoading && !error && React.createElement("p", { style: { fontStyle: 'italic', textAlign: 'center', color: 'var(--text-tertiary)', padding: '10px' } }, "Click ✨ to generate insights.")
      )
    )
  );
};
export default AiInsightsTab;