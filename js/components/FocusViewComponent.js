
import React, { useMemo, useCallback, useRef } from 'react';
import { getAllNodesAsMap } from '../utils.js';
import FocusNodeDisplay from './FocusNodeDisplay.js';
import FocusViewDetailPanel from './FocusViewDetailPanel.js';
import { useFocusViewLayout } from '../hooks/useFocusViewLayout.js';

const FocusViewComponent = ({
  treeData, focusNodeId, selectedNodeInPanelId, onSelectNodeInPanel, onChangeFocusNode,
  onExitFocusView, onOpenNodeEditModal, onToggleLock, onNodeImportanceChange, isAppBusy,
  onNavigateToLinkedProject, onUnlinkProjectFromNode, onOpenContextMenu,
  onOpenLinkProjectModal, onDeleteNode, projects, activeProjectId, findLinkSource, handleNavigateToSourceNode
}) => {
  const nodeMap = useMemo(() => getAllNodesAsMap(treeData), [treeData]);
  const focusNodeData = useMemo(() => nodeMap.get(focusNodeId) || null, [nodeMap, focusNodeId]);
  
  const parentNodeData = useMemo(() => {
    if (!focusNodeData || !focusNodeData._parentId) return null;
    return nodeMap.get(focusNodeData._parentId) || null;
  }, [nodeMap, focusNodeData]);

  const childrenNodeData = useMemo(() => {
    if (!focusNodeData || !focusNodeData.children) return [];
    return focusNodeData.children.map(child => nodeMap.get(child.id)).filter(Boolean);
  }, [nodeMap, focusNodeData]);

  const nodeForDetailPanel = useMemo(() => {
    if (!selectedNodeInPanelId) return focusNodeData; 
    return nodeMap.get(selectedNodeInPanelId) || focusNodeData;
  }, [nodeMap, selectedNodeInPanelId, focusNodeData]);

  const isFocusNodeRoot = focusNodeData?.id === treeData?.id;
  const incomingLinkInfoForFocusNode = useMemo(() => {
    if (isFocusNodeRoot && activeProjectId) {
      return findLinkSource(activeProjectId, projects);
    }
    return null;
  }, [isFocusNodeRoot, activeProjectId, projects, findLinkSource]);

  const layoutRef = useRef(null); 
  const { positions: allNodePositions, height: layoutHeight } = useFocusViewLayout(layoutRef, focusNodeData, parentNodeData, childrenNodeData);

  const connectorLines = useMemo(() => {
    if (!allNodePositions || allNodePositions.size === 0) return [];
    const lines = [];
    const focusPos = allNodePositions.get(focusNodeId);

    if (focusPos && parentNodeData) {
        const parentPos = allNodePositions.get(parentNodeData.id);
        if (parentPos) lines.push({ x1: parentPos.x, y1: parentPos.y, x2: focusPos.x, y2: focusPos.y, id: `line-parent-${parentNodeData.id}-to-${focusNodeId}` });
    }
    if (focusPos) {
        childrenNodeData.forEach(child => {
            const childPos = allNodePositions.get(child.id);
            if (childPos) lines.push({ x1: focusPos.x, y1: focusPos.y, x2: childPos.x, y2: childPos.y, id: `line-${focusNodeId}-to-child-${child.id}` });
        });
    }
    return lines;
  }, [allNodePositions, focusNodeId, parentNodeData, childrenNodeData]);

  const handleNodeClick = useCallback((nodeId, isFocusTarget = false) => {
    if (isAppBusy) return;
    onSelectNodeInPanel(nodeId);
    if (!isFocusTarget && nodeId !== focusNodeId) onChangeFocusNode(nodeId);
  }, [isAppBusy, onSelectNodeInPanel, onChangeFocusNode, focusNodeId]);

  const handleNodeContextMenu = useCallback((event, nodeId) => {
    event.preventDefault(); if (isAppBusy) return;
    let linkSourceInfoForContext = null;
    if (treeData && nodeId === treeData.id && activeProjectId) linkSourceInfoForContext = findLinkSource(activeProjectId, projects);
    onOpenContextMenu(nodeId, { x: event.clientX, y: event.clientY }, linkSourceInfoForContext);
  },[isAppBusy, onOpenContextMenu, treeData, activeProjectId, projects, findLinkSource]);

  if (!focusNodeData) {
    return ( React.createElement("div", { className: "focus-view-container", style: {padding: '20px', textAlign: 'center'}}, " Error: Focus node (ID: ", focusNodeId, ") not found. ", React.createElement("button", {onClick: onExitFocusView, style: {marginTop: '10px'}}, "Exit Focus View") ));
  }

  const renderNode = (nodeData, type) => {
    const pos = allNodePositions.get(nodeData.id);
    if (!pos) return null;
    return (
        React.createElement(FocusNodeDisplay, { 
            key: nodeData.id, node: nodeData, nodeType: type, 
            onClick: () => handleNodeClick(nodeData.id, type === 'focus'), 
            onContextMenu: (e) => handleNodeContextMenu(e, nodeData.id), 
            isAppBusy: isAppBusy,
            isRootNode: nodeData.id === treeData?.id,
            linkSourceInfo: nodeData.id === treeData?.id ? incomingLinkInfoForFocusNode : null,
            style: { position: 'absolute', left: `${pos.x}px`, top: `${pos.y}px`, transform: 'translate(-50%, -50%)' }
        })
    );
  };

  const focusPos = allNodePositions.get(focusNodeData.id);

  const parentPlaceholder = !parentNodeData && focusPos ? (
    React.createElement("div", { className: "focus-node-placeholder", style: { position: 'absolute', top: `${focusPos.y - focusPos.height / 2 - 20}px`, left: '50%', transform: 'translate(-50%, -100%)' }},
      React.createElement("span", { className: "focus-node-placeholder-icon" }, "🌌"),
      "Sector Core (Root)"
    )
  ) : null;
  
  const childrenPlaceholder = childrenNodeData.length === 0 && focusPos ? (
    React.createElement("div", { className: "focus-node-placeholder", style: { position: 'absolute', top: `${focusPos.y + focusPos.height / 2 + 20}px`, left: '50%', transform: 'translateX(-50%)' }},
      React.createElement("span", { className: "focus-node-placeholder-icon" }, "🛰️"),
      "No Subsystems Detected"
    )
  ) : null;

  return (
    React.createElement("div", { className: "focus-view-container" },
      React.createElement("div", { className: "focus-view-main-area" },
        React.createElement("div", { ref: layoutRef, className: "focus-view-layout", style: { minHeight: `${layoutHeight}px` } },
          React.createElement("svg", { className: "focus-view-svg-overlay", style: { height: `${layoutHeight}px` } },
            connectorLines.map(line => 
              React.createElement("line", { 
                key: line.id,
                x1: line.x1, y1: line.y1, x2: line.x2, y2: line.y2, 
                className: "focus-view-connector-line"
              })
            )
          ),
          parentNodeData && renderNode(parentNodeData, 'parent'),
          parentPlaceholder,
          renderNode(focusNodeData, 'focus'),
          childrenNodeData.length > 0 
            ? childrenNodeData.map((child) => renderNode(child, 'child'))
            : childrenPlaceholder
        ),
        React.createElement(FocusViewDetailPanel, {
            node: nodeForDetailPanel,
            isAppBusy: isAppBusy,
            onNodeImportanceChange: onNodeImportanceChange,
            onToggleLock: onToggleLock,
            onOpenNodeEditModal: onOpenNodeEditModal,
            onOpenLinkProjectModal: onOpenLinkProjectModal,
            onNavigateToLinkedProject: onNavigateToLinkedProject,
            onUnlinkProjectFromNode: onUnlinkProjectFromNode,
            onDeleteNode: onDeleteNode,
            onExitFocusView: onExitFocusView,
            isProjectRoot: nodeForDetailPanel?.id === treeData?.id,
            incomingLinkInfo: nodeForDetailPanel?.id === treeData?.id ? incomingLinkInfoForFocusNode : null,
            handleNavigateToSourceNode: handleNavigateToSourceNode
        })
      )
    )
  );
};

export default FocusViewComponent;
