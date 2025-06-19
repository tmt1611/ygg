<<<<<<< SEARCH
import WorkspaceTabContent from './tabs/WorkspaceTabContent.js';
import GraphViewComponent from './GraphViewComponent.js';
import ListViewTabContent from './tabs/ListViewTab.js';
import FocusViewComponent from './FocusViewComponent.js';
import OverlayPanelView from './OverlayPanelView.js';

const MainContentRouter = ({
  yggdrasilViewMode, activeOverlayPanel, setActiveOverlayPanel,
  techTreeData, isLoading, isModifying, isAppBusy,
  projectManager, initialPrompt, setInitialPrompt, currentTreeStats,
  nodeOperations, viewStates, treeOperationsAI, apiKeyHook,
  onExtractData, extractionMode, setExtractionMode, isSummarizing,
  projectLinkingHook, handleNodeSelectedForInsightsOrActions, onToggleNodeActionsPanel,
  modalManager,
  handleDeleteNodeWithConfirmation,
}) => {

  if (yggdrasilViewMode === 'workspace' && !isLoading && !isModifying) {
    return (
      React.createElement(WorkspaceTabContent, {
        activeSubTab: viewStates.activeWorkspaceSubTab,
        setActiveSubTab: viewStates.setActiveWorkspaceSubTab,
        projects: projectManager.projects,
        activeProjectId: projectManager.activeProjectId,
        onLoadProject: (id) => projectManager.handleSetActiveProject(id),
        onRenameProject: projectManager.handleRenameProject,
        onDeleteProject: projectManager.handleDeleteProject,
        onAddNewProjectFromFile: projectManager.handleAddNewProjectFromFile,
        onCreateEmptyProject: projectManager.handleCreateNewProject,
        onSaveAsExample: projectManager.handleSaveCurrentTreeAsExampleProject,
        onLoadAndGoToGraph: projectManager.handleLoadAndGoToGraph,
        initialPrompt: initialPrompt,
        setInitialPrompt: setInitialPrompt,
        handleGenerateTree: treeOperationsAI.handleGenerateNewTree,
        isLoadingInitial: isLoading,
        handleDownloadTree: () => projectManager.handleSaveActiveProject(true),
        apiKeyHook: apiKeyHook,
        onExtractData: onExtractData,
        extractionMode: extractionMode,
        setExtractionMode: setExtractionMode,
        isSummarizing: isSummarizing,
        isAppBusy: isAppBusy,
        currentTreeStats: currentTreeStats,
        contextText: initialPrompt
      })
    );
  }
=======
import WorkspaceTabContent from './tabs/WorkspaceTabContent.js';
import GraphViewComponent from './GraphViewComponent.js';
import ListViewTabContent from './tabs/ListViewTab.js';
import FocusViewComponent from './FocusViewComponent.js';
import OverlayPanelView from './OverlayPanelView.js';

const MainContentRouter = ({
  yggdrasilViewMode, activeOverlayPanel, setActiveOverlayPanel,
  techTreeData, isLoading, isModifying, isAppBusy,
  projectManager, initialPrompt, setInitialPrompt, currentTreeStats,
  nodeOperations, viewStates, treeOperationsAI, apiKeyHook,
  onExtractData, extractionMode, setExtractionMode, isSummarizing,
  projectLinkingHook, handleNodeSelectedForInsightsOrActions, onToggleNodeActionsPanel,
  modalManager,
  handleDeleteNodeWithConfirmation,
}) => {

  if (yggdrasilViewMode === 'workspace' && !isLoading && !isModifying) {
    return (
      React.createElement(WorkspaceTabContent, {
        activeSubTab: viewStates.activeWorkspaceSubTab,
        setActiveSubTab: viewStates.setActiveWorkspaceSubTab,
        projects: projectManager.projects,
        activeProjectId: projectManager.activeProjectId,
        onLoadProject: (id) => projectManager.handleSetActiveProject(id),
        onRenameProject: projectManager.handleRenameProject,
        onDeleteProject: projectManager.handleDeleteProject,
        onAddNewProjectFromFile: projectManager.handleAddNewProjectFromFile,
        onCreateEmptyProject: projectManager.handleCreateNewProject,
        onSaveAsExample: projectManager.handleSaveCurrentTreeAsExampleProject,
        onLoadAndGoToGraph: projectManager.handleLoadAndGoToGraph,
        initialPrompt: initialPrompt,
        setInitialPrompt: setInitialPrompt,
        handleGenerateTree: treeOperationsAI.handleGenerateNewTree,
        isLoadingInitial: isLoading,
        handleDownloadTree: () => projectManager.handleSaveActiveProject(true),
        apiKeyHook: apiKeyHook,
        onExtractData: onExtractData,
        extractionMode: extractionMode,
        setExtractionMode: setExtractionMode,
        isSummarizing: isSummarizing,
        isAppBusy: isAppBusy,
        currentTreeStats: currentTreeStats,
        contextText: initialPrompt,
        handleToggleAllLock: nodeOperations.handleToggleAllLock,
      })
    );
  }
>>>>>>> REPLACE