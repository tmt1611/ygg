import React, { useMemo, useCallback, useRef } from 'react';
import { getAllNodesAsMap } from '../utils.js';
import FocusNodeDisplay from './FocusNodeDisplay.js';
import FocusViewDetailPanel from './FocusViewDetailPanel.js';
import { useFocusViewLayout } from '../hooks/useFocusViewLayout.js';
import PathToRootDisplay from './PathToRootDisplay.js';

const FocusViewComponent = ({
  treeData, focusNodeId, selectedNodeInPanelId, onSelectNodeInPanel, onChangeFocusNode,
  onExitFocusView, onOpenNodeEditModal, onToggleLock, onNodeImportanceChange, isAppBusy,
  onNavigateToLinkedProject, onUnlinkProjectFromNode, onOpenContextMenu, onCloseContextMenu,
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

  const siblingsNodeData = useMemo(() => {
    if (!parentNodeData || !parentNodeData.children) return [];
    return parentNodeData.children
      .map(childRef => nodeMap.get(childRef.id))
      .filter(sibling => sibling && sibling.id !== focusNodeId);
  }, [nodeMap, parentNodeData, focusNodeId]);

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
  const { positions: allNodePositions, areaRects, width: layoutWidth, height: layoutHeight } = useFocusViewLayout(
    layoutRef,
    focusNodeData,
    parentNodeData,
    childrenNodeData,
    siblingsNodeData
  );

  const connectorLines = useMemo(() => {
    if (!allNodePositions || allNodePositions.size === 0) return [];
    const lines = [];
    const focusPos = allNodePositions.get(focusNodeId);

    const getPath = (p1, p2) => {
      const midY = (p1.y + p2.y) / 2;
      return `M${p1.x},${p1.y} C${p1.x},${midY} ${p2.x},${midY} ${p2.x},${p2.y}`;
    };

    if (parentNodeData) {
        const parentPos = allNodePositions.get(parentNodeData.id);
        if (parentPos) {
            // Connect parent to focus node
            if(focusPos) lines.push({ d: getPath(parentPos, focusPos), id: `line-parent-to-focus`, className: 'focus-view-parent-line' });

            // Connect parent to all siblings
            siblingsNodeData.forEach(siblingNode => {
                const siblingPos = allNodePositions.get(siblingNode.id);
                if (siblingPos) {
                    lines.push({ d: getPath(parentPos, siblingPos), id: `line-parent-to-sibling-${siblingNode.id}`, className: 'focus-view-parent-line' });
                }
            });
        }
    }
    if (focusPos) {
        childrenNodeData.forEach(child => {
            const childPos = allNodePositions.get(child.id);
            if (childPos) lines.push({ d: getPath(focusPos, childPos), id: `line-${focusNodeId}-to-child-${child.id}`, className: 'focus-view-child-line' });
        });
    }
    return lines;
  }, [allNodePositions, focusNodeId, parentNodeData, childrenNodeData, siblingsNodeData]);

  const handleNodeClick = useCallback((nodeId, isFocusTarget = false) => {
    onSelectNodeInPanel(nodeId);
    if (!isFocusTarget && nodeId !== focusNodeId) onChangeFocusNode(nodeId);
  }, [onSelectNodeInPanel, onChangeFocusNode, focusNodeId]);

  const handleNodeContextMenu = useCallback((event, nodeId) => {
    event.preventDefault();
    let linkSourceInfoForContext = null;
    if (treeData && nodeId === treeData.id && activeProjectId) linkSourceInfoForContext = findLinkSource(activeProjectId, projects);
    onOpenContextMenu(nodeId, { x: event.clientX, y: event.clientY }, linkSourceInfoForContext);
  },[onOpenContextMenu, treeData, activeProjectId, projects, findLinkSource]);

  const pathDisplayProps = useMemo(() => ({
    treeData,
    currentNodeId: selectedNodeInPanelId || focusNodeId,
    onSelectPathNode: (id) => onChangeFocusNode(id, treeData),
    pathContext: 'focus-view',
  }), [treeData, selectedNodeInPanelId, focusNodeId, onChangeFocusNode]);

  if (!focusNodeData) {
    return ( React.createElement("div", { className: "focus-view-container", style: {padding: '20px', textAlign: 'center'}}, " Error: Focus node (ID: ", focusNodeId, ") not found. ", React.createElement("button", {onClick: () => onExitFocusView(null), style: {marginTop: '10px'}}, "Exit Focus View") ));
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

  return (
    React.createElement("div", { className: "focus-view-page-container" },
      React.createElement("div", { className: "focus-view-header" },
        React.createElement("div", { className: "focus-view-header-main" },
            React.createElement("h3", { id: "focus-view-title" }, "Focus View: ", React.createElement("span", { style: { color: 'var(--focus-panel-text)', fontWeight: 500 }}, focusNodeData.name))
        ),
        React.createElement("div", { className: "overlay-panel-header-actions" },
            React.createElement("button", {
                onClick: () => onExitFocusView(focusNodeData.id),
                className: "base-icon-button",
                "aria-label": "Close Focus View",
                title: "Close Focus View and return to Graph View"
            }, "×")
        )
      ),
      React.createElement("div", { className: "focus-view-breadcrumb-bar" },
        React.createElement(PathToRootDisplay, { ...pathDisplayProps })
      ),
      React.createElement("div", { className: "focus-view-container" },
        React.createElement("div", { className: "focus-view-main-area" },
          React.createElement("div", { ref: layoutRef, className: "focus-view-layout", style: { minHeight: `${layoutHeight}px` }, onScroll: onCloseContextMenu },
            areaRects.parent && React.createElement("div", { className: "focus-view-area-marker parent-area", style: { top: `${areaRects.parent.y}px`, left: `${areaRects.parent.x}px`, width: `${areaRects.parent.width}px`, height: `${areaRects.parent.height}px` }},
                !parentNodeData && (
                React.createElement("div", { className: "focus-node-placeholder" },
                    React.createElement("span", { className: "focus-node-placeholder-icon" }, "🌌"),
                    "Sector Core (Root)"
                )
                )
            ),
            areaRects.siblings && React.createElement("div", { className: "focus-view-area-marker siblings-area", style: { top: `${areaRects.siblings.y}px`, left: `${areaRects.siblings.x}px`, width: `${areaRects.siblings.width}px`, height: `${areaRects.siblings.height}px` }}),
            areaRects.focus && React.createElement("div", { className: "focus-view-area-marker focus-area", style: { top: `${areaRects.focus.y}px`, left: `${areaRects.focus.x}px`, width: `${areaRects.focus.width}px`, height: `${areaRects.focus.height}px` }}),
            areaRects.children && React.createElement("div", { className: "focus-view-area-marker children-area", style: { top: `${areaRects.children.y}px`, left: `${areaRects.children.x}px`, width: `${areaRects.children.width}px`, height: `${areaRects.children.height}px` }},
                childrenNodeData.length === 0 && (
                React.createElement("div", { className: "focus-node-placeholder" },
                    React.createElement("span", { className: "focus-node-placeholder-icon" }, "🛰️"),
                    "No Subsystems Detected"
                )
                )
            ),
            React.createElement("svg", { className: "focus-view-svg-overlay", style: { width: `${layoutWidth}px`, height: `${layoutHeight}px` } },
              connectorLines.map(line => 
                React.createElement("path", { 
                  key: line.id,
                  d: line.d,
                  className: line.className
                })
              )
            ),
            parentNodeData && renderNode(parentNodeData, 'parent'),
            renderNode(focusNodeData, 'focus'),
            siblingsNodeData.map((sibling) => renderNode(sibling, 'sibling')),
            childrenNodeData.map((child) => renderNode(child, 'child'))
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
              onExitFocusView: () => onExitFocusView(focusNodeData.id),
              isProjectRoot: nodeForDetailPanel?.id === treeData?.id,
              incomingLinkInfo: nodeForDetailPanel?.id === treeData?.id ? incomingLinkInfoForFocusNode : null,
              handleNavigateToSourceNode: handleNavigateToSourceNode
          })
        )
      )
    )
  );
};

export default FocusViewComponent;