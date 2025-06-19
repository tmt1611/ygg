import React from 'react';
import WorkspaceTabContent from './tabs/WorkspaceTabContent.js';
import GraphViewComponent from './GraphViewComponent.js';
import ListViewTabContent from './tabs/ListViewTab.js';
import FocusViewComponent from './FocusViewComponent.js';
import LoadingSpinner from './LoadingSpinner.js';

const MainContentRouter = ({
  appState,
  appHooks,
  appCallbacks,
  viewControls,
}) => {
  const {
    techTreeData, isLoading, isModifying, isAppBusy,
    initialPrompt, setInitialPrompt, currentTreeStats,
    isSummarizing
  } = appState;

  const {
    projectManager, nodeOperations, viewStates,
    treeOperationsAI, apiKeyHook, projectLinkingHook,
    modalManager
  } = appHooks;

  const {
    handleExtractData, handleNodeSelectedForInsightsOrActions,
    handleDeleteNodeWithConfirmation
  } = appCallbacks;

  const {
    yggdrasilViewMode, setYggdrasilViewMode
  } = viewControls;

  const renderContent = () => {
    switch(yggdrasilViewMode) {
      case 'workspace':
        if (isLoading) return React.createElement(LoadingSpinner, { message: "Generating Structure..." });
        if (isModifying && !modalManager.isAiSuggestionModalOpen) return React.createElement(LoadingSpinner, { message: "AI Applying Modifications..." });
        return React.createElement(WorkspaceTabContent, {
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
          onExtractData: handleExtractData,
          extractionMode: modalManager.extractionMode,
          setExtractionMode: modalManager.setExtractionMode,
          isSummarizing: isSummarizing,
          isAppBusy: isAppBusy,
          currentTreeStats: currentTreeStats,
          contextText: initialPrompt,
          handleToggleAllLock: nodeOperations.handleToggleAllLock,
        });

      case 'graph':
        return React.createElement(GraphViewComponent, {
          treeData: techTreeData,
          activeNodeId: viewStates.selectedGraphNodeId,
          onSelectNode: handleNodeSelectedForInsightsOrActions,
          onSwitchToFocusView: viewStates.handleSwitchToFocusView,
          onOpenContextMenu: modalManager.openContextMenu,
          isAppBusy: isAppBusy,
          projects: projectManager.projects,
          activeProjectId: projectManager.activeProjectId,
          findLinkSource: projectLinkingHook.findLinkSource,
          handleNavigateToSourceNode: projectLinkingHook.handleNavigateToSourceNode,
          onNavigateToLinkedProject: projectLinkingHook.handleNavigateToLinkedProject
        });

      case 'list':
        return React.createElement("div", { className: "workspace-tab-container" },
          React.createElement(ListViewTabContent, {
            techTreeData: techTreeData,
            showListDescriptionsGlobal: viewStates.showListDescriptionsGlobal,
            onToggleNodeLock: nodeOperations.handleToggleNodeLock,
            onAddQuickChild: nodeOperations.handleQuickAddChild,
            onNodeImportanceChange: nodeOperations.handleNodeImportanceChange,
            onOpenNodeEditModal: modalManager.openNodeEditModal,
            isAppBusy: isAppBusy,
            collapsedNodeIds: viewStates.collapsedNodeIds,
            onToggleCollapseNode: viewStates.handleToggleCollapseNode,
            handleToggleAllNodesList: viewStates.handleToggleAllNodesList,
            onSwitchToFocusView: viewStates.handleSwitchToFocusView,
            onNavigateToLinkedProject: projectLinkingHook.handleNavigateToLinkedProject,
            onOpenContextMenu: modalManager.openContextMenu,
            onSelectListItem: (nodeId) => viewStates.setSelectedGraphNodeId(nodeId),
            selectedNodeId: viewStates.selectedGraphNodeId,
            projects: projectManager.projects,
            activeProjectId: projectManager.activeProjectId,
            treeDataRootId: techTreeData?.id,
            findLinkSource: projectLinkingHook.findLinkSource,
            handleNavigateToSourceNode: projectLinkingHook.handleNavigateToSourceNode
          })
        );
      
      case 'focus':
        if (!viewStates.focusNodeId && techTreeData) {
            // Fallback: If focus is selected without a node, switch to graph view.
            setTimeout(() => setYggdrasilViewMode('graph'), 0);
            return React.createElement(LoadingSpinner, { message: "Redirecting..." });
        }
        if (!techTreeData) {
            return React.createElement("div", { className: "placeholder-center-content" },
                React.createElement("span", { className: "placeholder-icon" }, "🎯"),
                React.createElement("h2", null, "No Data to Focus On"),
                React.createElement("p", null, "Go to Workspace to generate or load a project first."),
                React.createElement("button", { onClick: () => setYggdrasilViewMode('workspace') }, "Go to Workspace")
            );
        }
        return React.createElement(FocusViewComponent, {
          treeData: techTreeData,
          focusNodeId: viewStates.focusNodeId,
          selectedNodeInPanelId: viewStates.selectedNodeInFocusPanelId,
          onSelectNodeInPanel: viewStates.setSelectedNodeInFocusPanelId,
          onChangeFocusNode: (id) => viewStates.handleSwitchToFocusView(id, techTreeData),
          onExitFocusView: () => setYggdrasilViewMode('graph'),
          onOpenNodeEditModal: modalManager.openNodeEditModal,
          onToggleLock: nodeOperations.handleToggleNodeLock,
          onNodeImportanceChange: nodeOperations.handleNodeImportanceChange,
          isAppBusy: isAppBusy,
          onNavigateToLinkedProject: projectLinkingHook.handleNavigateToLinkedProject,
          onUnlinkProjectFromNode: projectLinkingHook.handleUnlinkProjectFromNode,
          onOpenLinkProjectModal: projectLinkingHook.handleOpenLinkProjectModal,
          onDeleteNode: handleDeleteNodeWithConfirmation,
          onOpenContextMenu: modalManager.openContextMenu,
          projects: projectManager.projects,
          activeProjectId: projectManager.activeProjectId,
          findLinkSource: projectLinkingHook.findLinkSource,
          handleNavigateToSourceNode: projectLinkingHook.handleNavigateToSourceNode
        });

      default:
        // Fallback for invalid view mode
        setTimeout(() => setYggdrasilViewMode('workspace'), 0);
        return React.createElement(LoadingSpinner, { message: "Loading..." });
    }
  };

  return renderContent();
};

export default MainContentRouter;