
import React from 'react';
import { findNodeById } from '../utils.js';

// Modal Components
import ProjectNameModal from './ProjectNameModal.js';
import AiSuggestionModal from './AiSuggestionModal.js';
import ConfirmModal from './ConfirmModal.js';
import NodeEditModal from './NodeEditModal.js';
import TechExtractionModal from './TechExtractionModal.js';
import LinkProjectModal from './LinkProjectModal.js';
import ContextMenu from './ContextMenu.js';
import ViewContextMenu from './ViewContextMenu.js';

// Hooks and Types (Hook return types removed)

const AppModals = ({
  modalManager,
  pendingAiSuggestion, 
  baseForModalDiff,
  treeOperationsAI,
  isModifying,
  apiKeyIsSet,
  nodeOperations,
  projectLinkingHook,
  techTreeData,
  handleSwitchToFocusView,
  projects,
  activeProjectId,
  yggdrasilViewMode,
  onGenerateInsights,
  onSwitchToAiOps,
}) => {
  const {
    isProjectNameModalOpen, projectModalConfig, closeProjectNameModal,
    isAiSuggestionModalOpen, closeAiSuggestionModal,
    isConfirmModalOpen, confirmModalConfig, closeConfirmModal,
    isNodeEditModalOpen, nodeEditModalConfig, closeNodeEditModal,
    isTechExtractionModalOpen, extractedTechsContent, extractionModalTitle, closeTechExtractionModal,
    isLinkProjectModalOpen, linkProjectModalConfig, closeLinkProjectModal,
    isContextMenuOpen, contextMenuPosition, contextMenuNodeId, contextMenuLinkSourceInfo, closeContextMenu,
    isViewContextMenuOpen, viewContextMenuConfig, closeViewContextMenu,
  } = modalManager;

  return (
    React.createElement(React.Fragment, null,
      isProjectNameModalOpen && projectModalConfig && (
        React.createElement(ProjectNameModal, {
          isOpen: isProjectNameModalOpen,
          mode: projectModalConfig.mode,
          currentName: projectModalConfig.currentName,
          onConfirm: projectModalConfig.onConfirm,
          onCancel: closeProjectNameModal
        })
      ),
      isAiSuggestionModalOpen && pendingAiSuggestion && (
        React.createElement(AiSuggestionModal, {
          isOpen: isAiSuggestionModalOpen,
          currentTreeForDiff: baseForModalDiff, 
          suggestion: pendingAiSuggestion,
          onConfirm: treeOperationsAI.handleConfirmAiSuggestion,
          onCancel: treeOperationsAI.handleRejectAiSuggestion,
          onRefineSuggestion: treeOperationsAI.handleApplyAiModification,
          isRefining: isModifying,
          apiKeyIsSet: apiKeyIsSet
        })
      ),
      isConfirmModalOpen && confirmModalConfig && (
        React.createElement(ConfirmModal, {
          isOpen: isConfirmModalOpen,
          title: confirmModalConfig.title,
          message: confirmModalConfig.message,
          confirmText: confirmModalConfig.confirmText,
          cancelText: confirmModalConfig.cancelText,
          onConfirm: confirmModalConfig.onConfirm,
          onCancel: confirmModalConfig.onCancel || closeConfirmModal,
          confirmButtonStyle: confirmModalConfig.confirmButtonStyle
        })
      ),
      isNodeEditModalOpen && nodeEditModalConfig && (
        React.createElement(NodeEditModal, {
          isOpen: isNodeEditModalOpen,
          mode: nodeEditModalConfig.mode,
          title: nodeEditModalConfig.title,
          label: nodeEditModalConfig.label,
          placeholder: nodeEditModalConfig.placeholder,
          initialValue: nodeEditModalConfig.initialValue,
          initialDescription: nodeEditModalConfig.initialDescription,
          onConfirm: nodeOperations.handleConfirmNodeEdit,
          onCancel: closeNodeEditModal
        })
      ),
      isTechExtractionModalOpen && (
        React.createElement(TechExtractionModal, {
          isOpen: isTechExtractionModalOpen,
          content: extractedTechsContent,
          title: extractionModalTitle,
          onClose: closeTechExtractionModal
        })
      ),
      isLinkProjectModalOpen && linkProjectModalConfig && (
        React.createElement(LinkProjectModal, {
          isOpen: isLinkProjectModalOpen,
          sourceNodeId: linkProjectModalConfig.sourceNodeId,
          sourceNodeName: linkProjectModalConfig.sourceNodeName,
          currentProjects: linkProjectModalConfig.currentProjects,
          activeProjectId: linkProjectModalConfig.activeProjectId,
          onConfirm: projectLinkingHook.handleConfirmLinkProject,
          onCancel: closeLinkProjectModal
        })
      ),
      isContextMenuOpen && contextMenuNodeId && contextMenuPosition && techTreeData && (
        React.createElement(ContextMenu, {
          isOpen: isContextMenuOpen,
          position: contextMenuPosition,
          node: findNodeById(techTreeData, contextMenuNodeId),
          techTreeData: techTreeData,
          linkSourceInfoFromView: contextMenuLinkSourceInfo,
          onClose: closeContextMenu,
          onToggleLock: nodeOperations.handleToggleNodeLock,
          onChangeImportance: nodeOperations.handleNodeImportanceChange,
          onEditName: (n) => modalManager.openNodeEditModal({mode:'editName', targetNodeId: n.id, currentNodeName: n.name, currentNodeDescription: n.description, title: `Edit: ${n.name}`, label: 'Node Name', placeholder: 'Enter new name', initialValue: n.name, initialDescription: n.description}),
          onAddChild: (n) => modalManager.openNodeEditModal({mode:'addChild', targetNodeId: n.id, parentNodeName: n.name, title: `Add Child to: ${n.name}`, label: 'New Child Name', placeholder: 'Enter name'}),
          onSetFocus: (nodeId) => handleSwitchToFocusView(nodeId),
          onDeleteNode: nodeOperations.handleDeleteNodeWithConfirmation,
          onLockAllChildren: nodeOperations.handleLockAllChildren,
          onUnlockAllChildren: nodeOperations.handleUnlockAllChildren,
          onChangeImportanceOfAllChildren: nodeOperations.handleChangeImportanceOfAllChildren,
          onDeleteAllChildren: nodeOperations.handleDeleteAllChildren,
          onPasteNode: nodeOperations.handlePasteNode,
          onGenerateInsights: onGenerateInsights,
          onSwitchToAiOps: onSwitchToAiOps,
          onLinkToProject: (nodeId) => projectLinkingHook.handleOpenLinkProjectModal(nodeId),
          onGoToLinkedProject: (projectId) => projectLinkingHook.handleNavigateToLinkedProject(projectId),
          onUnlinkProject: (nodeId) => projectLinkingHook.handleUnlinkProjectFromNode(nodeId),
          projects: projects,
          activeProjectId: activeProjectId,
          currentProjectRootId: techTreeData?.id,
          findLinkSource: projectLinkingHook.findLinkSource,
          handleNavigateToSourceNode: projectLinkingHook.handleNavigateToSourceNode
        })
      ),
      isViewContextMenuOpen && viewContextMenuConfig && (
        React.createElement(ViewContextMenu, {
          isOpen: isViewContextMenuOpen,
          config: viewContextMenuConfig,
          onClose: closeViewContextMenu,
        })
      )
    )
  );
};

export default AppModals;
