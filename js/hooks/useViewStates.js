
import { useState, useCallback, useEffect } from 'react';
import { findNodeById, getAllExpandableNodeIds, areAllNodesExpanded } from '../utils.js'; // Removed findNodesByTerm
import { APP_STORAGE_KEYS } from '../constants.js';

export const useViewStates = ({
  techTreeData,
  setError,
  modalManager,
  addHistoryEntry,
  setYggdrasilViewMode,
  setActiveOverlayPanel,
}) => {
  const [activeWorkspaceSubTab, setActiveWorkspaceSubTab] = useState(() => (localStorage.getItem(APP_STORAGE_KEYS.ACTIVE_WORKSPACE_SUB_TAB)) || 'projects');
  
  const [showListDescriptionsGlobal, setShowListDescriptionsGlobal] = useState(true);
  const [listSearchTerm, setListSearchTerm] = useState('');
  
  const [collapsedNodeIds, setCollapsedNodeIds] = useState(() => {
    const storedCollapsed = localStorage.getItem(APP_STORAGE_KEYS.COLLAPSED_NODES);
    return storedCollapsed ? new Set(JSON.parse(storedCollapsed)) : new Set();
  });
  
  const [focusNodeId, setFocusNodeId] = useState(null);
  const [selectedNodeInFocusPanelId, setSelectedNodeInFocusPanelId] = useState(null);
  const [selectedGraphNodeId, setSelectedGraphNodeId] = useState(null);

  useEffect(() => { localStorage.setItem(APP_STORAGE_KEYS.ACTIVE_WORKSPACE_SUB_TAB, activeWorkspaceSubTab); }, [activeWorkspaceSubTab]);
  useEffect(() => { localStorage.setItem(APP_STORAGE_KEYS.COLLAPSED_NODES, JSON.stringify(Array.from(collapsedNodeIds))); }, [collapsedNodeIds]);

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
      setActiveOverlayPanel(null); 
    }
  }, [setError, techTreeData, focusNodeId, selectedGraphNodeId, modalManager, setActiveOverlayPanel]);

  const handleSwitchToFocusView = useCallback((nodeId, treeToSearch) => {
    const effectiveTree = treeToSearch || techTreeData;
    const node = findNodeById(effectiveTree, nodeId);
    if (node) {
      setFocusNodeId(nodeId); 
      setSelectedNodeInFocusPanelId(nodeId);
      setYggdrasilViewMode('treeView'); 
      setActiveOverlayPanel('focus'); 
    } else { 
        setError(`Cannot focus: Node with ID ${nodeId} not found in the current or provided tree.`); 
    }
  }, [techTreeData, setYggdrasilViewMode, setActiveOverlayPanel, setError]);

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

  return {
    activeWorkspaceSubTab, setActiveWorkspaceSubTab,
    showListDescriptionsGlobal, setShowListDescriptionsGlobal,
    listSearchTerm, setListSearchTerm, 
    collapsedNodeIds, setCollapsedNodeIds,
    focusNodeId, setFocusNodeId, selectedNodeInFocusPanelId, setSelectedNodeInFocusPanelId,
    selectedGraphNodeId, setSelectedGraphNodeId,
    handleSwitchToFocusView,
    handleToggleCollapseNode, handleToggleAllNodesList,
    commonViewResetLogic,
    setYggdrasilViewMode, 
    setActiveOverlayPanel,
  };
};
