import React from 'react';
import ProjectOverviewPanel from '../ProjectOverviewPanel.js'; 
import ProjectManagementPanel from '../panels/ProjectManagementPanel.js';
import ApiKeySetupPanel from '../panels/ApiKeySetupPanel.js';
import AiGenerationPanel from '../panels/AiGenerationPanel.js';
import DataOperationsPanel from '../panels/DataOperationsPanel.js';


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

  const controlsDisabled = isAppBusy; 
  const generateUIDisabled = controlsDisabled || !apiKeyHook.status.isSet;
  const activeUserProjectExists = !!(activeProjectId && projects.find(p => p.id === activeProjectId && !p.isExample)); 
  const currentTreeExists = !!(projects.find(p => p.id === activeProjectId));

  return (
    React.createElement("div", { className: "workspace-tab-container" },
      React.createElement("div", { className: "workspace-content-area", style: { display: 'flex', flexDirection: 'column', gap: '25px' }}, 
          React.createElement(ProjectOverviewPanel, {
            stats: currentTreeStats,
            projectName: contextText,
            onToggleAllLock: handleToggleAllLock,
            isAppBusy: isAppBusy,
          }),
          React.createElement(ProjectManagementPanel, {
            projects, activeProjectId, onLoadProject, onRenameProject, onDeleteProject, 
            onAddNewProjectFromFile, onCreateEmptyProject, onSaveAsExample, onLoadAndGoToGraph,
            isAppBusy, currentTreeExists
          }),
          React.createElement(AiGenerationPanel, {
            initialPrompt, setInitialPrompt, handleGenerateTree, isLoadingInitial,
            generateUIDisabled, activeUserProjectExists, apiKeyIsSet: apiKeyHook.status.isSet
          }),
          React.createElement(DataOperationsPanel, {
            handleDownloadTree, onExtractData, extractionMode, setExtractionMode, isSummarizing,
            currentTreeExists, controlsDisabled, apiKeyIsSet: apiKeyHook.status.isSet
          }),
          React.createElement(ApiKeySetupPanel, { apiKeyHook, controlsDisabled })
      )
    )
  );
};

export default WorkspaceTabContent;