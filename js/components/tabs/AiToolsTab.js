import React from 'react';
import CollapsiblePanel from '../CollapsiblePanel.js';
import ModificationPromptInput from '../ModificationPromptInput.js';
import LoadingSpinner from '../LoadingSpinner.js';
import ErrorMessage from '../ErrorMessage.js';
import ContextualHelpTooltip from '../ContextualHelpTooltip.js';

const AiToolsTab = ({
  modificationPrompt, setModificationPrompt, onModifyAiTree, isAiModifying,
  canUndoAiMod, onUndoAiModification, isAiSuggestionModalOpen,
  initialPromptForStrategy, strategicSuggestions, isFetchingStrategicSuggestions,
  strategicSuggestionsError, onGenerateStrategicSuggestions,
  onApplyStrategicSuggestion,
  apiKeyIsSet, hasTechTreeData, isAppBusy,
  collapsedPanels, onTogglePanel,
  selectedNode
}) => {
  
  const canGenerateStrategicSuggestions = apiKeyIsSet && !!initialPromptForStrategy?.trim() && !isAppBusy && !isFetchingStrategicSuggestions;

  const treeModifierTitle = selectedNode 
    ? `Tree Modifier AI (on: ${selectedNode.name.substring(0, 15)}${selectedNode.name.length > 15 ? '...' : ''})` 
    : 'Tree Modifier AI';

  return (
    React.createElement("div", { style: { display: 'flex', flexDirection: 'column', gap: '12px' } },
      React.createElement(CollapsiblePanel, {
        panelId: 'tree-modifier',
        title: treeModifierTitle,
        icon: '🌳',
        variant: 'sidebar',
        isCollapsed: collapsedPanels.has('tree-modifier'),
        onToggle: onTogglePanel,
      },
        React.createElement(ModificationPromptInput, {
          prompt: modificationPrompt,
          setPrompt: setModificationPrompt,
          onModify: () => onModifyAiTree(modificationPrompt, true), // ALWAYS use modal for safety
          isLoading: isAiModifying,
          disabled: !hasTechTreeData || !apiKeyIsSet || isAiModifying || isAppBusy,
          isApiKeySet: apiKeyIsSet,
          hasTreeData: hasTechTreeData,
          labelOverride: null
          // buttonText prop removed to use the default "Suggest Modifications"
        }),
        hasTechTreeData && canUndoAiMod && (
          React.createElement("button", {
            onClick: onUndoAiModification,
            disabled: isAiModifying || isAppBusy,
            className: "secondary",
            style: { width: '100%', marginTop: '8px' },
            title: isAiSuggestionModalOpen ? "A suggestion preview is open. Please resolve it first." : "Revert the last AI modification or cancel the current suggestion chain."
          },
            isAiSuggestionModalOpen ? "Cancel Suggestion" : "Undo Last AI Mod"
          )
        )
      ),

      React.createElement(CollapsiblePanel, {
        panelId: 'strategic-advisor',
        title: 'Strategic Advisor AI',
        icon: '✨',
        variant: 'sidebar',
        isCollapsed: collapsedPanels.has('strategic-advisor'),
        onToggle: onTogglePanel,
        headerActions: React.createElement(ContextualHelpTooltip, { helpText: "Get AI-powered suggestions for high-level next steps or new development pathways for your project based on its current context and structure." })
      },
        React.createElement("button", {
          onClick: onGenerateStrategicSuggestions,
          disabled: !canGenerateStrategicSuggestions,
          className: "primary panel-button",
          style: { width: '100%' },
          title: !apiKeyIsSet ? "API Key required for AI suggestions." : !initialPromptForStrategy?.trim() ? "Project context (name/topic) must be set." : isAppBusy || isFetchingStrategicSuggestions ? "Processing another task..." : "Generate AI suggestions for project development"
        },
          isFetchingStrategicSuggestions ? "Analyzing..." : "✨ Generate Strategic Ideas"
        ),

        isFetchingStrategicSuggestions && React.createElement(LoadingSpinner, { message: null }),
        strategicSuggestionsError && React.createElement(ErrorMessage, { error: strategicSuggestionsError, mode: "inline" }),

        strategicSuggestions && strategicSuggestions.length > 0 && (
          React.createElement("div", { style: { marginTop: '15px' } },
            React.createElement("h4", { className: "panel-sub-header", style: { marginTop: '0', marginBottom: '8px', fontSize: '0.9em' } }, "Suggested Pathways:"),
            React.createElement("ul", { className: "ai-insights-list" }, // Re-using class for style consistency
              strategicSuggestions.map((suggestion, index) => (
                React.createElement("li", { key: index },
                  React.createElement("div", { className: "ai-insights-list-item-content" },
                    React.createElement("span", { className: "ai-insights-list-item-name" }, suggestion)
                  ),
                  React.createElement("button", {
                    onClick: () => onApplyStrategicSuggestion(suggestion),
                    disabled: isAppBusy || !hasTechTreeData,
                    className: "add-child-btn base-icon-button",
                    title: `Use this idea to modify the tree`,
                    "aria-label": `Apply suggestion: ${suggestion}`
                  }, "🚀")
                )
              ))
            )
          )
        ),
        !isFetchingStrategicSuggestions && !strategicSuggestionsError && !strategicSuggestions && (
          React.createElement("div", { style: { marginTop: '8px' } },
            !apiKeyIsSet && React.createElement("p", { style: { textAlign: 'center', fontSize: '0.8em', color: 'var(--warning-color)' } }, "API Key not set."),
            apiKeyIsSet && !initialPromptForStrategy?.trim() && React.createElement("p", { style: { textAlign: 'center', fontSize: '0.8em', color: 'var(--warning-color)' } }, "Project context empty."),
            canGenerateStrategicSuggestions && React.createElement("p", { style: { textAlign: 'center', fontSize: '0.8em', color: 'var(--text-tertiary)', fontStyle: 'italic' } }, "Click button to get ideas.")
          )
        )
      )
    )
  );
};

export default AiToolsTab;