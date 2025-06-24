
import { useState, useCallback, useEffect, useMemo } from 'react';
import { findNodeById, getAllExpandableNodeIds, areAllNodesExpanded } from '../utils.js';
import { APP_STORAGE_KEYS } from '../constants.js';

export const useViewStates = ({
  techTreeData,
  setError,
  modalManager,
  addHistoryEntry,
  setYggdrasilViewMode,
  yggdrasilViewMode,
}) => {
  const [showListDescriptionsGlobal, setShowListDescriptionsGlobal] = useState(true);
  
  const [collapsedNodeIds, setCollapsedNodeIds] = useState(() => {
    try {
      const storedCollapsed = localStorage.getItem(APP_STORAGE_KEYS.COLLAPSED_NODES);
      const parsed = storedCollapsed ? JSON.parse(storedCollapsed) : [];
      return new Set(Array.isArray(parsed) ? parsed : []);
    } catch (e) {
      console.warn("Could not parse collapsed node IDs from localStorage", e);
      return new Set();
    }
  });
  
  const [focusNodeId, setFocusNodeId] = useState(null);
  const [selectedNodeInFocusPanelId, setSelectedNodeInFocusPanelId] = useState(null);
  const [selectedGraphNodeId, setSelectedGraphNodeId] = useState(null);
  const [graphSearchTerm, setGraphSearchTerm] = useState('');

  useEffect(() => { localStorage.setItem(APP_STORAGE_KEYS.COLLAPSED_NODES, JSON.stringify(Array.from(collapsedNodeIds))); }, [collapsedNodeIds]);

  useEffect(() => {
    // If the focus view is active but there's no longer a valid focus node ID,
    // switch to the graph view. This can happen if the focused node is deleted.
    if (yggdrasilViewMode === 'focus' && !focusNodeId) {
      setYggdrasilViewMode('graph');
    }
  }, [focusNodeId, yggdrasilViewMode, setYggdrasilViewMode]);

  const commonViewResetLogic = useCallback((forNewProjectContext = false) => {
    setError(null);
    const nodeExistsInTree = (nodeId) => nodeId && findNodeById(techTreeData, nodeId);

    if (forNewProjectContext || !nodeExistsInTree(focusNodeId)) { 
        setFocusNodeId(null); setSelectedNodeInFocusPanelId(null);
    }
    if (forNewProjectContext || !nodeExistsInTree(selectedGraphNodeId)) {
        setSelectedGraphNodeId(null);
    }
    modalManager.closeContextMenu();
    if (forNewProjectContext) {
      setCollapsedNodeIds(new Set());
      setYggdrasilViewMode('workspace'); 
    }
  }, [setError, techTreeData, focusNodeId, selectedGraphNodeId, modalManager, setYggdrasilViewMode]);

  const handleSwitchToFocusView = useCallback((nodeId, treeToSearch) => {
    const effectiveTree = treeToSearch || techTreeData;
    const node = findNodeById(effectiveTree, nodeId);
    if (node) {
      setFocusNodeId(nodeId); 
      setSelectedNodeInFocusPanelId(nodeId);
      setYggdrasilViewMode('focus'); 
    } else { 
        setError(`Cannot focus: Node with ID ${nodeId} not found in the current or provided tree.`); 
    }
  }, [techTreeData, setYggdrasilViewMode, setError]);

  const handleToggleCollapseNode = useCallback((nodeId, isRecursive = false) => {
    setCollapsedNodeIds(prevCollapsed => {
      const newCollapsed = new Set(prevCollapsed); const currentlyCollapsed = newCollapsed.has(nodeId);
      const toggleNodeAndDescendants = (id, shouldCollapse) => {
        if (shouldCollapse) newCollapsed.add(id); else newCollapsed.delete(id);
        if (isRecursive && techTreeData) {
            const node = findNodeById(techTreeData, id);
            if (node) getAllExpandableNodeIds(node).forEach(descId => { if (shouldCollapse) newCollapsed.add(descId); else newCollapsed.delete(descId); });
        }
      };
      toggleNodeAndDescendants(nodeId, !currentlyCollapsed); return newCollapsed;
    });
  }, [techTreeData]);

  const handleToggleAllNodesList = useCallback(() => {
    if (!techTreeData) return;
    const allExpandable = getAllExpandableNodeIds(techTreeData);
    const allCurrentlyExpanded = areAllNodesExpanded(techTreeData, collapsedNodeIds);
    if (allCurrentlyExpanded) { 
        setCollapsedNodeIds(new Set(allExpandable)); 
    } else { 
        setCollapsedNodeIds(new Set()); 
    }
  }, [techTreeData, collapsedNodeIds]); 

  return useMemo(() => ({
    showListDescriptionsGlobal, setShowListDescriptionsGlobal,
    collapsedNodeIds, setCollapsedNodeIds,
    focusNodeId, setFocusNodeId, selectedNodeInFocusPanelId, setSelectedNodeInFocusPanelId,
    selectedGraphNodeId, setSelectedGraphNodeId,
    graphSearchTerm, setGraphSearchTerm,
    handleSwitchToFocusView,
    handleToggleCollapseNode, handleToggleAllNodesList,
    commonViewResetLogic,
    setYggdrasilViewMode, 
  }), [
    showListDescriptionsGlobal, setShowListDescriptionsGlobal,
    collapsedNodeIds, setCollapsedNodeIds,
    focusNodeId, setFocusNodeId, selectedNodeInFocusPanelId, setSelectedNodeInFocusPanelId,
    selectedGraphNodeId, setSelectedGraphNodeId,
    graphSearchTerm, setGraphSearchTerm,
    handleSwitchToFocusView,
    handleToggleCollapseNode, handleToggleAllNodesList,
    commonViewResetLogic,
    setYggdrasilViewMode,
  ]);
};
