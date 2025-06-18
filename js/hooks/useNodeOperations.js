
import { useCallback } from 'react';
import { findNodeById, updateNodeInTree, addNodeToParent, lockAllNodesInTree, unlockAllNodesInTree, areAllNodesLocked, removeNodeAndChildrenFromTree } from '../utils.js';

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

  const handleNodeImportanceChange = useCallback((nodeId, newImportance) => {
    if (!techTreeData) return;
    const nodeToChange = findNodeById(techTreeData, nodeId);
    if (nodeToChange && nodeToChange.importance !== newImportance) {
      const updatedTree = updateNodeInTree(techTreeData, nodeId, { importance: newImportance });
      setTechTreeData(updatedTree);
      handleSaveActiveProject(false);
      addHistoryEntry('NODE_IMPORTANCE_CHANGED', `Node "${nodeToChange.name}" importance changed to ${newImportance}.`);
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

  const handleQuickAddChild = useCallback((parentId) => {
    if (!techTreeData) return;
    const parentNode = findNodeById(techTreeData, parentId);
    if (parentNode) {
      const updatedTree = addNodeToParent(techTreeData, parentId, "New Node", "");
      setTechTreeData(updatedTree);
      handleSaveActiveProject(false);
      addHistoryEntry('NODE_CREATED', `Quick-added "New Node" to "${parentNode.name}".`);
    }
  }, [techTreeData, setTechTreeData, handleSaveActiveProject, addHistoryEntry]);

  const handleDeleteNodeAndChildren = useCallback((nodeIdToDelete) => {
    if (!techTreeData) return;
    const nodeToDelete = findNodeById(techTreeData, nodeIdToDelete);
    if (!nodeToDelete) return;
    openConfirmModal({
      title: "Delete Node?", message: `Delete "${nodeToDelete.name}" and ALL its descendants? This cannot be undone.`,
      confirmText: "Delete Node & Children", cancelText: "Cancel", confirmButtonStyle: 'danger',
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
    handleNodeImportanceChange,
    handleConfirmNodeEdit,
    handleToggleAllLocks,
    handleDeleteNodeAndChildren,
    handleQuickAddChild,
  };
};
