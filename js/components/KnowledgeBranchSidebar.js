
import React, { useState, useEffect } from 'react';
import AiToolsTab from './tabs/AiToolsTab.js';
import AiInsightsTab from './tabs/AiInsightsTab.js';
import HistoryViewTabContent from './tabs/HistoryViewTab.js';
import { APP_STORAGE_KEYS } from '../constants.js';

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
              React.createElement(AiToolsTab, {
                modificationPrompt: props.modificationPrompt,
                setModificationPrompt: props.setModificationPrompt,
                onModifyAiTree: props.onModifyAiTree,
                isAiModifying: props.isAiModifying,
                canUndoAiMod: props.canUndoAiMod,
                onUndoAiModification: props.onUndoAiModification,
                isAiSuggestionModalOpen: props.isAiSuggestionModalOpen,
                initialPromptForStrategy: props.initialPromptForStrategy,
                strategicSuggestions: props.strategicSuggestions,
                isFetchingStrategicSuggestions: props.isFetchingStrategicSuggestions,
                strategicSuggestionsError: props.strategicSuggestionsError,
                onGenerateStrategicSuggestions: props.onGenerateStrategicSuggestions,
                onApplyStrategicSuggestion: props.onApplyStrategicSuggestion,
                apiKeyIsSet: apiKeyIsSet,
                hasTechTreeData: hasTechTreeData,
                isAppBusy: isAppBusy,
                collapsedPanels: collapsedPanels,
                onTogglePanel: handleTogglePanel,
              })
            ),
            activeSidebarTab === 'ai-insights' && (
              React.createElement(AiInsightsTab, {
                node: props.selectedNodeForInsights,
                insightsData: props.aiInsightsData,
                isLoading: props.aiInsightsIsLoading,
                error: props.aiInsightsError,
                onGenerateInsights: props.onGenerateAiNodeInsights,
                onUseDescription: props.onUseSuggestedDescription,
                onUseAlternativeName: props.onUseAlternativeName,
                onAddSuggestedChild: props.onAddSuggestedChildFromInsight,
                isAppBusy: isAppBusy,
                apiKeyIsSet: apiKeyIsSet
              })
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
