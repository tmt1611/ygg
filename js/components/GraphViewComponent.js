
import React, { useEffect, useRef, useMemo, useCallback } from 'react';
import { linkHorizontal } from 'd3'; // Assuming d3 is globally available or managed by import map
// import { TechTreeNode, D3GraphNode, D3GraphLink, NodeStatus, NodeEditModalConfig, Project } from '../types.js'; // Types removed
import { useD3Tree } from '../hooks/useD3Tree.js';
// import { findNodeById } from '../utils.js'; // Not directly used
// import { LinkSourceInfo } from '../hooks/useProjectLinking.js'; // Types removed

const NODE_STATUS_RUNES = {
  small: '🌱',
  medium: '🌿',
  large: '🌳',
};

const GraphViewComponent = ({
  treeData,
  activeNodeId,
  onSelectNode,
  onSwitchToFocusView,
  onOpenContextMenu,
  isAppBusy,
  onToggleNodeActionsPanel, 
  projects,
  activeProjectId,
  findLinkSource,
}) => {
  const svgContainerDivRef = useRef(null); 
  const svgRef = useRef(null); 
  
  const { gRef, nodes, links, config, resetZoom, zoomIn, zoomOut } = useD3Tree(svgRef, treeData, { 
    nodeRadius: 10,
    horizontalSpacing: 220, 
    verticalSpacing: 60,
  });

  const { nodeRadius } = config; 

  const handleNodeClick = useCallback((event, d) => {
    event.stopPropagation();
    if (isAppBusy) return;
    const nodeId = d.data.id; 
    if (nodeId) {
        onSelectNode(nodeId === activeNodeId ? null : nodeId);
    } else {
        console.warn("Node ID not found on D3GraphNode data in click handler", d);
    }
  }, [isAppBusy, onSelectNode, activeNodeId]);

  const handleNodeDoubleClick = useCallback((event, d) => {
    event.stopPropagation();
    if (isAppBusy) return;
    const nodeId = d.data.id;
    if (nodeId) {
        onSwitchToFocusView(nodeId);
    } else {
        console.warn("Node ID not found on D3GraphNode data in double-click handler", d);
    }
  }, [isAppBusy, onSwitchToFocusView]);

  const handleNodeContextMenu = useCallback((event, d) => {
    event.preventDefault();
    event.stopPropagation();
    if (isAppBusy) return;
    const nodeId = d.data.id;
    if (nodeId) {
        let linkSourceInfo = null;
        if (nodeId === treeData.id && activeProjectId) { 
            linkSourceInfo = findLinkSource(activeProjectId, projects);
        }
        onOpenContextMenu(nodeId, { x: event.clientX, y: event.clientY }, linkSourceInfo);
    } else {
        console.warn("Node ID not found on D3GraphNode data in context menu handler", d);
    }
  }, [isAppBusy, onOpenContextMenu, treeData.id, activeProjectId, projects, findLinkSource]);

  useEffect(() => {
    if (!gRef.current || !nodes || !links) return;

    const g = gRef.current; 
    g.selectAll(".graph-view-link").remove(); 
    g.selectAll(".graph-view-node").remove(); 

    g.selectAll(".graph-view-link")
      .data(links, (d) => `${d.source.data.id}-${d.target.data.id}`)
      .join(
        (enter) =>
          enter
            .append("path")
            .attr("class", "graph-view-link")
            .attr("fill", "none")
            .attr("stroke", "var(--graph-link-stroke)")
            .attr("stroke-width", 1.5)
            .attr("stroke-opacity", 0.7),
        (update) => update,
        (exit) => exit.remove()
      )
      .attr("d", linkHorizontal()
        .x((d_node) => d_node.x)
        .y((d_node) => d_node.y)
      );

    const nodeGroups = g
      .selectAll(".graph-view-node")
      .data(nodes, (d_node) => d_node.data.id) 
      .join(
        (enter) => {
          const group = enter.append("g").attr("class", "graph-view-node");
          
          group.append("circle")
            .attr("r", nodeRadius)
            .attr("stroke", "var(--graph-node-stroke)")
            .attr("stroke-width", 1.5)
            .style("cursor", "pointer");

          group.append("text")
            .attr("class", "node-label")
            .attr("dy", "0.31em")
            .attr("text-anchor", "middle")
            .attr("font-size", "10px")
            .attr("fill", "var(--graph-node-text)")
            .style("pointer-events", "none")
            .style("user-select", "none");
          
          group.append("text")
            .attr("class", "node-rune-icon")
            .attr("dy", "0.35em") 
            .attr("text-anchor", "middle")
            .attr("font-size", `${nodeRadius * 1.2}px`) 
            .style("pointer-events", "none")
            .style("user-select", "none");

          group.append("text")
            .attr("class", "node-icon node-lock-icon")
            .attr("dy", `${nodeRadius * 0.4}px`) 
            .attr("dx", `${-nodeRadius * 0.9}px`)
            .attr("text-anchor", "middle")
            .attr("font-size", `${nodeRadius * 0.8}px`)
            .attr("fill", "var(--text-tertiary)")
            .style("pointer-events", "none");

          group.append("text") 
            .attr("class", "node-icon node-project-link-icon outgoing-link")
            .attr("dy", `${nodeRadius * 0.4}px`)
            .attr("dx", `${nodeRadius * 0.9}px`)
            .attr("text-anchor", "middle")
            .attr("font-size", `${nodeRadius * 0.8}px`)
            .attr("fill", "var(--primary-accent)")
            .style("pointer-events", "none");
            
          group.append("text") 
            .attr("class", "node-icon node-project-link-icon incoming-link")
            .attr("dy", `${nodeRadius * 0.4}px`) 
            .attr("dx", `${nodeRadius * 1.5}px`) 
            .attr("text-anchor", "middle")
            .attr("font-size", `${nodeRadius * 0.8}px`)
            .attr("fill", "var(--secondary-accent-dark)") 
            .style("pointer-events", "none");

          return group;
        },
        (update) => update,
        (exit) => exit.remove()
      );

    nodeGroups
      .attr("transform", (d_node) => `translate(${d_node.x},${d_node.y})`)
      .classed("selected", (d_node) => d_node.data.id === activeNodeId)
      .on("click", handleNodeClick) 
      .on("dblclick", handleNodeDoubleClick)
      .on("contextmenu", handleNodeContextMenu);

    nodeGroups.select("circle")
      .attr("fill", (d_node) => {
          if (d_node.data.status === 'small') return 'var(--status-small-bg)';
          if (d_node.data.status === 'large') return 'var(--status-large-bg)';
          return 'var(--status-medium-bg)';
      })
      .attr("stroke", (d_node) => d_node.data.id === activeNodeId ? 'var(--graph-node-selected-stroke)' : 'var(--graph-node-stroke)');

    nodeGroups.select(".node-label")
      .text((d_node) => d_node.data.name) 
      .attr("x", (d_node) => d_node.children ? - (nodeRadius + 5) : (nodeRadius + 5)) 
      .attr("text-anchor", (d_node) => d_node.children ? "end" : "start");
    
    nodeGroups.select(".node-rune-icon")
        .text((d_node) => NODE_STATUS_RUNES[d_node.data.status || 'medium'])
        .attr("fill", (d_node) => {
            if (d_node.data.status === 'small') return 'var(--status-small-text)';
            if (d_node.data.status === 'large') return 'var(--status-large-text)';
            return 'var(--status-medium-text)';
        });

    nodeGroups.select(".node-lock-icon").text((d_node) => (d_node.data.isLocked ? "🔒" : ""));
    nodeGroups.select(".outgoing-link").text((d_node) => (d_node.data.linkedProjectId ? "🔗" : ""));
    nodeGroups.select(".incoming-link").text((d_node) => {
        if (d_node.data.id === treeData.id && activeProjectId) { 
            const linkSource = findLinkSource(activeProjectId, projects);
            return linkSource ? "↩️" : ""; 
        }
        return "";
    });

  }, [nodes, links, gRef, nodeRadius, activeNodeId, handleNodeClick, handleNodeDoubleClick, handleNodeContextMenu, treeData.id, activeProjectId, projects, findLinkSource]);


  if (!treeData) {
    return (
      React.createElement("div", { className: "placeholder-center-content" },
        React.createElement("span", { className: "placeholder-icon" }, "🌳"),
        React.createElement("h2", null, "No Yggdrasil Branches Yet"),
        React.createElement("p", null, "Generate or load a project in the Workspace to visualize its structure.")
      )
    );
  }
  
  return (
    React.createElement("div", { className: "graph-view-wrapper" },
      React.createElement("div", { ref: svgContainerDivRef, className: "graph-view-svg-container" },
        React.createElement("svg", { ref: svgRef, style: { display: 'block', width: '100%', height: '100%' }})
      ),
      React.createElement("div", { className: "graph-view-controls" },
        React.createElement("button", { onClick: zoomIn, title: "Zoom In", disabled: isAppBusy }, "➕"),
        React.createElement("button", { onClick: zoomOut, title: "Zoom Out", disabled: isAppBusy }, "➖"),
        React.createElement("button", { onClick: resetZoom, title: "Reset Zoom & Pan", disabled: isAppBusy }, "🎯"),
        React.createElement("button", { onClick: onToggleNodeActionsPanel, title: "Toggle Node Actions Panel", disabled: isAppBusy || !treeData }, "🛠️")
      )
    )
  );
};

export default React.memo(GraphViewComponent);
