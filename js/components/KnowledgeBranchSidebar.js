
import React, { useState } from 'react';
import CollapsiblePanel from './CollapsiblePanel.js';
import ModificationPromptInput from './ModificationPromptInput.js';
import AiInsightsPanel from './AiInsightsPanel.js';
import HistoryViewTabContent from './tabs/HistoryViewTab.js';
import LoadingSpinner from './LoadingSpinner.js';
import ErrorMessage from './ErrorMessage.js';
import ContextualHelpTooltip from './ContextualHelpTooltip.js';


const sidebarTabs = [
    { id: 'ai-tools', label: 'AI Ops', icon: '🧠' },
    { id: 'ai-insights', label: 'Node Insight', icon: '💡' }, 
    { id: 'history', label: 'History', icon: '📜' },
];

const KnowledgeBranchSidebar = ({
  isCollapsed,
  onToggleSidebar,
  activeSidebarTab,
  setActiveSidebarTab,
  themeMode,
  modificationPrompt, setModificationPrompt, onModifyAiTree, isAiModifying, canUndoAiMod, onUndoAiModification,
  initialPromptForStrategy, techTreeDataForStrategy, strategicSuggestions, isFetchingStrategicSuggestions, strategicSuggestionsError, onGenerateStrategicSuggestions,
  apiKeyIsSet, hasTechTreeData, isAppBusy,
  selectedNodeForInsights, aiInsightsData, aiInsightsIsLoading, aiInsightsError, onGenerateAiNodeInsights,
  onUseSuggestedDescription, onUseAlternativeName, onAddSuggestedChildFromInsight,
  history,
}) => {
  const [collapsedPanels, setCollapsedPanels] = useState(new Set());

  const handleTogglePanel = (panelId) => {
    setCollapsedPanels(prev => {
        const newSet = new Set(prev);
        if (newSet.has(panelId)) {
            newSet.delete(panelId);
        } else {
            newSet.add(panelId);
        }
        return newSet;
    });
  };

  const canGenerateStrategicSuggestions = apiKeyIsSet && !!initialPromptForStrategy?.trim() && !isAppBusy && !isFetchingStrategicSuggestions;

  const handlePasteStrategicSuggestionsToModPrompt = () => {
    if (strategicSuggestions && strategicSuggestions.length > 0) {
      const formattedSuggestions = strategicSuggestions.map(s => `- ${s}`).join('\n');
      const fullPrompt = `Based on the following strategic ideas:\n${formattedSuggestions}\n\nPlease apply relevant modifications to the current tree structure. For example, consider creating new main branches, adding key technologies under existing nodes, or expanding on underdeveloped areas related to these ideas.`;
      setModificationPrompt(fullPrompt);
      setActiveSidebarTab('ai-tools'); 
    }
  };

  return (
    React.createElement("aside", { className: `knowledge-branch-sidebar ${isCollapsed ? 'collapsed' : ''}` },
      React.createElement("div", { className: "sidebar-header" },
        React.createElement("button", { 
          onClick: onToggleSidebar, 
          className: "sidebar-toggle-main base-icon-button", 
          title: isCollapsed ? "Expand Sidebar" : "Collapse Sidebar",
          "aria-label": isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"
        },
          isCollapsed ? '➡️' : '⬅️'
        ),
        isCollapsed && (
            React.createElement("svg", { viewBox: "0 0 100 100", className: "sidebar-header-logo", "aria-label": "Yggdrasil Project Collapsed" },
              React.createElement("defs", null,
                React.createElement("radialGradient", { id: "collapsedIconGradientSidebar", cx: "50%", cy: "50%", r: "50%" },
                  React.createElement("stop", { offset: "0%", stopColor: "currentColor", stopOpacity: "0.7" }),
                  React.createElement("stop", { offset: "100%", stopColor: "currentColor", stopOpacity: "0.4" })
                )
              ),
              React.createElement("ellipse", { cx: "50", cy: "50", rx: "22", ry: "32", fill: "url(#collapsedIconGradientSidebar)" }),
              React.createElement("path", { d: "M50 22 Q 54 37, 50 50 Q 46 37, 50 22 Z", fill: "currentColor", fillOpacity: "0.2" })
            )
        )
      ),

      !isCollapsed && (
        React.createElement(React.Fragment, null,
          React.createElement("div", { className: "sidebar-tab-switcher" },
            sidebarTabs.map(tab => (
              React.createElement("button", {
                key: tab.id,
                onClick: () => setActiveSidebarTab(tab.id),
                className: `sidebar-tab-button ${activeSidebarTab === tab.id ? 'active' : ''}`,
                title: tab.label,
                "aria-pressed": activeSidebarTab === tab.id
              },
                React.createElement("span", { className: "sidebar-tab-icon", "aria-hidden": "true" }, tab.icon),
                React.createElement("span", { className: "sidebar-tab-label" }, tab.label)
              )
            ))
          ),
          React.createElement("div", { className: "sidebar-tools-area" },
            activeSidebarTab === 'ai-tools' && (
              React.createElement("div", {style: {display: 'flex', flexDirection: 'column', gap: '12px'}},
                React.createElement(CollapsiblePanel, {
                  panelId: 'tree-modifier',
                  title: 'Tree Modifier AI',
                  icon: '🌳',
                  isCollapsed: collapsedPanels.has('tree-modifier'),
                  onToggle: handleTogglePanel,
                },
                  React.createElement(ModificationPromptInput, {
                    prompt: modificationPrompt,
                    setPrompt: setModificationPrompt,
                    onModify: onModifyAiTree,
                    isLoading: isAiModifying,
                    disabled: !hasTechTreeData || !apiKeyIsSet || isAiModifying || isAppBusy,
                    isApiKeySet: apiKeyIsSet,
                    hasTreeData: hasTechTreeData,
                    labelOverride: null
                  }),
                  hasTechTreeData && canUndoAiMod && (
                    React.createElement("button", { onClick: onUndoAiModification, disabled: isAiModifying || isAppBusy, className: "secondary", style: { width: '100%', marginTop: '8px' }},
                      "Undo Last AI Mod"
                    )
                  )
                ),

                React.createElement(CollapsiblePanel, {
                  panelId: 'strategic-advisor',
                  title: 'Strategic Advisor AI',
                  icon: '✨',
                  isCollapsed: collapsedPanels.has('strategic-advisor'),
                  onToggle: handleTogglePanel,
                  headerActions: React.createElement(ContextualHelpTooltip, { helpText: "Get AI-powered suggestions for high-level next steps or new development pathways for your project based on its current context and structure." })
                },
                  React.createElement("button", {
                    onClick: onGenerateStrategicSuggestions,
                    disabled: !canGenerateStrategicSuggestions,
                    className: "primary panel-button",
                    style: { width: '100%' },
                     title:
                      !apiKeyIsSet ? "API Key required for AI suggestions." :
                      !initialPromptForStrategy?.trim() ? "Project context (name/topic) must be set." :
                      isAppBusy || isFetchingStrategicSuggestions ? "Processing another task..." :
                      "Generate AI suggestions for project development"
                  },
                    isFetchingStrategicSuggestions ? "Analyzing..." : "✨ Generate Strategic Ideas"
                  ),

                  isFetchingStrategicSuggestions && React.createElement(LoadingSpinner, { message: null }),
                  strategicSuggestionsError && React.createElement(ErrorMessage, { message: strategicSuggestionsError }),

                  strategicSuggestions && strategicSuggestions.length > 0 && (
                    React.createElement("div", {style:{marginTop: '15px'}},
                      React.createElement("h4", { className: "panel-sub-header", style: { marginTop: '0', marginBottom: '8px', fontSize: '0.9em' } }, "Suggested Pathways:"),
                      React.createElement("ul", { style: { listStyle: 'disc', paddingLeft: '20px', margin: 0, display: 'flex', flexDirection: 'column', gap: '6px' } },
                        strategicSuggestions.map((suggestion, index) => (
                          React.createElement("li", { key: index, style: {
                            fontSize: '0.85em',
                            color: 'var(--text-on-dark-bg)', 
                          }},
                            suggestion
                          )
                        ))
                      ),
                      !isFetchingStrategicSuggestions && (
                        React.createElement("button", {
                          onClick: handlePasteStrategicSuggestionsToModPrompt,
                          disabled: isAppBusy,
                          className: "secondary panel-button",
                          style: { marginTop: '10px', width: '100%' },
                          title: "Copy these strategic ideas to the 'Edit AI' input for further refinement."
                        },
                          "📝 Use these Ideas for Edit AI"
                        )
                      )
                    )
                  ),
                   !isFetchingStrategicSuggestions && !strategicSuggestionsError && !strategicSuggestions && (
                     React.createElement("div", {style: {marginTop: '8px'}},
                        !apiKeyIsSet && (
                            React.createElement("p", { style: { textAlign: 'center', fontSize: '0.8em', color: 'var(--warning-color)'}},
                            "API Key not set."
                            )
                        ),
                        apiKeyIsSet && !initialPromptForStrategy?.trim() && (
                            React.createElement("p", { style: { textAlign: 'center', fontSize: '0.8em', color: 'var(--warning-color)'}},
                            "Project context empty."
                            )
                        ),
                        canGenerateStrategicSuggestions && (
                            React.createElement("p", { style: { textAlign: 'center', fontSize: '0.8em', color: 'var(--text-tertiary)', fontStyle: 'italic'}},
                            "Click button to get ideas."
                            )
                        )
                     )
                  )
                )
              )
            ),
            
            activeSidebarTab === 'ai-insights' && (
              selectedNodeForInsights ? (
                React.createElement(AiInsightsPanel, {
                  node: selectedNodeForInsights,
                  insightsData: aiInsightsData,
                  isLoading: aiInsightsIsLoading,
                  error: aiInsightsError,
                  onGenerateInsights: onGenerateAiNodeInsights,
                  onUseDescription: onUseSuggestedDescription,
                  onUseAlternativeName: onUseAlternativeName,
                  onAddSuggestedChild: onAddSuggestedChildFromInsight,
                  isAppBusy: isAppBusy,
                  apiKeyIsSet: apiKeyIsSet
                })
              ) : (
                React.createElement("p", {style: {textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.9em', padding: '15px 5px'}}, "Select a node in Graph/List/Focus view to see Node Insight.")
              )
            ),
            
            activeSidebarTab === 'history' && (
              React.createElement(HistoryViewTabContent, { history: history })
            )
          )
        )
      )
    )
  );
};

export default KnowledgeBranchSidebar;
