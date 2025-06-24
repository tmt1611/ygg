import React, { useEffect, useRef, useMemo, useCallback, useState } from 'react';
import { linkRadial, select, linkVertical, linkHorizontal } from 'd3';
import { useD3Tree } from '../hooks/useD3Tree.js';
import { NODE_IMPORTANCE_RUNES } from '../constants.js';
import PathToRootDisplay from './PathToRootDisplay.js';


const getNodeRadius = (node) => {
    if (node?.isProxy) return 16;
    switch (node?.data?.importance) {
        case 'major': return 22;
        case 'minor': return 12;
        case 'common':
        default:
            return 16;
    }
};

const GraphViewComponent = ({
  treeData,
  activeNodeId,
  onSelectNode,
  onSwitchToFocusView,
  onOpenContextMenu,
  onCloseContextMenu,
  onOpenViewContextMenu,
  onAddNodeToRoot,
  isAppBusy,
  projects,
  activeProjectId,
  findLinkSource,
  onNavigateToLinkedProject,
  handleNavigateToSourceNode,
  searchTerm
}) => {
  const [layout, setLayout] = useState('radial'); // 'radial', 'vertical', or 'horizontal'
  const [isFocusMode, setIsFocusMode] = useState(false);

  const svgContainerDivRef = useRef(null); 
  const svgRef = useRef(null); 
  const contextMenuActionsRef = useRef({});
  
  const handleBackgroundContextMenu = useCallback((position) => {
    onOpenViewContextMenu({
        position,
        actions: contextMenuActionsRef.current
    });
  }, [onOpenViewContextMenu]);

  const { g, nodes, links, config, resetZoom, zoomIn, zoomOut, centerOnNode } = useD3Tree(
    svgRef, 
    treeData, 
    {}, 
    onCloseContextMenu, 
    handleBackgroundContextMenu, 
    layout
  );

  useEffect(() => {
    contextMenuActionsRef.current = {
      onResetZoom: resetZoom,
      onAddChildToRoot: onAddNodeToRoot,
    };
  }, [resetZoom, onAddNodeToRoot]);

  const handleSetLayout = useCallback((newLayout) => {
    if (newLayout !== layout) {
      setLayout(newLayout);
      // A brief delay allows the state to update before we recenter the view on the new layout.
      setTimeout(resetZoom, 50);
    }
  }, [layout, resetZoom]);

  const handleToggleFocusMode = useCallback(() => {
    setIsFocusMode(prev => {
        const newMode = !prev;
        if (newMode && !activeNodeId) {
            // If turning on focus mode without a selected node, do nothing.
            return false;
        }
        // Center on the active node when entering focus mode
        if (newMode && activeNodeId) {
            centerOnNode(activeNodeId);
        }
        return newMode;
    });
  }, [activeNodeId, centerOnNode]);

  const projectLinksAndProxyNodes = useMemo(() => {
    if (!nodes || nodes.length === 0 || !projects) {
        return { proxyNodes: [], projectLinks: [] };
    }

    const createAcronym = (name) => {
        if (!name) return '??';
        const words = name.split(' ').filter(Boolean);
        if (words.length > 1) {
            return words.map(word => word[0]).join('').toUpperCase().substring(0, 3);
        }
        return name.substring(0, 3).toUpperCase();
    };

    const proxyNodes = [];
    const projectLinks = [];
    const PROXY_OFFSET_X = 10;
    const PROXY_DISTANCE_R = 60; // Radial distance for proxy nodes

    nodes.forEach(node => {
        if (node.data.linkedProjectId) {
            const targetProject = projects.find(p => p.id === node.data.linkedProjectId);
            if (targetProject) {
                // For radial, we just extend the radius and keep the angle
                const proxyNode = {
                    id: `proxy-target-${node.data.id}`,
                    x: node.x, // angle
                    y: node.y + PROXY_DISTANCE_R, // radius
                    isProxy: true,
                    data: {
                        name: createAcronym(targetProject.name),
                        fullName: targetProject.name,
                        id: `proxy-data-${targetProject.id}`, importance: 'common',
                        isOutgoingLink: true, realProjectId: targetProject.id, realNodeId: targetProject.treeData?.id,
                    },
                    parent: node
                };
                proxyNodes.push(proxyNode);
                projectLinks.push({ source: node, target: proxyNode, isProjectLink: true });
            }
        }
    });

    const rootNode = nodes.find(n => n.depth === 0);
    if (rootNode) {
        const linkSource = findLinkSource(activeProjectId, projects);
        if (linkSource) {
            let proxyAngle = Math.PI; // Default to bottom
            const childrenOfRoot = rootNode.children;
            if (childrenOfRoot && childrenOfRoot.length > 0) {
                // Simplified logic: calculate the average angle of children and place the proxy opposite to it.
                // This is more robust than finding the largest gap.
                let sumX = 0;
                let sumY = 0;
                childrenOfRoot.forEach(child => {
                    sumX += Math.cos(child.x);
                    sumY += Math.sin(child.x);
                });
                const avgAngle = Math.atan2(sumY, sumX);
                proxyAngle = (avgAngle + Math.PI) % (2 * Math.PI); // Opposite angle
            }

            const proxyNode = {
                id: `proxy-source-${linkSource.sourceProjectId}`,
                x: proxyAngle,
                y: PROXY_DISTANCE_R,
                isProxy: true,
                data: {
                    name: createAcronym(linkSource.sourceProjectName),
                    fullName: linkSource.sourceProjectName,
                    id: `proxy-data-${linkSource.sourceProjectId}`, importance: 'common',
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
        onSelectNode(nodeId); // Select the node on right-click
        let linkSourceInfo = null;
        if (treeData && nodeId === treeData.id && activeProjectId) { 
            linkSourceInfo = findLinkSource(activeProjectId, projects);
        }
        onOpenContextMenu(nodeId, { x: event.clientX, y: event.clientY }, linkSourceInfo);
    } else {
        console.warn("Node ID not found on D3GraphNode data in context menu handler", d);
    }
  }, [isAppBusy, onOpenContextMenu, treeData, activeProjectId, projects, findLinkSource, onSelectNode]);

  // Effect for drawing the main graph structure
  useEffect(() => {
    if (!g || !nodes || !links) return;

    const effectiveLayout = layout;

    const allNodes = [...nodes, ...projectLinksAndProxyNodes.proxyNodes];
    const allLinks = [...links, ...projectLinksAndProxyNodes.projectLinks];

    // Draw links
    g.selectAll(".graph-view-link, .graph-view-project-link")
      .data(allLinks, (d) => `${d.source.id}-${d.target.id}`)
      .join(
        (enter) =>
          enter.append("path")
            .attr("class", d => d.isProjectLink ? "graph-view-project-link" : "graph-view-link")
            .attr("fill", "none")
            .attr("stroke-width", d => d.isProjectLink ? 2 : 1.5)
            .attr("stroke-opacity", 0.7)
            .attr("stroke-dasharray", d => d.isProjectLink ? "4,4" : "none"),
        (update) => update,
        (exit) => exit.remove()
      )
      .attr("marker-end", d => {
        // Only outgoing project links to a proxy node get an end marker.
        if (d.isProjectLink && d.target.isProxy) return 'url(#arrowhead-project)';
        return null;
      })
      .attr("marker-mid", d => {
        // Regular links (including incoming project links) get a mid marker.
        if (d.isProjectLink) return null;
        return `url(#arrowhead)`;
      })
      .attr("d", d => {
        // Outgoing project links are simple curves to the proxy node.
        if (d.isProjectLink && d.target.isProxy) {
            if (effectiveLayout === 'radial') return linkRadial().angle(n => n.x).radius(n => n.y)(d);
            if (effectiveLayout === 'vertical') return linkVertical().x(n => n.x).y(n => n.y)(d);
            return linkHorizontal().x(n => n.y).y(n => n.x)(d);
        }

        // All other links (regular and incoming project links) are straight lines
        // with a midpoint for the arrow, shortened to not overlap nodes.
        const sourceRadius = getNodeRadius(d.source);
        const targetRadius = getNodeRadius(d.target);

        let sx_c, sy_c, tx_c, ty_c;

        if (effectiveLayout === 'radial') {
            const angle_s = d.source.x - Math.PI / 2;
            sx_c = d.source.y * Math.cos(angle_s);
            sy_c = d.source.y * Math.sin(angle_s);

            const angle_t = d.target.x - Math.PI / 2;
            tx_c = d.target.y * Math.cos(angle_t);
            ty_c = d.target.y * Math.sin(angle_t);
        } else if (effectiveLayout === 'vertical') {
            sx_c = d.source.x; sy_c = d.source.y;
            tx_c = d.target.x; ty_c = d.target.y;
        } else { // horizontal
            sx_c = d.source.y; sy_c = d.source.x;
            tx_c = d.target.y; ty_c = d.target.x;
        }
        
        const dx = tx_c - sx_c;
        const dy = ty_c - sy_c;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist <= sourceRadius + targetRadius) return null;

        const sx = sx_c + (dx / dist) * sourceRadius;
        const sy = sy_c + (dy / dist) * sourceRadius;
        const tx = tx_c - (dx / dist) * targetRadius;
        const ty = ty_c - (dy / dist) * targetRadius;

        const mx = (sx + tx) / 2;
        const my = (sy + ty) / 2;

        return `M${sx},${sy}L${mx},${my}L${tx},${ty}`;
      });

    // Draw node groups
    const nodeGroups = g
      .selectAll(".graph-view-node")
      .data(allNodes, (d) => d.id)
      .join(
        (enter) => {
          const group = enter.append("g")
            .attr("class", d => d.isProxy ? "graph-view-node proxy" : "graph-view-node");
          
          group.append("title");

          group.each(function(d) {
            const el = select(this);
            if (d.isProxy) {
              el.append("rect").attr("width", 32).attr("height", 32)
                .attr("x", -16).attr("y", -16)
                .attr("rx", 3).attr("ry", 3).style("cursor", "pointer");
              
              // Proxy nodes get a simple text label, not a foreignObject
              el.append("text").attr("class", "node-label")
                .style("pointer-events", "none").style("user-select", "none")
                .attr("text-anchor", "middle").attr("dominant-baseline", "middle");

            } else {
              el.append("circle").attr("r", getNodeRadius).attr("stroke-width", 1.5).style("cursor", "pointer");
              
              // Regular nodes get the foreignObject for advanced wrapping
              el.append("foreignObject")
                .attr("class", "node-label-foreign-object")
                .style("pointer-events", "none")
                .append("xhtml:div")
                .attr("class", "node-label-wrapper");
            }
          });
          
          group.append("text").attr("class", "node-rune-icon").attr("dy", "0.35em")
            .attr("font-size", d => `${getNodeRadius(d) * 1.1}px`).style("pointer-events", "none").style("user-select", "none");

          group.append("text").attr("class", "node-icon node-lock-icon").attr("dy", d => `${getNodeRadius(d) * 0.4}px`)
            .attr("dx", d => `${-getNodeRadius(d) * 0.9}px`).attr("font-size", d => `${getNodeRadius(d) * 0.8}px`)
            .attr("fill", "var(--text-tertiary)").style("pointer-events", "none");

          return group;
        }
      );

    // Apply static attributes and event handlers
    nodeGroups
      .attr("class", d => {
        const classes = ['graph-view-node'];
        if (d.isProxy) classes.push('proxy');
        if (d.data.importance) classes.push(`importance-${d.data.importance}`);
        if (d.data._changeStatus && d.data._changeStatus !== 'unchanged') {
          classes.push(`status-${d.data._changeStatus}`);
        }
        return classes.join(' ');
      })
      .attr("transform", d => {
        if (effectiveLayout === 'radial') {
            // Use cartesian coordinates for radial layout to keep text horizontal
            const angle = d.x - Math.PI / 2; // Adjust angle to start from top
            const x = d.y * Math.cos(angle);
            const y = d.y * Math.sin(angle);
            return `translate(${x}, ${y})`;
        } else if (effectiveLayout === 'vertical') {
            return `translate(${d.x}, ${d.y})`;
        } else { // horizontal
            return `translate(${d.y}, ${d.x})`;
        }
      })
      .on("click", handleNodeClick)
      .on("dblclick", handleNodeDoubleClick)
      .on("contextmenu", handleNodeContextMenu);

    nodeGroups.select("title").text(d => d.isProxy ? `Project: ${d.data.fullName}\n(Click to navigate)` : `${d.data.name}\n(Double-click for Focus View)`);

    nodeGroups.select("circle").attr("fill", d => {
        if (d.data.importance === 'minor') return 'var(--importance-minor-bg)';
        if (d.data.importance === 'major') return 'var(--importance-major-bg)';
        return 'var(--importance-common-bg)';
    });

    // Handle proxy node labels (simple text)
    nodeGroups.select("text.node-label")
      .text(d => d.isProxy ? d.data.name : "");

    // Position the foreignObject for regular node labels
    nodeGroups.select(".node-label-foreign-object")
      .attr("width", 120) // A fixed, reasonable width for all nodes
      .attr("height", 50) // Fixed height, CSS will handle overflow
      .attr("transform", d => {
        if (d.isProxy) return null;
        const radius = getNodeRadius(d);
        const spacing = 5; // A little less spacing is needed
        const labelWidth = 120;
        
        // For non-root nodes, offset diagonally to avoid covering the link to children.
        // For the root node, position it directly below.
        if (d.depth === 0) {
            return `translate(-${labelWidth / 2}, ${radius + spacing})`;
        }
        
        // Diagonal offset to bottom-right
        const xOffset = radius * 0.707; // approx radius / sqrt(2)
        const yOffset = radius * 0.707;
        
        return `translate(${xOffset}, ${yOffset})`;
      });

    // Set the text content for the div inside the foreignObject
    nodeGroups.select(".node-label-wrapper")
      .html(d => d.isProxy ? "" : (d.data.name || ""));

    nodeGroups.select(".node-rune-icon")
      .attr("transform", null) // No rotation needed for any layout
      .text(d => {
        if (d.isProxy) return '';
        return NODE_IMPORTANCE_RUNES[d.data.importance] || '•';
      });

    nodeGroups.select(".node-lock-icon")
      .attr("transform", null) // No rotation needed for any layout
      .text(d => (d.data.isLocked && !d.isProxy ? "🔒" : ""));

  }, [g, nodes, links, handleNodeClick, handleNodeDoubleClick, handleNodeContextMenu, projectLinksAndProxyNodes, layout]);

  // Effect for dynamic styling (selection, search highlight, focus mode)
  useEffect(() => {
    if (!g) return;

    const nodeSelection = g.selectAll(".graph-view-node");
    const linkSelection = g.selectAll(".graph-view-link, .graph-view-project-link");

    // Reset classes
    nodeSelection.classed("highlighted", false).classed("dimmed", false);
    linkSelection.classed("dimmed", false);

    if (isFocusMode && activeNodeId) {
        const focusNode = nodes.find(n => n.data.id === activeNodeId);
        if (focusNode) {
            const inFocusIds = new Set([activeNodeId]);
            if (focusNode.parent) {
                inFocusIds.add(focusNode.parent.data.id);
                // Add siblings
                focusNode.parent.children.forEach(sibling => inFocusIds.add(sibling.data.id));
            }
            if (focusNode.children) {
                focusNode.children.forEach(child => inFocusIds.add(child.data.id));
            }

            nodeSelection.classed("dimmed", d => !d.isProxy && !inFocusIds.has(d.data.id));
            linkSelection.classed("dimmed", d => {
                const sourceInFocus = d.source.isProxy || inFocusIds.has(d.source.data.id);
                const targetInFocus = d.target.isProxy || inFocusIds.has(d.target.data.id);
                return !(sourceInFocus && targetInFocus);
            });
        }
    } else if (searchTerm?.trim()) {
        const lowerCaseSearchTerm = searchTerm.toLowerCase();
        const matchingNodeIds = new Set();
        
        nodes.forEach(node => {
            if (!node.isProxy && (node.data.name.toLowerCase().includes(lowerCaseSearchTerm) || 
                (node.data.description && node.data.description.toLowerCase().includes(lowerCaseSearchTerm)))) {
                matchingNodeIds.add(node.data.id);
                // Also add ancestors to keep the path visible
                let current = node.parent;
                while (current) {
                    matchingNodeIds.add(current.data.id);
                    current = current.parent;
                }
            }
        });

        nodeSelection
            .classed("highlighted", d => !d.isProxy && matchingNodeIds.has(d.data.id))
            .classed("dimmed", d => !d.isProxy && !matchingNodeIds.has(d.data.id) && d.data.id !== activeNodeId);

        linkSelection
            .classed("dimmed", d => {
                const sourceIsMatch = d.source.isProxy || matchingNodeIds.has(d.source.data.id);
                const targetIsMatch = d.target.isProxy || matchingNodeIds.has(d.target.data.id);
                return !(sourceIsMatch && targetIsMatch);
            });
    }
    
    nodeSelection
      .classed("selected", d => !d.isProxy && d.data.id === activeNodeId);

    nodeSelection.select("circle")
      .attr("stroke", d => {
          return d.isProxy ? null : (d.data.id === activeNodeId ? 'var(--graph-node-selected-stroke)' : 'var(--graph-node-stroke)');
      });
    
    // Center view on the active node when it changes
    if (activeNodeId) {
        centerOnNode(activeNodeId);
    }

  }, [g, activeNodeId, nodes, layout, centerOnNode, searchTerm, isFocusMode]); // Using 'nodes' and 'layout' to re-run on data change.


  if (!treeData) {
    return (
      React.createElement("div", { className: "placeholder-center-content" },
        React.createElement("span", { className: "placeholder-icon" }, "🌳"),
        React.createElement("h2", null, "No Yggdrasil Branches Yet"),
        React.createElement("p", null, "Generate or load a project in the Workspace to visualize its structure.")
      )
    );
  }
  
  const layoutOptions = [
    { id: 'radial', label: '🌳', title: 'Radial Layout' },
    { id: 'vertical', label: '↕️', title: 'Vertical Layout' },
    { id: 'horizontal', label: '↔️', title: 'Horizontal Layout' },
  ];

  return (
    React.createElement("div", { className: "graph-view-wrapper" },
      React.createElement("div", { ref: svgContainerDivRef, className: "graph-view-svg-container" },
        isFocusMode && activeNodeId && (
            React.createElement("div", { style: { position: 'absolute', top: '8px', left: '8px', zIndex: 10, maxWidth: 'calc(100% - 150px)' }},
                React.createElement(PathToRootDisplay, {
                    treeData: treeData,
                    currentNodeId: activeNodeId,
                    onSelectPathNode: onSelectNode, // Clicking path now just selects, doesn't force re-layout
                    pathContext: "graph-focus"
                })
            )
        ),
        React.createElement("svg", { ref: svgRef, style: { display: 'block', width: '100%', height: '100%' }})
      ),
      React.createElement("div", { className: "graph-view-controls" },
        React.createElement("div", { className: "segmented-control graph-layout-control", role: "radiogroup", "aria-label": "Graph Layout" },
            layoutOptions.map(opt => (
                React.createElement("button", {
                    key: opt.id,
                    role: "radio",
                    "aria-checked": layout === opt.id,
                    className: layout === opt.id ? 'active' : '',
                    onClick: () => handleSetLayout(opt.id),
                    title: opt.title,
                    disabled: isAppBusy || isFocusMode
                }, opt.label)
            ))
        ),
        React.createElement("div", { className: "graph-zoom-controls" },
            React.createElement("button", { 
                onClick: handleToggleFocusMode, 
                title: isFocusMode ? "Exit Graph Focus Mode" : "Enter Graph Focus Mode (select a node first)", 
                disabled: isAppBusy || (!isFocusMode && !activeNodeId),
                className: isFocusMode ? 'active' : ''
            }, '🔬'),
            React.createElement("button", { onClick: zoomIn, title: "Zoom In", disabled: isAppBusy }, "➕"),
            React.createElement("button", { onClick: zoomOut, title: "Zoom Out", disabled: isAppBusy }, "➖"),
            React.createElement("button", { onClick: resetZoom, title: "Reset Zoom & Pan", disabled: isAppBusy }, "🎯")
        )
      )
    )
  );
};

export default React.memo(GraphViewComponent);