
import { useCallback } from 'react';
// import { TechTreeNode, NodeStatus } from '../types.js'; // Types removed
import { findNodeById, updateNodeInTree, addNodeToParent, lockAllNodesInTree, unlockAllNodesInTree, areAllNodesLocked, removeNodeAndChildrenFromTree } from '../utils.js';
// import { UseModalManagerReturn } from './useModalManager.js'; // Types removed
// import { UseHistoryManagerReturn } from './useHistoryManager.js'; // Types removed
// import { UseProjectManagementReturn } from './useProjectManagement.js'; // Types removed
// import { UseViewStatesReturn } from './useViewStates.js'; // Types removed

export const useNodeOperations = ({
  techTreeData, 
  setTechTreeData,
  modalManager,
  historyManager,
  projectManager,
  viewStates,
}) => {
  const { openNodeEditModal, nodeEditModalConfig, closeNodeEditModal, openConfirmModal } = modalManager;
  const { addHistoryEntry } = historyManager;
  const { handleSaveActiveProject } = projectManager;
  const { focusNodeId, setFocusNodeId, selectedNodeInFocusPanelId, setSelectedNodeInFocusPanelId } = viewStates;


  const handleToggleNodeLock = useCallback((nodeId) => {
    if (!techTreeData) return;
    const nodeToToggle = findNodeById(techTreeData, nodeId);
    if (nodeToToggle) {
      const newLockState = !nodeToToggle.isLocked;
      const updatedTree = updateNodeInTree(techTreeData, nodeId, { isLocked: newLockState });
      setTechTreeData(updatedTree);
      handleSaveActiveProject(false);
      addHistoryEntry('NODE_LOCK_TOGGLED', `Node "${nodeToToggle.name}" ${newLockState ? 'locked' : 'unlocked'}.`);
    }
  }, [techTreeData, setTechTreeData, handleSaveActiveProject, addHistoryEntry]);

  const handleNodeStatusChange = useCallback((nodeId, newStatus) => {
    if (!techTreeData) return;
    const nodeToChange = findNodeById(techTreeData, nodeId);
    if (nodeToChange && nodeToChange.status !== newStatus) {
      const updatedTree = updateNodeInTree(techTreeData, nodeId, { status: newStatus });
      setTechTreeData(updatedTree);
      handleSaveActiveProject(false);
      addHistoryEntry('NODE_STATUS_CHANGED', `Node "${nodeToChange.name}" status changed to ${newStatus}.`);
    }
  }, [techTreeData, setTechTreeData, handleSaveActiveProject, addHistoryEntry]);

  const handleConfirmNodeEdit = useCallback((values) => {
    if (!techTreeData || !nodeEditModalConfig?.targetNodeId) return;
    const { mode, targetNodeId, parentNodeName, currentNodeName: oldName, currentNodeDescription: oldDescription } = nodeEditModalConfig;
    const { name: newName, description: newDescription } = values;
    let updatedTree = null;
    
    if (mode === 'editName') {
      const nodeToEdit = findNodeById(techTreeData, targetNodeId);
      if (nodeToEdit) {
        const updates = {};
        let summaryParts = [];

        if (newName !== oldName) {
          updates.name = newName;
          summaryParts.push(`name changed from "${oldName}" to "${newName}"`);
        }
        if (newDescription !== undefined && newDescription !== (oldDescription || '')) {
          updates.description = newDescription;
          summaryParts.push('description updated');
        }

        if (Object.keys(updates).length > 0) {
          updatedTree = updateNodeInTree(techTreeData, targetNodeId, updates);
          addHistoryEntry('NODE_UPDATED', `Node "${oldName || newName}" ${summaryParts.join(' and ')}.`);
        }
      }
    } else if (mode === 'addChild') {
      updatedTree = addNodeToParent(techTreeData, targetNodeId, newName, newDescription); 
      addHistoryEntry('NODE_CREATED', `Node "${newName}" created as child of "${parentNodeName || 'node'}".`);
    }
    
    if (updatedTree) { setTechTreeData(updatedTree); handleSaveActiveProject(false); }
    closeNodeEditModal();
  }, [techTreeData, setTechTreeData, nodeEditModalConfig, closeNodeEditModal, handleSaveActiveProject, addHistoryEntry]);
  
  const handleToggleAllLocks = useCallback(() => {
    if (!techTreeData) return;
    const allLocked = areAllNodesLocked(techTreeData); const action = allLocked ? 'unlock' : 'lock';
    openConfirmModal({
        title: `${action.charAt(0).toUpperCase() + action.slice(1)} All Nodes?`, message: `Are you sure you want to ${action} all nodes?`,
        confirmText: action.charAt(0).toUpperCase() + action.slice(1) + " All", cancelText: "Cancel",
        onConfirm: () => {
            const updatedTree = allLocked ? unlockAllNodesInTree(techTreeData) : lockAllNodesInTree(techTreeData);
            setTechTreeData(updatedTree); handleSaveActiveProject(false);
            addHistoryEntry(allLocked ? 'TREE_UNLOCK_ALL' : 'TREE_LOCK_ALL', `All nodes ${action}ed.`);
            modalManager.closeConfirmModal();
        },
    });
  }, [techTreeData, setTechTreeData, handleSaveActiveProject, addHistoryEntry, openConfirmModal, modalManager]);

  const handleDeleteNodeAndChildren = useCallback((nodeIdToDelete) => {
    if (!techTreeData) return;
    const nodeToDelete = findNodeById(techTreeData, nodeIdToDelete);
    if (!nodeToDelete) return;
    openConfirmModal({
      title: "Delete Node?", message: `Delete "${nodeToDelete.name}" and ALL its descendants? This cannot be undone.`,
      confirmText: "Delete Node & Children", cancelText: "Cancel", confirmButtonStyle: { backgroundColor: 'var(--error-color)', borderColor: 'var(--error-color)' },
      onConfirm: () => {
        const newTree = removeNodeAndChildrenFromTree(techTreeData, nodeIdToDelete);
        setTechTreeData(newTree); addHistoryEntry('NODE_DELETED', `Node "${nodeToDelete.name}" and children deleted.`);
        handleSaveActiveProject(false);
        if (focusNodeId === nodeIdToDelete || (newTree && !findNodeById(newTree, focusNodeId))) setFocusNodeId(null);
        if (selectedNodeInFocusPanelId === nodeIdToDelete || (newTree && !findNodeById(newTree, selectedNodeInFocusPanelId))) setSelectedNodeInFocusPanelId(null);
        modalManager.closeConfirmModal();
      }
    });
  }, [techTreeData, setTechTreeData, addHistoryEntry, handleSaveActiveProject, openConfirmModal, modalManager, focusNodeId, setFocusNodeId, selectedNodeInFocusPanelId, setSelectedNodeInFocusPanelId]);

  return {
    handleToggleNodeLock,
    handleNodeStatusChange,
    handleConfirmNodeEdit,
    handleToggleAllLocks,
    handleDeleteNodeAndChildren,
  };
};
