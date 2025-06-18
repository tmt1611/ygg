
import React, { useState, useEffect, useMemo } from 'react';

const getNextThemeInfo = (currentTheme) => {
    switch (currentTheme) {
        case 'dark': return { next: 'Light', icon: '☀️' };
        case 'light': return { next: 'Nebula', icon: '🌌' };
        case 'nebula': return { next: 'Dark', icon: '🌙' };
        default: return { next: 'Light', icon: '☀️' };
    }
};

const YggdrasilTopBar = ({
  themeMode, onToggleTheme, apiKeyIsSet, activeProjectName, onSaveActiveProject, 
  onDownloadActiveProject, 
  isAppBusy, hasTechTreeData,
  yggdrasilViewMode, activeOverlayPanel, setYggdrasilViewMode, setActiveOverlayPanel,
  focusNodeId
}) => {
  const [saveFeedback, setSaveFeedback] = useState(false);
  const [downloadFeedback, setDownloadFeedback] = useState(false);

  const nextThemeInfo = useMemo(() => getNextThemeInfo(themeMode), [themeMode]);

  const handleSaveClick = () => {
    onSaveActiveProject();
    setSaveFeedback(true);
  };

  const handleDownloadClick = () => {
    onDownloadActiveProject(); 
    setDownloadFeedback(true);
  };

  useEffect(() => {
    let timer;
    if (saveFeedback) {
      timer = setTimeout(() => setSaveFeedback(false), 1500); 
    }
    return () => clearTimeout(timer);
  }, [saveFeedback]);

  useEffect(() => {
    let timer;
    if (downloadFeedback) {
      timer = setTimeout(() => setDownloadFeedback(false), 1500); 
    }
    return () => clearTimeout(timer);
  }, [downloadFeedback]);


  const handleNavClick = (viewMode, overlay = null) => {
    setYggdrasilViewMode(viewMode);
    setActiveOverlayPanel(overlay);
  };

  const isFocusViewDisabled = !focusNodeId && yggdrasilViewMode === 'treeView' && activeOverlayPanel === 'focus';


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
          className: `yggdrasil-top-bar-nav-button ${yggdrasilViewMode === 'treeView' && activeOverlayPanel === null ? 'active' : ''}`,
          onClick: () => handleNavClick('treeView', null),
          disabled: isAppBusy && !(yggdrasilViewMode === 'treeView' && activeOverlayPanel === null),
          title: "Interactive graph visualization of the tree"
        }, "Graph"),
        React.createElement("button", {
          className: `yggdrasil-top-bar-nav-button ${yggdrasilViewMode === 'treeView' && activeOverlayPanel === 'list' ? 'active' : ''}`,
          onClick: () => handleNavClick('treeView', 'list'),
          disabled: isAppBusy && !(yggdrasilViewMode === 'treeView' && activeOverlayPanel === 'list'),
          title: "Hierarchical list view of the tree"
        }, "List"),
        React.createElement("button", {
          className: `yggdrasil-top-bar-nav-button ${yggdrasilViewMode === 'treeView' && activeOverlayPanel === 'focus' ? 'active' : ''}`,
          onClick: () => focusNodeId ? handleNavClick('treeView', 'focus') : alert("Select a node from Graph or List view to enter Focus View."),
          disabled:(isAppBusy && !(yggdrasilViewMode === 'treeView' && activeOverlayPanel === 'focus')) || (isFocusViewDisabled && !focusNodeId),
          title: focusNodeId ? "Detailed view of the currently focused node" : "Select a node to enable Focus View"
        }, "Focus"),
        activeProjectName && (
          React.createElement("div", { className: "yggdrasil-top-bar-active-project", title: `Currently active project: ${activeProjectName}`},
            React.createElement("span", null, "🌲 Active:"), " ", activeProjectName
          )
        )
      ),

      React.createElement("div", { className: "yggdrasil-top-bar-section right" },
        React.createElement("span", {
          className: `yggdrasil-top-bar-action-item api-status ${apiKeyIsSet ? 'success' : 'error'}`,
          title: apiKeyIsSet ? "Gemini API Key is active." : "Gemini API Key not set. AI features disabled."
        }, apiKeyIsSet ? '🔑' : '⚠️'),
        React.createElement("button", { 
          onClick: handleSaveClick, 
          disabled: isAppBusy || !hasTechTreeData, 
          className: `yggdrasil-top-bar-action-item primary yggdrasil-top-bar-save-button ${saveFeedback ? 'saved' : ''}`,
          title: hasTechTreeData ? "Save the current state of the active project." : "No active project data to save."
        }, saveFeedback ? '✓' : '💾'),
        React.createElement("button", { 
          onClick: handleDownloadClick, 
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
        }, nextThemeInfo.icon)
      )
    )
  );
};

export default YggdrasilTopBar;
