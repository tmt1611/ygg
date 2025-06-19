import React from 'react';
import WorkspaceTabContent from './tabs/WorkspaceTabContent.js';
import GraphViewComponent from './GraphViewComponent.js';
import ListViewTabContent from './tabs/ListViewTab.js';
import FocusViewComponent from './FocusViewComponent.js';
import OverlayPanelView from './OverlayPanelView.js';
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
    toggleNodeActionsPanelVisibility,
    handleDeleteNodeWithConfirmation
  } = appCallbacks;

  const {
    yggdrasilViewMode, activeOverlayPanel, setActiveOverlayPanel
  } = viewControls;

  if (yggdrasilViewMode === 'workspace') {
    if (isLoading) {
        return React.createElement(LoadingSpinner, { message: "Generating Structure..." });
    }
    if (isModifying && !modalManager.isAiSuggestionModalOpen) {
        return React.createElement(LoadingSpinner, { message: "AI Applying Modifications..." });
    }
    
    return (
      React.createElement(WorkspaceTabContent, {
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
      })
    );
  }

  // Fallback for when data is loading/modifying, or when not in workspace view
  return (
    React.createElement(React.Fragment, null,
      React.createElement("div", {
        className: `yggdrasil-view-content-wrapper ${yggdrasilViewMode} ${activeOverlayPanel ? `overlay-active-${activeOverlayPanel}` : ''}`,
        style: {
            display: yggdrasilViewMode !== 'treeView' ? 'none' : 'block',
            height: '100%'
        }
      },
        React.createElement(GraphViewComponent, {
          treeData,
          activeNodeId: viewStates.selectedGraphNodeId,
          onSelectNode: handleNodeSelectedForInsightsOrActions,
          onSwitchToFocusView: viewStates.handleSwitchToFocusView,
          onOpenContextMenu: modalManager.openContextMenu,
          isAppBusy: isAppBusy,
          onToggleNodeActionsPanel: toggleNodeActionsPanelVisibility,
          projects: projectManager.projects,
          activeProjectId: projectManager.activeProjectId,
          findLinkSource: projectLinkingHook.findLinkSource,
          handleNavigateToSourceNode: projectLinkingHook.handleNavigateToSourceNode,
          onNavigateToLinkedProject: projectLinkingHook.handleNavigateToLinkedProject
        })
      ),

      activeOverlayPanel && (
        React.createElement(OverlayPanelView, {
          title: activeOverlayPanel === 'list' ? "List View" : activeOverlayPanel === 'focus' ? "Focus View" : "Panel",
          isOpen: !!activeOverlayPanel,
          onClosePanel: () => setActiveOverlayPanel(null),
          onRestoreFocus: modalManager.restoreFocus,
          pathDisplayProps: activeOverlayPanel === 'focus' && viewStates.focusNodeId ? {
            treeData: techTreeData,
            currentNodeId: viewStates.selectedNodeInFocusPanelId || viewStates.focusNodeId,
            onSelectPathNode: viewStates.handleSwitchToFocusView,
            pathContext: 'stellar',
          } : null,
        },
          activeOverlayPanel === 'list' && (
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
          ),
          activeOverlayPanel === 'focus' && viewStates.focusNodeId && (
            React.createElement(FocusViewComponent, {
              treeData: techTreeData,
              focusNodeId: viewStates.focusNodeId,
              selectedNodeInPanelId: viewStates.selectedNodeInFocusPanelId,
              onSelectNodeInPanel: viewStates.setSelectedNodeInFocusPanelId,
              onChangeFocusNode: (id) => viewStates.handleSwitchToFocusView(id, techTreeData),
              onExitFocusView: () => setActiveOverlayPanel(null),
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
            })
          )
        )
      )
    )
  );
};

export default MainContentRouter;