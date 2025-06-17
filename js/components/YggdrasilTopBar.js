
import React, { useState, useEffect } from 'react';
// import { ThemeMode, YggdrasilViewMode, ActiveOverlayPanel } from '../types.js'; // Types removed

const YggdrasilTopBar = ({
  themeMode, onToggleTheme, apiKeyIsSet, activeProjectName, onSaveActiveProject, 
  onDownloadActiveProject, 
  isAppBusy, hasTechTreeData,
  yggdrasilViewMode, activeOverlayPanel, setYggdrasilViewMode, setActiveOverlayPanel,
  focusNodeId
}) => {
  const [saveFeedback, setSaveFeedback] = useState(false);
  const [downloadFeedback, setDownloadFeedback] = useState(false);

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
        }, "API: ", apiKeyIsSet ? 'Active' : 'Error'),
        React.createElement("button", { 
          onClick: handleSaveClick, 
          disabled: isAppBusy || !hasTechTreeData || saveFeedback, 
          className: `yggdrasil-top-bar-action-item primary yggdrasil-top-bar-save-button ${saveFeedback ? 'saved' : ''}`,
          title: hasTechTreeData ? "Save the current state of the active project." : "No active project data to save."
        }, saveFeedback ? 'Saved ✓' : 'Save'),
        React.createElement("button", { 
          onClick: handleDownloadClick, 
          disabled: isAppBusy || !hasTechTreeData || downloadFeedback, 
          className: `yggdrasil-top-bar-action-item primary yggdrasil-top-bar-download-button ${downloadFeedback ? 'saved' : ''}`,
          title: hasTechTreeData ? "Save active project and download as .project.json" : "No active project data to download."
        }, downloadFeedback ? 'Downloaded ✓' : '💾⇩'), 
        React.createElement("button", {
          onClick: onToggleTheme,
          className: "yggdrasil-top-bar-action-item base-icon-button",
          title: `Switch to ${themeMode === 'light' ? 'Dark' : 'Light'} Mode`,
          "aria-label": `Toggle theme to ${themeMode === 'light' ? 'Dark' : 'Light'} Mode`,
          disabled: isAppBusy
        }, themeMode === 'light' ? '🌙' : '☀️')
      )
    )
  );
};

export default YggdrasilTopBar;
