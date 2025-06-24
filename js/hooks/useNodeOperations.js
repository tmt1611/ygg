import { useCallback } from 'react';
import { findNodeById, updateNodeInTree, addNodeToParent, lockAllNodesInTree, unlockAllNodesInTree, areAllNodesLocked, removeNodeAndChildrenFromTree, updateAllChildren, deleteAllChildren, addPastedNodeToParent, isValidTechTreeNodeShape } from '../utils.js';

export const useNodeOperations = ({
  techTreeData, 
  setTechTreeData,
  modalManager,
  historyManager,
  projectManager,
  viewStates,
  setError,
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
        openConfirmModal({
            title: "Deletion Error",
            message: `Node could not be found for deletion. It may have already been removed.`,
            confirmText: "OK",
            cancelText: null,
        });
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

  const handleAddNodeToRoot = useCallback(() => {
    if (!techTreeData) return;
    modalManager.openNodeEditModal({
      mode: 'addChild',
      targetNodeId: techTreeData.id, // Target the root node
      parentNodeName: techTreeData.name,
      title: `Add Node to Root: ${techTreeData.name}`,
      label: "New Node Name",
      placeholder: "Enter name for new top-level node",
    });
  }, [techTreeData, modalManager]);

  const handleLockAllChildren = useCallback((parentId) => {
    if (!techTreeData) return;
    const parentNode = findNodeById(techTreeData, parentId);
    if (!parentNode || !parentNode.children || parentNode.children.length === 0) return;
    const updatedTree = updateAllChildren(techTreeData, parentId, { isLocked: true });
    setTechTreeData(updatedTree);
    handleSaveActiveProject(false);
    addHistoryEntry('NODE_UPDATED', `All children of "${parentNode.name}" have been locked.`);
  }, [techTreeData, setTechTreeData, handleSaveActiveProject, addHistoryEntry]);

  const handleUnlockAllChildren = useCallback((parentId) => {
    if (!techTreeData) return;
    const parentNode = findNodeById(techTreeData, parentId);
    if (!parentNode || !parentNode.children || parentNode.children.length === 0) return;
    const updatedTree = updateAllChildren(techTreeData, parentId, { isLocked: false });
    setTechTreeData(updatedTree);
    handleSaveActiveProject(false);
    addHistoryEntry('NODE_UPDATED', `All children of "${parentNode.name}" have been unlocked.`);
  }, [techTreeData, setTechTreeData, handleSaveActiveProject, addHistoryEntry]);

  const handleChangeImportanceOfAllChildren = useCallback((parentId, importance) => {
    if (!techTreeData) return;
    const parentNode = findNodeById(techTreeData, parentId);
    if (!parentNode || !parentNode.children || parentNode.children.length === 0) return;
    const updatedTree = updateAllChildren(techTreeData, parentId, { importance });
    setTechTreeData(updatedTree);
    handleSaveActiveProject(false);
    addHistoryEntry('NODE_UPDATED', `Importance of all children of "${parentNode.name}" set to ${importance}.`);
  }, [techTreeData, setTechTreeData, handleSaveActiveProject, addHistoryEntry]);

  const handleDeleteAllChildren = useCallback((parentId) => {
    if (!techTreeData) return;
    const parentNode = findNodeById(techTreeData, parentId);
    if (!parentNode || !parentNode.children || parentNode.children.length === 0) return;
    
    openConfirmModal({
        title: "Delete All Children?",
        message: `Delete all direct children of "${parentNode.name}"? This action cannot be undone.`,
        confirmText: "Delete All",
        confirmButtonStyle: 'danger',
        onConfirm: () => {
            const updatedTree = deleteAllChildren(techTreeData, parentId);
            setTechTreeData(updatedTree);
            handleSaveActiveProject(false);
            addHistoryEntry('NODE_DELETED', `All children of "${parentNode.name}" deleted.`);
            closeConfirmModal();
        },
        onCancel: closeConfirmModal,
    });
  }, [techTreeData, setTechTreeData, handleSaveActiveProject, addHistoryEntry, openConfirmModal, closeConfirmModal]);

  const handlePasteNode = useCallback(async (targetNodeId) => {
    if (!techTreeData) {
      setError("Cannot paste: No active tree.");
      return;
    }
    
    try {
      const clipboardText = await navigator.clipboard.readText();
      const parsedNode = JSON.parse(clipboardText);

      if (!isValidTechTreeNodeShape(parsedNode)) {
        throw new Error("Clipboard content is not a valid node structure.");
      }
      
      const parentNode = findNodeById(techTreeData, targetNodeId);
      if (!parentNode) {
        throw new Error("Target node for paste operation not found.");
      }

      const updatedTree = addPastedNodeToParent(techTreeData, targetNodeId, parsedNode);
      setTechTreeData(updatedTree);
      handleSaveActiveProject(false);
      addHistoryEntry('NODE_CREATED', `Pasted node "${parsedNode.name}" as child of "${parentNode.name}".`);

    } catch (e) {
      let errorMessage = "Failed to paste node from clipboard.";
      if (e instanceof SyntaxError) {
        errorMessage = "Clipboard does not contain valid JSON.";
      } else if (e.message) {
        errorMessage = e.message;
      }
      console.error("Paste Error:", e);
      setError(errorMessage);
    }
  }, [techTreeData, setTechTreeData, handleSaveActiveProject, addHistoryEntry, setError]);

  const handleNodeNameChange = useCallback((nodeId, newName) => {
    if (!techTreeData) return;
    const nodeToUpdate = findNodeById(techTreeData, nodeId);
    if (nodeToUpdate && nodeToUpdate.name !== newName && newName.trim() !== "") {
      const oldName = nodeToUpdate.name;
      const updatedTree = updateNodeInTree(techTreeData, nodeId, { name: newName });
      setTechTreeData(updatedTree);
      handleSaveActiveProject(false);
      addHistoryEntry('NODE_UPDATED', `Node renamed from "${oldName}" to "${newName}".`);
    }
  }, [techTreeData, setTechTreeData, handleSaveActiveProject, addHistoryEntry]);


  return {
    handleToggleNodeLock,
    handleNodeImportanceChange,
    handleConfirmNodeEdit,
    handleDeleteNodeWithConfirmation,
    handleQuickAddChild,
    handleToggleAllLock,
    handleAddNodeToRoot,
    handleLockAllChildren,
    handleUnlockAllChildren,
    handleChangeImportanceOfAllChildren,
    handleDeleteAllChildren,
    handlePasteNode,
    handleNodeNameChange,
  };
};