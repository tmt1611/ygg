
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
// import { TechTreeNode, NodeStatus, NodeEditModalConfig, Project } from '../types.js'; // Types removed
import { getAllNodesAsMap } from '../utils.js'; 
import FocusNodeDisplay from './FocusNodeDisplay.js';
import PathToRootDisplay from './PathToRootDisplay.js';
import FocusViewDetailPanel from './FocusViewDetailPanel.js'; 
// import { LinkSourceInfo } from '../hooks/useProjectLinking.js'; // Types removed

const NODE_SIZES_PX = {
    minor: { width: 60, height: 60 },
    common: { width: 90, height: 90 },
    major: { width: 130, height: 130 },
};
const FOCUS_NODE_SCALE = 1.15; 
const VERTICAL_SPACING = 30; 
const HORIZONTAL_CHILD_GAP = 20;
const CHILD_ROW_VERTICAL_GAP = 25;

const FocusViewComponent = ({
  treeData, focusNodeId, selectedNodeInPanelId, onSelectNodeInPanel, onChangeFocusNode,
  onExitFocusView, onOpenNodeEditModal, onToggleLock, onNodeImportanceChange, isAppBusy,
  onNavigateToLinkedProject, onUnlinkProjectFromNode, onOpenContextMenu,
  onOpenLinkProjectModal, onDeleteNode, projects, activeProjectId, findLinkSource, handleNavigateToSourceNode,
}) => {
  const [allNodePositions, setAllNodePositions] = useState(new Map());

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

  const isFocusNodeRoot = focusNodeData?.id === treeData.id;
  const incomingLinkInfoForFocusNode = useMemo(() => {
    if (isFocusNodeRoot && activeProjectId) {
      return findLinkSource(activeProjectId, projects);
    }
    return null;
  }, [isFocusNodeRoot, activeProjectId, projects, findLinkSource]);

  const layoutRef = useRef(null); 
  const svgRef = useRef(null);

  useEffect(() => {
    if (!layoutRef.current || !focusNodeData) return;
    const layoutRect = layoutRef.current.getBoundingClientRect();
    const layoutWidth = layoutRect.width;
    const layoutHeight = layoutRect.height;
    const positions = new Map();

    const focusSize = NODE_SIZES_PX[focusNodeData.importance || 'common'];
    const scaledFocusWidth = focusSize.width * FOCUS_NODE_SCALE;
    const scaledFocusHeight = focusSize.height * FOCUS_NODE_SCALE;
    const focusX = layoutWidth / 2;
    const focusY = layoutHeight * 0.35; 
    positions.set(focusNodeData.id, { x: focusX, y: focusY, width: scaledFocusWidth, height: scaledFocusHeight });

    if (parentNodeData) {
        const parentSize = NODE_SIZES_PX[parentNodeData.importance || 'common'];
        const parentX = focusX;
        const parentY = focusY - (scaledFocusHeight / 2) - (parentSize.height / 2) - VERTICAL_SPACING;
        positions.set(parentNodeData.id, { x: parentX, y: parentY, width: parentSize.width, height: parentSize.height });
    }

    if (childrenNodeData.length > 0) {
        let currentY = focusY + (scaledFocusHeight / 2) + VERTICAL_SPACING;
        const maxRowWidth = layoutWidth * 0.9; 
        let currentRow = [];
        let currentRowWidth = 0;

        const placeRow = (row, yPos) => {
            const totalRowWidth = row.reduce((sum, child) => sum + NODE_SIZES_PX[child.importance || 'common'].width, 0) + (row.length - 1) * HORIZONTAL_CHILD_GAP;
            let currentX = focusX - totalRowWidth / 2;
            let maxChildHeightInRow = 0;
            row.forEach(child => {
                const childSize = NODE_SIZES_PX[child.importance || 'common'];
                maxChildHeightInRow = Math.max(maxChildHeightInRow, childSize.height);
                positions.set(child.id, { 
                    x: currentX + childSize.width / 2, y: yPos + childSize.height / 2, 
                    width: childSize.width, height: childSize.height 
                });
                currentX += childSize.width + HORIZONTAL_CHILD_GAP;
            });
            return maxChildHeightInRow;
        };
        
        for (const child of childrenNodeData) {
            const childSize = NODE_SIZES_PX[child.importance || 'common'];
            const potentialRowWidth = currentRowWidth + (currentRow.length > 0 ? HORIZONTAL_CHILD_GAP : 0) + childSize.width;
            if (currentRow.length > 0 && potentialRowWidth > maxRowWidth) {
                const rowHeight = placeRow(currentRow, currentY);
                currentY += rowHeight + CHILD_ROW_VERTICAL_GAP;
                currentRow = [child];
                currentRowWidth = childSize.width;
            } else {
                currentRow.push(child);
                currentRowWidth = potentialRowWidth;
            }
        }
        if (currentRow.length > 0) placeRow(currentRow, currentY);
    }
    setAllNodePositions(positions);
  }, [focusNodeData, parentNodeData, childrenNodeData, layoutRef]);

  useEffect(() => {
    if (!svgRef.current || allNodePositions.size === 0) {
        if(svgRef.current) svgRef.current.innerHTML = ''; 
        return;
    }
    const svg = svgRef.current;
    const linesData = [];
    const focusPos = allNodePositions.get(focusNodeId);

    if (focusPos && parentNodeData) {
        const parentPos = allNodePositions.get(parentNodeData.id);
        if (parentPos) linesData.push({ x1: parentPos.x, y1: parentPos.y, x2: focusPos.x, y2: focusPos.y, id: `line-parent-${parentNodeData.id}-to-${focusNodeId}` });
    }
    if (focusPos) {
        childrenNodeData.forEach(child => {
            const childPos = allNodePositions.get(child.id);
            if (childPos) linesData.push({ x1: focusPos.x, y1: focusPos.y, x2: childPos.x, y2: childPos.y, id: `line-${focusNodeId}-to-child-${child.id}` });
        });
    }
    svg.innerHTML = ''; 
    const markerDef = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    markerDef.innerHTML = `<marker id="warp-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="var(--focus-connector-stroke)" /></marker>`;
    svg.appendChild(markerDef);
    linesData.forEach(line => {
      const lineEl = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      lineEl.setAttribute('x1', String(line.x1)); lineEl.setAttribute('y1', String(line.y1));
      lineEl.setAttribute('x2', String(line.x2)); lineEl.setAttribute('y2', String(line.y2));
      lineEl.setAttribute('class', 'focus-view-connector-line');
      lineEl.setAttribute('marker-end', 'url(#warp-arrow)');
      svg.appendChild(lineEl);
    });
  }, [allNodePositions, focusNodeId, parentNodeData, childrenNodeData]);

  const handleNodeClick = useCallback((nodeId, isFocusTarget = false) => {
    if (isAppBusy) return;
    onSelectNodeInPanel(nodeId);
    if (!isFocusTarget && nodeId !== focusNodeId) onChangeFocusNode(nodeId);
  }, [isAppBusy, onSelectNodeInPanel, onChangeFocusNode, focusNodeId]);

  const handleNodeContextMenu = useCallback((event, nodeId) => {
    event.preventDefault(); if (isAppBusy) return;
    let linkSourceInfoForContext = null;
    if (nodeId === treeData.id && activeProjectId) linkSourceInfoForContext = findLinkSource(activeProjectId, projects);
    onOpenContextMenu(nodeId, { x: event.clientX, y: event.clientY }, linkSourceInfoForContext);
  },[isAppBusy, onOpenContextMenu, treeData.id, activeProjectId, projects, findLinkSource]);

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
            isRootNode: nodeData.id === treeData.id,
            linkSourceInfo: nodeData.id === treeData.id ? incomingLinkInfoForFocusNode : null,
            style: { position: 'absolute', left: `${pos.x}px`, top: `${pos.y}px`, transform: 'translate(-50%, -50%)', width: `${pos.width}px`, height: `${pos.height}px` }
        })
    );
  };

  return (
    React.createElement("div", { className: "focus-view-container" },
      React.createElement(PathToRootDisplay, { treeData: treeData, currentNodeId: focusNodeId, onSelectPathNode: onChangeFocusNode, pathContext: "stellar" }),
      React.createElement("div", { className: "focus-view-main-area" },
        React.createElement("div", { ref: layoutRef, className: "focus-view-layout" },
          React.createElement("svg", { ref: svgRef, className: "focus-view-svg-overlay" }),
          parentNodeData && renderNode(parentNodeData, 'parent'),
          !parentNodeData && allNodePositions.get(focusNodeData.id) && ( 
             React.createElement("div", { className: "focus-node-placeholder", style: { position: 'absolute', top: `${(allNodePositions.get(focusNodeData.id)?.y || 0) - (allNodePositions.get(focusNodeData.id)?.height || 0)/2 - VERTICAL_SPACING - 20}px`, left: '50%', transform: 'translateX(-50%)' }}, "Sector Core (Root)")
          ),
          renderNode(focusNodeData, 'focus'),
          childrenNodeData.length > 0 ? (
            childrenNodeData.map((child) => renderNode(child, 'child'))
          ) : (
             allNodePositions.get(focusNodeData.id) && React.createElement("div", { className: "focus-node-placeholder", style: { position: 'absolute', top: `${(allNodePositions.get(focusNodeData.id)?.y || 0) + (allNodePositions.get(focusNodeData.id)?.height || 0)/2 + VERTICAL_SPACING + 20}px`, left: '50%', transform: 'translateX(-50%)' }}, "No Subsystems Detected")
          )
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
            isProjectRoot: nodeForDetailPanel?.id === treeData.id,
            incomingLinkInfo: nodeForDetailPanel?.id === treeData.id ? incomingLinkInfoForFocusNode : null,
            handleNavigateToSourceNode: handleNavigateToSourceNode
        })
      )
    )
  );
};

export default FocusViewComponent;
