import React, { useState } from 'react';
import ProjectManagementPanel from '../panels/ProjectManagementPanel.js';
import ApiKeySetupPanel from '../panels/ApiKeySetupPanel.js';
import AiGenerationPanel from '../panels/AiGenerationPanel.js';
import DataOperationsPanel from '../panels/DataOperationsPanel.js';
import CollapsiblePanel from '../CollapsiblePanel.js';

const StatDisplay = ({ label, value, valueClassName }) => (
  React.createElement("div", { className: "stat-item" },
    React.createElement("span", { className: "stat-label" }, label),
    React.createElement("span", { className: `stat-value ${valueClassName || ''}` }, value)
  )
);

const WorkspaceTabContent = ({
  projects, activeProjectId, onLoadProject, onRenameProject, onDeleteProject, onAddNewProjectFromFile, onCreateEmptyProject, onSaveAsExample, onLoadAndGoToGraph,
  initialPrompt, setInitialPrompt, handleGenerateTree, isLoadingInitial, handleDownloadTree,
  apiKeyHook,
  onExtractData, extractionMode, setExtractionMode, isSummarizing,
  isAppBusy,
  currentTreeStats,
  contextText,
  handleToggleAllLock,
}) => {

  const [collapsedPanels, setCollapsedPanels] = useState(new Set(['api-key-setup']));

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

  const controlsDisabled = isAppBusy; 
  const generateUIDisabled = controlsDisabled || !apiKeyHook.status.isSet;
  const activeUserProjectExists = !!(activeProjectId && projects.find(p => p.id === activeProjectId && !p.isExample)); 
  const currentTreeExists = !!(projects.find(p => p.id === activeProjectId));

  return (
    React.createElement("div", { className: "workspace-tab-container" },
      React.createElement("div", { className: "workspace-content-area", style: { display: 'flex', flexDirection: 'column', gap: '15px' }}, 
          React.createElement(CollapsiblePanel, {
            panelId: "project-overview",
            title: "Project Overview",
            icon: "📊",
            isCollapsed: collapsedPanels.has('project-overview'),
            onToggle: handleTogglePanel
          },
            currentTreeStats ? (
              React.createElement(React.Fragment, null,
                React.createElement("div", { style: {display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px'}},
                    React.createElement("h3", { className: "panel-header", style: {margin: 0, fontSize: '1.2em'}},
                      "Overview: ", contextText || 'Current Project'
                    ),
                    React.createElement("button", { 
                        onClick: onToggleAllLock, 
                        disabled: isAppBusy, 
                        className: "secondary panel-button",
                        style: {padding: '5px 10px', fontSize: '0.9em'},
                        title: currentTreeStats.isAllLocked ? 'Unlock all nodes in the current project' : 'Lock all nodes in the current project to prevent changes'
                    },
                        currentTreeStats.isAllLocked ? '🔓 Unlock All' : '🔒 Lock All'
                    )
                ),
                React.createElement("div", { className: "project-stats-grid" },
                  React.createElement(StatDisplay, { label: "Total Nodes", value: currentTreeStats.totalNodes }),
                  React.createElement(StatDisplay, { label: "Maximum Depth", value: currentTreeStats.depth }),
                  React.createElement(StatDisplay, { label: "Locked Nodes", value: currentTreeStats.lockedCount, valueClassName: currentTreeStats.lockedCount > 0 ? 'locked' : '' }),
                  React.createElement(StatDisplay, { label: "Minor Nodes", value: currentTreeStats.importanceCounts.minor, valueClassName: "importance-minor" }),
                  React.createElement(StatDisplay, { label: "Common Nodes", value: currentTreeStats.importanceCounts.common, valueClassName: "importance-common" }),
                  React.createElement(StatDisplay, { label: "Major Nodes", value: currentTreeStats.importanceCounts.major, valueClassName: "importance-major" })
                )
              )
            ) : (
              React.createElement("p", { style: { color: 'var(--text-secondary)', textAlign: 'center', padding: '10px 0' }},
                "Load or create a project to view its statistics."
              )
            )
          ),
          React.createElement(CollapsiblePanel, {
            panelId: "project-management",
            title: "Project Management",
            icon: "🗂️",
            isCollapsed: collapsedPanels.has('project-management'),
            onToggle: handleTogglePanel
          },
            React.createElement(ProjectManagementPanel, {
              projects, activeProjectId, onLoadProject, onRenameProject, onDeleteProject, 
              onAddNewProjectFromFile, onCreateEmptyProject, onSaveAsExample, onLoadAndGoToGraph,
              isAppBusy, currentTreeExists
            })
          ),
          React.createElement(CollapsiblePanel, {
            panelId: "ai-generation",
            title: "AI Structure Generation",
            icon: "🧠",
            isCollapsed: collapsedPanels.has('ai-generation'),
            onToggle: handleTogglePanel
          },
            React.createElement(AiGenerationPanel, {
              initialPrompt, setInitialPrompt, handleGenerateTree, isLoadingInitial,
              generateUIDisabled, activeUserProjectExists, apiKeyIsSet: apiKeyHook.status.isSet
            })
          ),
          React.createElement(CollapsiblePanel, {
            panelId: "data-operations",
            title: "Data Operations",
            icon: "📤",
            isCollapsed: collapsedPanels.has('data-operations'),
            onToggle: handleTogglePanel
          },
            React.createElement(DataOperationsPanel, {
              handleDownloadTree, onExtractData, extractionMode, setExtractionMode, isSummarizing,
              currentTreeExists, controlsDisabled, apiKeyIsSet: apiKeyHook.status.isSet
            })
          ),
          React.createElement(CollapsiblePanel, {
            panelId: "api-key-setup",
            title: "API Key Setup",
            icon: "🔑",
            isCollapsed: collapsedPanels.has('api-key-setup'),
            onToggle: handleTogglePanel
          },
            React.createElement(ApiKeySetupPanel, { apiKeyHook, controlsDisabled })
          )
      )
    )
  );
};

export default WorkspaceTabContent;