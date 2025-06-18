
import React from 'react';
import LoadingSpinner from './LoadingSpinner.js';

const AiInsightsPanel = ({
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
}) => {

  const fetchButtonDisabled = !node || !apiKeyIsSet || isLoading || isAppBusy;
  let fetchButtonTitle = "Fetch AI-generated insights for this node";
  if (!node) fetchButtonTitle = "Select a node to fetch insights";
  else if (!apiKeyIsSet) fetchButtonTitle = "API key required for insights";
  else if (isLoading) fetchButtonTitle = "Insights generation in progress...";
  else if (isAppBusy) fetchButtonTitle = "Application is busy, please wait.";


  return (
    React.createElement("div", { className: "ai-insights-panel" },
      React.createElement("div", { className: "ai-insights-header" },
        React.createElement("h4", { className: "ai-insights-header-title" },
          "Analysis for: ", React.createElement("span", null, node.name)
        ),
        React.createElement("button", {
          onClick: onGenerateInsights,
          disabled: fetchButtonDisabled,
          className: "base-icon-button primary",
          title: fetchButtonTitle,
          "aria-label": fetchButtonTitle
        },
          isLoading ? React.createElement("span", { className: "basic-spinner-animation" }) : '💡'
        )
      ),
      
      isLoading && !insightsData && React.createElement(LoadingSpinner, { message: "Fetching AI Insights..." }),
      error && React.createElement("p", { className: "error-message-inline" }, "Error: ", error),
      
      React.createElement("div", { className: "ai-insights-content" },
        React.createElement("div", { className: "ai-insights-section" },
          React.createElement("label", { htmlFor: "current-node-desc", className: "ai-insights-label" }, "Current Description:"),
          React.createElement("textarea", {
            id: "current-node-desc",
            value: node.description || "(No current description)",
            readOnly: true,
            rows: 4, 
            className: "ai-insights-textarea-current",
            "aria-label": "Current node description"
          })
        ),

        insightsData && (
          React.createElement(React.Fragment, null,
            React.createElement("div", { className: "ai-insights-section" },
              React.createElement("label", { htmlFor: "suggested-node-desc", className: "ai-insights-label" }, "Suggested Description:"),
              React.createElement("textarea", {
                id: "suggested-node-desc",
                value: insightsData.suggested_description,
                readOnly: true,
                rows: 4,
                className: "ai-insights-textarea-suggested",
                "aria-label": "AI suggested description"
              }),
              React.createElement("button", {
                onClick: () => onUseDescription(insightsData.suggested_description),
                disabled: isAppBusy || !insightsData.suggested_description,
                className: "secondary panel-button ai-insights-action-button",
                title: "Apply this AI-suggested description to the current node."
              }, "Use Suggested Description")
            ),

            insightsData.alternative_names && insightsData.alternative_names.length > 0 && (
              React.createElement("div", { className: "ai-insights-section" },
                React.createElement("h5", { className: "ai-insights-sub-header" }, "Alternative Names"),
                React.createElement("div", { className: "ai-insights-button-group" },
                  insightsData.alternative_names.map((altName, index) => (
                    React.createElement("button", {
                      key: `alt-name-${index}`,
                      onClick: () => onUseAlternativeName(altName),
                      disabled: isAppBusy,
                      className: "secondary panel-button",
                      title: `Change node name to "${altName}"`
                    }, altName)
                  ))
                )
              )
            ),

            React.createElement("div", { className: "ai-insights-section" },
              React.createElement("h5", { className: "ai-insights-sub-header" }, "Potential New Children"),
              insightsData.potential_children.length > 0 ? (
                React.createElement("ul", { className: "ai-insights-list" },
                  insightsData.potential_children.map((childSugg, index) => (
                    React.createElement("li", { key: `potential-child-${index}` },
                      React.createElement("div", { className: "ai-insights-list-item-content" },
                        React.createElement("span", { className: "ai-insights-list-item-name" }, childSugg.name),
                        childSugg.description && React.createElement("p", { className: "ai-insights-list-item-desc" }, childSugg.description)
                      ),
                      React.createElement("button", {
                        onClick: () => onAddSuggestedChild(childSugg.name, childSugg.description),
                        disabled: isAppBusy,
                        className: "add-child-btn base-icon-button",
                        title: `Add "${childSugg.name}" as a new child to ${node.name} with the suggested description.`,
                        "aria-label": `Add suggested child ${childSugg.name} to ${node.name}`
                      }, "➕")
                    )
                  ))
                )
              ) : (
                React.createElement("p", { className: "ai-insights-placeholder-text" }, "No specific child concepts suggested by AI.")
              )
            ),

            insightsData.key_concepts && insightsData.key_concepts.length > 0 && (
              React.createElement("div", { className: "ai-insights-section" },
                React.createElement("h5", { className: "ai-insights-sub-header" }, "Related Key Concepts"),
                React.createElement("div", { className: "ai-insights-tag-list" },
                  insightsData.key_concepts.map((concept, index) => (
                    React.createElement("span", { key: `concept-${index}`, className: "ai-insights-tag" }, concept)
                  ))
                )
              )
            )
          )
        ),
        !isLoading && !insightsData && !error && !fetchButtonDisabled && (
          React.createElement("p", { className: "ai-insights-placeholder-text" },
            "Click the 💡 button above to get AI suggestions for this node."
          )
        )
      )
    )
  );
};

export default AiInsightsPanel;
