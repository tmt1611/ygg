
import React from 'react';
import ProjectOverviewPanel from '../ProjectOverviewPanel.js'; 
import ProjectManagementPanel from '../panels/ProjectManagementPanel.js';
import ApiKeySetupPanel from '../panels/ApiKeySetupPanel.js';
import AiGenerationPanel from '../panels/AiGenerationPanel.js';
import DataOperationsPanel from '../panels/DataOperationsPanel.js';


const WorkspaceTabContent = ({
  activeSubTab, setActiveSubTab,
  projects, activeProjectId, onLoadProject, onRenameProject, onDeleteProject, onAddNewProjectFromFile, onCreateEmptyProject, onSaveAsExample, onLoadAndGoToGraph,
  initialPrompt, setInitialPrompt, handleGenerateTree, isLoadingInitial, handleDownloadTree,
  apiKeyHook,
  onExtractData, extractionMode, setExtractionMode, isSummarizing,
  isAppBusy,
  currentTreeStats,
  contextText,
}) => {

  const subTabsToShow = ['projects', 'overview_stats'];

  const controlsDisabled = isAppBusy; 
  const generateUIDisabled = controlsDisabled || !apiKeyHook.status.isSet;
  const activeUserProjectExists = !!(activeProjectId && projects.find(p => p.id === activeProjectId && !p.isExample)); 
  const currentTreeExists = !!(projects.find(p => p.id === activeProjectId));

  return (
    React.createElement("div", { className: "workspace-tab-container", style: { display: 'flex', flexDirection: 'column', height: '100%' }},
      React.createElement("nav", { className: "workspace-sub-nav" },
        subTabsToShow.map(subTab => (
          React.createElement("button", {
            key: subTab,
            onClick: () => setActiveSubTab(subTab),
            className: activeSubTab === subTab ? 'active' : '',
            disabled: isAppBusy && activeSubTab !== subTab,
            title: subTab === 'projects' ? "Manage projects, API key, AI generation, and data operations" : "View statistics for the active project"
          },
            subTab === 'projects' ? 'Project Management & AI Ops' :
             subTab === 'overview_stats' ? 'Overview & Stats' :
             ''
          )
        ))
      ),
      React.createElement("div", { className: "workspace-content-area" },
        activeSubTab === 'projects' && (
          React.createElement("div", { style: { display: 'flex', flexDirection: 'column', gap: '25px' }}, 
            React.createElement(ProjectManagementPanel, {
              projects, activeProjectId, onLoadProject, onRenameProject, onDeleteProject, 
              onAddNewProjectFromFile, onCreateEmptyProject, onSaveAsExample, onLoadAndGoToGraph,
              isAppBusy, currentTreeExists
            }),
            React.createElement(ApiKeySetupPanel, { apiKeyHook, controlsDisabled }),
            React.createElement(AiGenerationPanel, {
              initialPrompt, setInitialPrompt, handleGenerateTree, isLoadingInitial,
              generateUIDisabled, activeUserProjectExists, apiKeyIsSet: apiKeyHook.status.isSet
            }),
            React.createElement(DataOperationsPanel, {
              handleDownloadTree, onExtractData, extractionMode, setExtractionMode, isSummarizing,
              currentTreeExists, controlsDisabled, apiKeyIsSet: apiKeyHook.status.isSet
            })
          )
        ),
        activeSubTab === 'overview_stats' && (
          React.createElement(ProjectOverviewPanel, {
            stats: currentTreeStats,
            projectName: contextText,
          })
        )
      )
    )
  );
};

export default WorkspaceTabContent;
