import React, { useState } from 'react';
import ProjectOverviewPanel from '../ProjectOverviewPanel.js';
import ProjectManagementPanel from '../panels/ProjectManagementPanel.js';
import ApiKeySetupPanel from '../panels/ApiKeySetupPanel.js';
import AiGenerationPanel from '../panels/AiGenerationPanel.js';
import DataOperationsPanel from '../panels/DataOperationsPanel.js';
import CollapsiblePanel from '../CollapsiblePanel.js';

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
            React.createElement(ProjectOverviewPanel, {
              stats: currentTreeStats,
              projectName: contextText,
              onToggleAllLock: handleToggleAllLock,
              isAppBusy: isAppBusy,
            })
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