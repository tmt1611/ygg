
import React from 'react';
// import { TechTreeNode, AiInsightData } from '../types.js'; // Types removed
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
    React.createElement("div", { className: "ai-insights-panel", style: {padding: '5px'}}, 
      React.createElement("div", {style: {display: 'flex', justifyContent: 'center', marginBottom: '10px'}},
        React.createElement("button", {
          onClick: onGenerateInsights,
          disabled: fetchButtonDisabled,
          className: "base-icon-button primary", 
          style: { padding: '6px 10px', fontSize: '1.2em' }, 
          title: fetchButtonTitle,
          "aria-label": fetchButtonTitle
        },
          isLoading ? React.createElement("span", {className: "basic-spinner-animation", style: {width: '1em', height: '1em', border: '2px solid currentColor', borderLeftColor: 'transparent', borderRadius: '50%'}}) : '💡'
        )
      ),
      
      isLoading && !insightsData && React.createElement(LoadingSpinner, { message: "Fetching AI Insights..." }),
      error && React.createElement("p", { className: "error-message-inline" }, "Error: ", error),

      React.createElement("div", { className: "ai-insights-section" },
        React.createElement("h4", {style: {fontSize: '0.95em', color: 'var(--primary-accent-light)', marginBottom: '6px', borderBottom: '1px solid rgba(var(--primary-accent-rgb),0.2)', paddingBottom: '4px', wordBreak: 'break-word', whiteSpace: 'normal'}},
            "Description Analysis for: \"", node.name, "\""
        ),
        React.createElement("div", {style: {marginBottom: '8px'}},
            React.createElement("label", {htmlFor: "current-node-desc", style: {fontSize: '0.85em', color: 'var(--text-tertiary)', display:'block', marginBottom:'3px'}}, "Current Description:"),
            React.createElement("textarea", {
              id: "current-node-desc",
              value: node.description || "(No current description)",
              readOnly: true,
              rows: 5, 
              style: {backgroundColor: 'var(--panel-alt-bg)', opacity: node.description ? 1 : 0.7},
              "aria-label": "Current node description"
            })
        )
      ),

      insightsData && (
        React.createElement("div", {style: {display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '10px'}},
          React.createElement("div", { className: "ai-insights-section" },
            React.createElement("div", null,
                React.createElement("label", {htmlFor: "suggested-node-desc", style: {fontSize: '0.85em', color: 'var(--text-primary)', display:'block', marginBottom:'3px'}}, "Suggested Description:"),
                React.createElement("textarea", {
                  id: "suggested-node-desc",
                  value: insightsData.suggested_description,
                  readOnly: true,
                  rows: 5, 
                  "aria-label": "AI suggested description"
                })
            ),
            React.createElement("button", {
              onClick: () => onUseDescription(insightsData.suggested_description),
              disabled: isAppBusy || !insightsData.suggested_description,
              className: "secondary",
              style: { width: '100%', marginTop: '8px' },
              title: "Apply this AI-suggested description to the current node."
            },
              "Use Suggested Description"
            )
          ),

          insightsData.alternative_names && insightsData.alternative_names.length > 0 && (
            React.createElement("div", { className: "ai-insights-section" },
              React.createElement("h4", null, "Alternative Names:"),
              React.createElement("div", { style: { display: 'flex', flexDirection: 'column', gap: '5px', marginTop: '5px' } },
                insightsData.alternative_names.map((altName, index) => (
                  React.createElement("button", {
                    key: `alt-name-${index}`,
                    onClick: () => onUseAlternativeName(altName),
                    disabled: isAppBusy,
                    className: "secondary panel-button", 
                    style: {textAlign: 'left', justifyContent: 'flex-start'},
                    title: `Change node name to "${altName}"`
                  },
                    altName
                  )
                ))
              )
            )
          ),

          React.createElement("div", { className: "ai-insights-section" },
            React.createElement("h4", null, "Potential New Children:"),
            insightsData.potential_children.length > 0 ? (
              React.createElement("ul", { className: "ai-insights-list", style: { overflowY: 'visible' } },
                insightsData.potential_children.map((childSugg, index) => (
                  React.createElement("li", { key: `potential-child-${index}`, style: {flexDirection: 'column', alignItems: 'flex-start', gap: '5px'}},
                    React.createElement("div", {style: {width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}},
                        React.createElement("span", {style: {fontWeight: 500}}, childSugg.name),
                        React.createElement("button", {
                          onClick: () => onAddSuggestedChild(childSugg.name, childSugg.description),
                          disabled: isAppBusy,
                          className: "add-child-btn base-icon-button",
                          title: `Add "${childSugg.name}" as a new child to ${node.name} with the suggested description.`,
                          "aria-label": `Add suggested child ${childSugg.name} to ${node.name}`
                        },
                          "➕ Add"
                        )
                    ),
                    childSugg.description && (
                        React.createElement("p", {style: {fontSize: '0.85em', color: 'var(--text-secondary)', margin: '2px 0 0 0', fontStyle: 'italic', paddingLeft: '5px'}},
                           "Desc: ", childSugg.description
                        )
                    )
                  )
                ))
              )
            ) : (
              React.createElement("p", {style: {fontSize: '0.9em', color: 'var(--text-tertiary)'}}, "No specific child concepts suggested by AI.")
            )
          ),

          React.createElement("div", { className: "ai-insights-section" },
            React.createElement("h4", null, "Related Key Concepts:"),
            insightsData.key_concepts.length > 0 ? (
                React.createElement("ul", { className: "ai-insights-list", style: {maxHeight: '100px'}},
                    insightsData.key_concepts.map((concept, index) => (
                    React.createElement("li", { key: `concept-${index}`, style: {justifyContent: 'flex-start'}}, React.createElement("span", null, concept))
                    ))
                )
            ) : (
                React.createElement("p", {style: {fontSize: '0.9em', color: 'var(--text-tertiary)'}}, "No specific related concepts suggested by AI.")
            )
          )
        )
      ),
      !isLoading && !insightsData && !error && !fetchButtonDisabled && (
        React.createElement("p", { className: "loading-message", style: {textAlign: 'center', padding: '15px 0', fontSize: '0.9em', color: 'var(--text-secondary)'}},
            "Click the 💡 button above to get AI suggestions for this node."
        )
      )
    )
  );
};

export default AiInsightsPanel;
