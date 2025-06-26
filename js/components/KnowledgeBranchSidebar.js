import React, { useState, useEffect, useCallback } from 'react';
import AiToolsTab from './tabs/AiToolsTab.js';
import AiInsightsTab from './tabs/AiInsightsTab.js';
import HistoryViewTabContent from './tabs/HistoryViewTab.js';
import { APP_STORAGE_KEYS } from '../constants.js';

const sidebarTabs = [
    { id: 'ai-tools', label: 'AI Ops', icon: '🧠' },
    { id: 'ai-insights', label: 'Project Insight', icon: '💡' },
    { id: 'history', label: 'History', icon: '📜' },
];

const KnowledgeBranchSidebar = (props) => {
  const {
    isCollapsed, onToggleSidebar, activeSidebarTab, setActiveSidebarTab,
    isAppBusy, apiKeyHook, hasTechTreeData, modalManager, techTreeData, contextText,
  } = props;
  const [collapsedPanels, setCollapsedPanels] = useState(() => {
    const savedState = localStorage.getItem(APP_STORAGE_KEYS.SIDEBAR_PANEL_STATES);
    try {
        if (savedState) {
            const parsed = JSON.parse(savedState);
            return new Set(Array.isArray(parsed) ? parsed : []);
        }
    } catch (e) {
        console.error("Failed to parse sidebar panel states from localStorage", e);
    }
    return new Set([]); // Keep panels open by default for better discoverability
  });

  const handleTogglePanel = useCallback((panelId) => {
    setCollapsedPanels(prev => {
      const newSet = new Set(prev);
      if (newSet.has(panelId)) {
        newSet.delete(panelId);
      } else {
        newSet.add(panelId);
      }
      return newSet;
    });
  }, []);

  useEffect(() => {
    localStorage.setItem(APP_STORAGE_KEYS.SIDEBAR_PANEL_STATES, JSON.stringify(Array.from(collapsedPanels)));
  }, [collapsedPanels]);

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
                treeOperationsAI: props.treeOperationsAI,
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
                apiKeyIsSet: apiKeyHook.status.isSet,
                hasTechTreeData: hasTechTreeData,
                isAppBusy: isAppBusy,
                collapsedPanels: collapsedPanels,
                onTogglePanel: handleTogglePanel,
                modalManager: modalManager,
                techTreeData: techTreeData
              })
            ),
            activeSidebarTab === 'ai-insights' && (
              React.createElement(AiInsightsTab, {
                insightsData: props.aiInsightsData,
                isLoading: props.aiInsightsIsLoading,
                error: props.aiInsightsError,
                onGenerateInsights: props.onGenerateProjectInsights,
                onUseDescription: props.onUseSuggestedDescription,
                onAddSuggestedChildToNode: props.onAddSuggestedChildToNode,
                onAddNewBranchToRoot: props.onAddNewBranchToRoot,
                isAppBusy: isAppBusy,
                apiKeyIsSet: apiKeyHook.status.isSet,
                modalManager: modalManager,
                hasTechTreeData: hasTechTreeData,
                techTreeData: techTreeData,
                contextText: contextText
              })
            ),
            activeSidebarTab === 'history' && (
              React.createElement(HistoryViewTabContent, { history: props.history, onClearHistory: props.onClearHistory })
            )
          )
        )
      )
    )
  );
};

export default KnowledgeBranchSidebar;