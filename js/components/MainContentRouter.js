
import React from 'react';
// import { TechTreeNode, YggdrasilViewMode, ActiveOverlayPanel, NodeStatus, WorkspaceSubTab } from '../types.js'; // Types removed
// Hooks are imported but their specific type definitions for return values are not part of the JS runtime.

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

  if (yggdrasilViewMode === 'treeView' && techTreeData && !isLoading && !isModifying) {
    if (activeOverlayPanel === null) {
      return (
        React.createElement(GraphViewComponent, {
          treeData: techTreeData,
          activeNodeId: viewStates.selectedGraphNodeId,
          onSelectNode: handleNodeSelectedForInsightsOrActions,
          onSwitchToFocusView: viewStates.handleSwitchToFocusView,
          onOpenNodeEditModal: modalManager.openNodeEditModal,
          onToggleLock: nodeOperations.handleToggleNodeLock,
          onNodeImportanceChange: nodeOperations.handleNodeImportanceChange,
          onOpenContextMenu: modalManager.openContextMenu,
          onNavigateToLinkedProject: projectLinkingHook.handleNavigateToLinkedProject,
          onUnlinkProjectFromNode: projectLinkingHook.handleUnlinkProjectFromNode,
          isAppBusy: isAppBusy,
          onToggleNodeActionsPanel: onToggleNodeActionsPanel, 
          projects: projectManager.projects,
          activeProjectId: projectManager.activeProjectId,
          findLinkSource: projectLinkingHook.findLinkSource,
          handleNavigateToSourceNode: projectLinkingHook.handleNavigateToSourceNode
        })
      );
    }

    if (activeOverlayPanel === 'list') {
      return (
        React.createElement(OverlayPanelView, { title: "List View", isOpen: true, onClosePanel: () => setActiveOverlayPanel(null), onRestoreFocus: modalManager.restoreFocus },
             React.createElement(ListViewTabContent, {
                techTreeData: techTreeData,
                showListDescriptionsGlobal: viewStates.showListDescriptionsGlobal, 
                onToggleNodeLock: nodeOperations.handleToggleNodeLock,
                onAddQuickChild: nodeOperations.handleQuickAddChild,
                onNodeImportanceChange: nodeOperations.handleNodeImportanceChange,
                onOpenNodeEditModal: modalManager.openNodeEditModal,
                searchTerm: viewStates.listSearchTerm, 
                isAppBusy: isAppBusy,
                collapsedNodeIds: viewStates.collapsedNodeIds,
                onToggleCollapseNode: viewStates.handleToggleCollapseNode,
                onSwitchToFocusView: viewStates.handleSwitchToFocusView,
                onNavigateToLinkedProject: projectLinkingHook.handleNavigateToLinkedProject,
                onOpenContextMenu: modalManager.openContextMenu,
                onSelectListItem: handleNodeSelectedForInsightsOrActions,
                projects: projectManager.projects,
                activeProjectId: projectManager.activeProjectId,
                findLinkSource: projectLinkingHook.findLinkSource,
                handleNavigateToSourceNode: projectLinkingHook.handleNavigateToSourceNode,
                handleToggleAllNodesList: viewStates.handleToggleAllNodesList 
             })
        )
      );
    }

    if (activeOverlayPanel === 'focus' && viewStates.focusNodeId) {
      return (
        React.createElement(OverlayPanelView, { title: "Focus View", isOpen: true, onClosePanel: () => setActiveOverlayPanel(null), onRestoreFocus: modalManager.restoreFocus },
            React.createElement(FocusViewComponent, {
                treeData: techTreeData,
                focusNodeId: viewStates.focusNodeId,
                selectedNodeInPanelId: viewStates.selectedNodeInFocusPanelId,
                onSelectNodeInPanel: (nodeId) => { viewStates.setSelectedNodeInFocusPanelId(nodeId); if(nodeId) {handleNodeSelectedForInsightsOrActions(nodeId);}},
                onChangeFocusNode: (nodeId) => { viewStates.setFocusNodeId(nodeId); viewStates.setSelectedNodeInFocusPanelId(nodeId); if(nodeId) {handleNodeSelectedForInsightsOrActions(nodeId);}},
                onExitFocusView: () => setActiveOverlayPanel(null),
                onOpenNodeEditModal: modalManager.openNodeEditModal,
                onToggleLock: nodeOperations.handleToggleNodeLock,
                onNodeImportanceChange: nodeOperations.handleNodeImportanceChange,
                isAppBusy: isAppBusy,
                onNavigateToLinkedProject: projectLinkingHook.handleNavigateToLinkedProject,
                onUnlinkProjectFromNode: projectLinkingHook.handleUnlinkProjectFromNode,
                onOpenContextMenu: modalManager.openContextMenu,
                onOpenLinkProjectModal: projectLinkingHook.handleOpenLinkProjectModal,
                onDeleteNode: nodeOperations.handleDeleteNodeAndChildren,
                projects: projectManager.projects,
                activeProjectId: projectManager.activeProjectId,
                findLinkSource: projectLinkingHook.findLinkSource,
                handleNavigateToSourceNode: projectLinkingHook.handleNavigateToSourceNode
            })
        )
      );
    }
  }
  return null; 
};

export default MainContentRouter;
