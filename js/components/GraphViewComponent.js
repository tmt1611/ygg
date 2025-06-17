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
  onNavigateToLinkedProject,
  handleNavigateToSourceNode,
}) => {
  const svgContainerDivRef = useRef(null); 
  const svgRef = useRef(null); 
  
  const { g, nodes, links, config, resetZoom, zoomIn, zoomOut } = useD3Tree(svgRef, treeData, { 
    nodeRadius: 10,
    horizontalSpacing: 220, 
    verticalSpacing: 90,
  });

  const { nodeRadius } = config; 

  const projectLinksAndProxyNodes = useMemo(() => {
    if (!nodes || nodes.length === 0 || !projects) {
        return { proxyNodes: [], projectLinks: [] };
    }

    const createAcronym = (name) => (name || '').split(' ').filter(Boolean).map(word => word[0]).join('').toUpperCase();

    const proxyNodes = [];
    const projectLinks = [];
    const PROXY_DISTANCE_X = 80; // Shortened edge
    const PROXY_OFFSET_Y = 20;
    let proxyIndex = 0;

    nodes.forEach(node => {
        if (node.data.linkedProjectId) {
            const targetProject = projects.find(p => p.id === node.data.linkedProjectId);
            if (targetProject) {
                const yOffset = (proxyIndex % 2 === 0) ? PROXY_OFFSET_Y : -PROXY_OFFSET_Y;
                const proxyNode = {
                    id: `proxy-target-${node.data.id}`, x: node.x + PROXY_DISTANCE_X, y: node.y + yOffset,
                    isProxy: true,
                    data: {
                        name: createAcronym(targetProject.name),
                        fullName: targetProject.name,
                        id: `proxy-data-${targetProject.id}`, status: 'medium',
                        isOutgoingLink: true, realProjectId: targetProject.id, realNodeId: targetProject.treeData.id,
                    },
                    parent: node 
                };
                proxyNodes.push(proxyNode);
                projectLinks.push({ source: node, target: proxyNode, isProjectLink: true });
                proxyIndex++;
            }
        }
    });

    const rootNode = nodes.find(n => n.depth === 0);
    if (rootNode) {
        const linkSource = findLinkSource(activeProjectId, projects);
        if (linkSource) {
            const proxyNode = {
                id: `proxy-source-${linkSource.sourceProjectId}`, x: rootNode.x - PROXY_DISTANCE_X, y: rootNode.y,
                isProxy: true,
                data: {
                    name: createAcronym(linkSource.sourceProjectName),
                    fullName: linkSource.sourceProjectName,
                    id: `proxy-data-${linkSource.sourceProjectId}`, status: 'medium',
                    isIncomingLink: true, realProjectId: linkSource.sourceProjectId, realNodeId: linkSource.sourceNodeId,
                },
                parent: rootNode
            };
            proxyNodes.push(proxyNode);
            projectLinks.push({ source: proxyNode, target: rootNode, isProjectLink: true });
        }
    }

    return { proxyNodes, projectLinks };
  }, [nodes, projects, activeProjectId, findLinkSource]);


  const handleNodeClick = useCallback((event, d) => {
    event.stopPropagation();
    if (isAppBusy) return;
    if (d.isProxy) {
        if (d.data.isOutgoingLink && onNavigateToLinkedProject) {
            onNavigateToLinkedProject(d.data.realProjectId);
        } else if (d.data.isIncomingLink && handleNavigateToSourceNode) {
            handleNavigateToSourceNode(d.data.realProjectId, d.data.realNodeId);
        }
        return;
    }
    const nodeId = d.data.id; 
    if (nodeId) {
        onSelectNode(nodeId === activeNodeId ? null : nodeId);
    } else {
        console.warn("Node ID not found on D3GraphNode data in click handler", d);
    }
  }, [isAppBusy, onSelectNode, activeNodeId, onNavigateToLinkedProject, handleNavigateToSourceNode]);

  const handleNodeDoubleClick = useCallback((event, d) => {
    event.stopPropagation();
    if (isAppBusy || d.isProxy) return;
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
    if (isAppBusy || d.isProxy) return;
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
    if (!g || !nodes || !links) return;

    const allNodes = [...nodes, ...projectLinksAndProxyNodes.proxyNodes];
    const allLinks = [...links, ...projectLinksAndProxyNodes.projectLinks];

    g.selectAll(".graph-view-link, .graph-view-project-link").remove(); 
    g.selectAll(".graph-view-node").remove(); 

    g.selectAll(".graph-view-all-links")
      .data(allLinks, (d) => `${d.source.id}-${d.target.id}`)
      .join(
        (enter) =>
          enter
            .append("path")
            .attr("class", d => d.isProjectLink ? "graph-view-project-link" : "graph-view-link")
            .attr("fill", "none")
            .attr("stroke", d => d.isProjectLink ? null : "var(--graph-link-stroke)")
            .attr("stroke-width", 1.5)
            .attr("stroke-opacity", d => d.isProjectLink ? 0.6 : 0.7)
            .attr("stroke-dasharray", d => d.isProjectLink ? "5,5" : "none"),
        (update) => update,
        (exit) => exit.remove()
      )
      .attr("d", linkHorizontal()
        .x((d_node) => d_node.x)
        .y((d_node) => d_node.y)
      );

    const nodeGroups = g
      .selectAll(".graph-view-node")
      .data(allNodes, (d_node) => d_node.id) 
      .join(
        (enter) => {
          const group = enter.append("g")
            .attr("class", d => d.isProxy ? "graph-view-node proxy" : "graph-view-node");
          
          group.append("title"); // For tooltips

          group.append("circle")
            .attr("r", nodeRadius)
            .attr("stroke-width", 1.5)
            .style("cursor", "pointer");

          group.append("text")
            .attr("class", "node-label")
            .attr("dy", "0.31em")
            .attr("text-anchor", "middle")
            .attr("font-size", "10px")
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
          return group;
        },
        (update) => update,
        (exit) => exit.remove()
      );

    nodeGroups
      .attr("transform", (d_node) => `translate(${d_node.x},${d_node.y})`)
      .classed("selected", (d_node) => !d_node.isProxy && d_node.data.id === activeNodeId)
      .on("click", handleNodeClick) 
      .on("dblclick", handleNodeDoubleClick)
      .on("contextmenu", handleNodeContextMenu);

    nodeGroups.select("title").text(d => d.isProxy ? `Project: ${d.data.fullName}\n(Click to navigate)` : d.data.name);

    nodeGroups.select("circle")
      .attr("fill", (d_node) => {
          if (d_node.isProxy) return null;
          if (d_node.data.status === 'small') return 'var(--status-small-bg)';
          if (d_node.data.status === 'large') return 'var(--status-large-bg)';
          return 'var(--status-medium-bg)';
      })
      .attr("stroke", (d_node) => {
          if (d_node.isProxy) return null;
          return d_node.data.id === activeNodeId ? 'var(--graph-node-selected-stroke)' : 'var(--graph-node-stroke)';
      });

    nodeGroups.select(".node-label")
      .text((d_node) => d_node.data.name) 
      .attr("fill", d => d.isProxy ? null : "var(--graph-node-text)")
      .attr("x", (d_node) => d_node.children && !d_node.isProxy ? - (nodeRadius + 5) : (nodeRadius + 5)) 
      .attr("text-anchor", (d_node) => d_node.children && !d_node.isProxy ? "end" : "start");
    
    nodeGroups.select(".node-rune-icon")
        .text((d_node) => d_node.isProxy ? (d_node.data.isIncomingLink ? '↩️' : '🔗') : NODE_STATUS_RUNES[d_node.data.status || 'medium'])
        .attr("fill", (d_node) => {
            if (d_node.isProxy) return null;
            if (d_node.data.status === 'small') return 'var(--status-small-text)';
            if (d_node.data.status === 'large') return 'var(--status-large-text)';
            return 'var(--status-medium-text)';
        });

    nodeGroups.select(".node-lock-icon").text((d_node) => (d_node.data.isLocked && !d_node.isProxy ? "🔒" : ""));

  }, [g, nodes, links, nodeRadius, activeNodeId, handleNodeClick, handleNodeDoubleClick, handleNodeContextMenu, treeData.id, activeProjectId, projects, findLinkSource, projectLinksAndProxyNodes]);


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