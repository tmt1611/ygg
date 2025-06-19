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
  const { nodeEditModalConfig, closeNodeEditModal, openConfirmModal, closeConfirmModal } = modalManager;
  const { addHistoryEntry } = historyManager;
  const { handleSaveActiveProject } = projectManager;
  const { focusNodeId, setFocusNodeId, selectedNodeInFocusPanelId, setSelectedNodeInFocusPanelId } = viewStates;

  const deleteNodeAndChildren = useCallback((nodeIdToDelete) => {
    if (!techTreeData) return;
    const nodeToDelete = findNodeById(techTreeData, nodeIdToDelete);
    if (!nodeToDelete) {
        console.error(`deleteNodeAndChildren: Node with ID ${nodeIdToDelete} not found.`);
        return;
    }
    
    const newTree = removeNodeAndChildrenFromTree(techTreeData, nodeIdToDelete);
    setTechTreeData(newTree);
    addHistoryEntry('NODE_DELETED', `Node "${nodeToDelete.name}" and children deleted.`);
    handleSaveActiveProject(false);

    // Reset focus if the focused node or its ancestor was deleted
    if (focusNodeId === nodeIdToDelete || (newTree && !findNodeById(newTree, focusNodeId))) {
        setFocusNodeId(null);
    }
    if (selectedNodeInFocusPanelId === nodeIdToDelete || (newTree && !findNodeById(newTree, selectedNodeInFocusPanelId))) {
        setSelectedNodeInFocusPanelId(null);
    }
  }, [techTreeData, setTechTreeData, addHistoryEntry, handleSaveActiveProject, focusNodeId, selectedNodeInFocusPanelId, setFocusNodeId, setSelectedNodeInFocusPanelId]);

  const handleDeleteNodeWithConfirmation = useCallback((nodeId) => {
    if (!techTreeData) return;
    const nodeToDelete = findNodeById(techTreeData, nodeId);
    if (!nodeToDelete) {
        console.error(`handleDeleteNodeWithConfirmation: Node with ID ${nodeId} not found.`);
        return;
    }

    if (nodeToDelete.isLocked) {
        openConfirmModal({
            title: "Deletion Blocked",
            message: `The node "${nodeToDelete.name}" is locked. Unlock it first to delete.`,
            confirmText: "OK",
            cancelText: null,
        });
        return;
    }

    openConfirmModal({
        title: "Delete Node?",
        message: `Delete "${nodeToDelete.name}" and ALL its descendants? This action cannot be undone.`,
        confirmText: "Delete",
        confirmButtonStyle: 'danger',
        onConfirm: () => {
            deleteNodeAndChildren(nodeId);
            closeConfirmModal();
        },
        onCancel: () => {
            closeConfirmModal();
        }
    });
  }, [techTreeData, openConfirmModal, closeConfirmModal, deleteNodeAndChildren]);

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

  const handleToggleAllLock = useCallback(() => {
    if (!techTreeData) return;
    const allLocked = areAllNodesLocked(techTreeData);
    const updatedTree = allLocked ? unlockAllNodesInTree(techTreeData) : lockAllNodesInTree(techTreeData);
    const activeProject = projectManager.projects.find(p => p.id === projectManager.activeProjectId);
    const projectName = activeProject ? activeProject.name : 'current project';

    setTechTreeData(updatedTree);
    handleSaveActiveProject(false);
    addHistoryEntry(
        allLocked ? 'TREE_UNLOCK_ALL' : 'TREE_LOCK_ALL', 
        `All nodes in project "${projectName}" have been ${allLocked ? 'unlocked' : 'locked'}.`
    );
  }, [techTreeData, setTechTreeData, handleSaveActiveProject, addHistoryEntry, projectManager.projects, projectManager.activeProjectId]);


  return {
    handleToggleNodeLock,
    handleNodeImportanceChange,
    handleConfirmNodeEdit,
    handleDeleteNodeWithConfirmation,
    handleQuickAddChild,
    handleToggleAllLock,
  };
};