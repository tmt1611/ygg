
import React, { useState, useEffect, useMemo } from 'react';

const getNextThemeInfo = (currentTheme) => {
    switch (currentTheme) {
        case 'dark': return { next: 'Light', icon: '☀️' };
        case 'light': return { next: 'Sol', icon: '📜' };
        case 'sol': return { next: 'Nebula', icon: '🌌' };
        case 'nebula': return { next: 'Dark', icon: '🌙' };
        default: return { next: 'Light', icon: '☀️' };
    }
};

const YggdrasilTopBar = ({
  themeMode, onToggleTheme, apiKeyIsSet, activeProjectName, onSaveActiveProject, 
  onDownloadActiveProject, saveFeedback, setSaveFeedback, downloadFeedback, setDownloadFeedback,
  isAppBusy, hasTechTreeData,
  yggdrasilViewMode, setYggdrasilViewMode,
  focusNodeId,
  graphSearchTerm,
  setGraphSearchTerm
}) => {

  useEffect(() => {
    if (saveFeedback) {
      const timer = setTimeout(() => setSaveFeedback(false), 1500);
      return () => clearTimeout(timer);
    }
  }, [saveFeedback, setSaveFeedback]);

  useEffect(() => {
    if (downloadFeedback) {
      const timer = setTimeout(() => setDownloadFeedback(false), 1500);
      return () => clearTimeout(timer);
    }
  }, [downloadFeedback, setDownloadFeedback]);

  const nextThemeInfo = useMemo(() => getNextThemeInfo(themeMode), [themeMode]);


  const handleNavClick = (viewMode) => {
    setYggdrasilViewMode(viewMode);
  };

  const showSearchBar = ['graph', 'list'].includes(yggdrasilViewMode);

    return (
    React.createElement("header", { className: "yggdrasil-top-bar" },
      React.createElement("div", { className: "yggdrasil-top-bar-section left" },
        React.createElement("h1", { className: "yggdrasil-top-bar-title" }, "Yggdrasil")
      ),

      React.createElement("nav", { className: "yggdrasil-top-bar-section center", "aria-label": "Main views" },
        React.createElement("button", {
          className: `yggdrasil-top-bar-nav-button ${yggdrasilViewMode === 'workspace' ? 'active' : ''}`,
          onClick: () => handleNavClick('workspace'),
          disabled: isAppBusy && yggdrasilViewMode !== 'workspace',
          title: "Manage projects, API key, and initial generation"
        }, "Workspace"),
        React.createElement("button", {
          className: `yggdrasil-top-bar-nav-button ${yggdrasilViewMode === 'graph' ? 'active' : ''}`,
          onClick: () => handleNavClick('graph'),
          disabled: isAppBusy && yggdrasilViewMode !== 'graph',
          title: "Interactive graph visualization of the tree"
        }, "Graph"),
        React.createElement("button", {
          className: `yggdrasil-top-bar-nav-button ${yggdrasilViewMode === 'list' ? 'active' : ''}`,
          onClick: () => handleNavClick('list'),
          disabled: isAppBusy && yggdrasilViewMode !== 'list',
          title: "Hierarchical list view of the tree"
        }, "List"),
        React.createElement("button", {
          className: `yggdrasil-top-bar-nav-button ${yggdrasilViewMode === 'focus' ? 'active' : ''}`,
          onClick: () => focusNodeId ? handleNavClick('focus') : undefined,
          disabled: (isAppBusy && yggdrasilViewMode !== 'focus') || !focusNodeId,
          title: focusNodeId ? "Detailed view of the currently focused node" : "Select a node to enable Focus View"
        }, "Focus"),
        showSearchBar && React.createElement("div", { className: "yggdrasil-top-bar-search-wrapper" },
            React.createElement("input", {
                type: "search",
                placeholder: "Filter nodes...",
                className: "yggdrasil-top-bar-search-input",
                value: graphSearchTerm,
                onChange: (e) => setGraphSearchTerm(e.target.value),
                "aria-label": "Filter nodes in graph or list"
            })
        ),
        activeProjectName ? (
          React.createElement("div", { className: "yggdrasil-top-bar-active-project", title: `Currently active project: ${activeProjectName}`},
            React.createElement("span", { className: "yggdrasil-top-bar-project-icon" }, "🌲"), activeProjectName
          )
        ) : null
      ),

      React.createElement("div", { className: "yggdrasil-top-bar-section right" },
        React.createElement("span", {
          className: `yggdrasil-top-bar-action-item api-status ${apiKeyIsSet ? 'success' : 'error'}`,
          title: apiKeyIsSet ? "Gemini API Key is active." : "Gemini API Key not set. AI features disabled."
        }, apiKeyIsSet ? '🔑' : '⚠️'),
        React.createElement("button", { 
          onClick: onSaveActiveProject, 
          disabled: isAppBusy || !hasTechTreeData, 
          className: `yggdrasil-top-bar-action-item primary yggdrasil-top-bar-save-button ${saveFeedback ? 'saved' : ''}`,
          title: hasTechTreeData ? "Save the current state of the active project (Ctrl+S)." : "No active project data to save."
        }, saveFeedback ? '✓' : '💾'),
        React.createElement("button", { 
          onClick: onDownloadActiveProject, 
          disabled: isAppBusy || !hasTechTreeData, 
          className: `yggdrasil-top-bar-action-item primary yggdrasil-top-bar-download-button ${downloadFeedback ? 'saved' : ''}`,
          title: hasTechTreeData ? "Save active project and download as .project.json" : "No active project data to download."
        }, downloadFeedback ? '✓' : '📥'), 
        React.createElement("button", {
          onClick: onToggleTheme,
          className: "yggdrasil-top-bar-action-item base-icon-button",
          title: `Switch to ${nextThemeInfo.next} Mode`,
          "aria-label": `Toggle theme to ${nextThemeInfo.next} Mode`,
          disabled: isAppBusy
        }, nextThemeInfo.icon),
        React.createElement("button", {
          onClick: () => window.location.reload(),
          className: "yggdrasil-top-bar-action-item base-icon-button",
          title: "Reload Application",
          "aria-label": "Reload Application",
          disabled: isAppBusy
        }, "🔄")
      )
    )
  );
};

export default YggdrasilTopBar;
