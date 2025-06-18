
import React from 'react';
import ProjectsTabContent from './ProjectsTabContent.js'; 
import ProjectOverviewPanel from '../ProjectOverviewPanel.js'; 

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
          React.createElement(ProjectsTabContent, {
            projects: projects,
            activeProjectId: activeProjectId,
            onLoadProject: onLoadProject,
            onRenameProject: onRenameProject,
            onDeleteProject: onDeleteProject,
            onAddNewProjectFromFile: onAddNewProjectFromFile,
            onCreateEmptyProject: onCreateEmptyProject,
            onSaveAsExample: onSaveAsExample, 
            isAppBusy: isAppBusy,
            initialPrompt: initialPrompt, 
            setInitialPrompt: setInitialPrompt, 
            handleGenerateTree: handleGenerateTree,
            isLoadingInitial: isLoadingInitial,
            handleDownloadTree: handleDownloadTree,
            apiKeyHook: apiKeyHook,
            onExtractData: onExtractData,
            extractionMode: extractionMode,
            setExtractionMode: setExtractionMode,
            isSummarizing: isSummarizing,
            onLoadAndGoToGraph: onLoadAndGoToGraph
          })
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
