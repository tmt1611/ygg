import React, { useEffect, useRef, useMemo, useCallback, useState } from 'react';
import { linkRadial, select, linkVertical, linkHorizontal } from 'd3';
import { useD3Tree } from '../hooks/useD3Tree.js';
import { NODE_IMPORTANCE_RUNES } from '../constants.js';
import PathToRootDisplay from './PathToRootDisplay.js';
import GraphMiniMap from './GraphMiniMap.js';
import { useGraphTooltip } from '../hooks/useGraphTooltip.js';
import GraphNodeTooltip from './GraphNodeTooltip.js';


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

const getRuneIconSize = (node) => {
    const radius = getNodeRadius(node);
    const baseMultiplier = 1.1;
    // Use a larger multiplier for the 'major' icon to make it stand out,
    // while keeping other icons proportionally sized to their nodes.
    switch (node?.data?.importance) {
        case 'major': return radius * 1.3;
        default: return radius * baseMultiplier;
    }
};

const createAcronym = (name) => {
    if (!name) return '??';
    const words = name.split(' ').filter(Boolean);
    if (words.length > 1) {
        return words.map(word => word[0]).join('').toUpperCase().substring(0, 3);
    }
    return name.substring(0, 3).toUpperCase();
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
  const { tooltip, showTooltip, hideTooltip } = useGraphTooltip();

  const svgWrapperRef = useRef(null);
  const svgRef = useRef(null);
  const contextMenuActionsRef = useRef({});
  const [mainViewportSize, setMainViewportSize] = useState({ width: 0, height: 0 });
  
  const handleBackgroundContextMenu = useCallback((position) => {
    onOpenViewContextMenu({
        position,
        actions: contextMenuActionsRef.current
    });
  }, [onOpenViewContextMenu]);

  const handleBackgroundClick = useCallback(() => {
      onCloseContextMenu();
      hideTooltip();
  }, [onCloseContextMenu, hideTooltip]);

  const { g, nodes, links, config, resetZoom, zoomToFit, zoomIn, zoomOut, centerOnNode, currentTransform, translateTo } = useD3Tree(
    svgRef, 
    treeData, 
    {}, 
    handleBackgroundClick, 
    handleBackgroundContextMenu, 
    layout
  );

  const getCoordsForLayout = useCallback((node, layout) => {
    if (!node) return { x: 0, y: 0 };
    if (layout === 'radial') {
      const angle = node.x - Math.PI / 2;
      return { x: node.y * Math.cos(angle), y: node.y * Math.sin(angle) };
    }
    if (layout === 'vertical') return { x: node.x, y: node.y };
    // horizontal
    return { x: node.y, y: node.x };
  }, []);

  // Keyboard navigation for the graph
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;

    const handleKeyDown = (event) => {
      if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) return;
      event.preventDefault();

      const rootNode = nodes.find(n => n.depth === 0);
      if (!activeNodeId && rootNode) {
        onSelectNode(rootNode.data.id);
        return;
      }

      const currentNode = nodes.find(n => n.data.id === activeNodeId);
      if (!currentNode) return;

      const parent = currentNode.parent;
      const siblings = parent ? parent.children : (rootNode ? [rootNode] : []);
      const currentIndex = siblings.findIndex(n => n.data.id === activeNodeId);

      const keyMap = {
        radial: { up: 'parent', down: 'child', left: 'prev_sibling', right: 'next_sibling' },
        vertical: { up: 'parent', down: 'child', left: 'prev_sibling', right: 'next_sibling' },
        horizontal: { up: 'prev_sibling', down: 'next_sibling', left: 'parent', right: 'child' },
      };

      const direction = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right' }[event.key];
      const moveAction = keyMap[layout][direction];
      let targetNode = null;

      switch (moveAction) {
        case 'parent': targetNode = parent; break;
        case 'child': targetNode = currentNode.children?.[0]; break;
        case 'prev_sibling': targetNode = currentIndex > 0 ? siblings[currentIndex - 1] : null; break;
        case 'next_sibling': targetNode = currentIndex < siblings.length - 1 ? siblings[currentIndex + 1] : null; break;
        default: break;
      }

      if (targetNode) {
        onSelectNode(targetNode.data.id);
      }
    };

    svg.addEventListener('keydown', handleKeyDown);
    return () => {
      if (svg) {
        svg.removeEventListener('keydown', handleKeyDown);
      }
    };
  }, [activeNodeId, onSelectNode, nodes, layout]);

  useEffect(() => {
    contextMenuActionsRef.current = {
      onResetZoom: resetZoom,
      onAddChildToRoot: onAddNodeToRoot,
    };
  }, [resetZoom, onAddNodeToRoot]);

  useEffect(() => {
    const wrapper = svgWrapperRef.current;
    if (!wrapper) return;

    const resizeObserver = new ResizeObserver(entries => {
      if (entries[0]) {
        const { width, height } = entries[0].contentRect;
        setMainViewportSize({ width, height });
      }
    });

    resizeObserver.observe(wrapper);
    return () => resizeObserver.unobserve(wrapper);
  }, []);

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
    hideTooltip();
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
  }, [isAppBusy, onSelectNode, activeNodeId, onNavigateToLinkedProject, handleNavigateToSourceNode, hideTooltip]);

  const handleNodeDoubleClick = useCallback((event, d) => {
    event.stopPropagation();
    hideTooltip();
    if (isAppBusy || d.isProxy) return;
    const nodeId = d.data.id;
    if (nodeId) {
        onSwitchToFocusView(nodeId);
    } else {
        console.warn("Node ID not found on D3GraphNode data in double-click handler", d);
    }
  }, [isAppBusy, onSwitchToFocusView, hideTooltip]);

  const handleNodeMouseEnter = useCallback((event, d) => {
    if (d.isProxy) return;
    showTooltip(d.data, event, d.parent?.data);
  }, [showTooltip]);

  const handleNodeMouseLeave = useCallback(() => {
    hideTooltip();
  }, [hideTooltip]);

  const handleNodeContextMenu = useCallback((event, d) => {
    event.preventDefault();
    event.stopPropagation();
    hideTooltip();
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
  }, [isAppBusy, onOpenContextMenu, treeData, activeProjectId, projects, findLinkSource, onSelectNode, hideTooltip]);

  // Effect for drawing the main graph structure
  useEffect(() => {
    if (!g || !nodes || !links) return;

    const effectiveLayout = layout;

    const allNodes = [...nodes, ...projectLinksAndProxyNodes.proxyNodes];
    const allLinks = [...links, ...projectLinksAndProxyNodes.projectLinks];

    // Draw links
    g.selectAll(".graph-view-link, .graph-view-project-link")
      .data(allLinks, (d) => `${d.source.data?.id || d.source.id}-${d.target.data?.id || d.target.id}`)
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
        // Regular links have their arrowheads drawn manually at the midpoint.
        return null;
      })
      .attr("d", d => {
        // Outgoing project links are simple curves to the proxy node.
        if (d.isProjectLink && d.target.isProxy) {
            if (effectiveLayout === 'radial') return linkRadial().angle(n => n.x).radius(n => n.y)(d);
            if (effectiveLayout === 'vertical') return linkVertical().x(n => n.x).y(n => n.y)(d);
            return linkHorizontal().x(n => n.y).y(n => n.x)(d);
        }

        // All other links (regular and incoming project links) are straight lines
        // shortened to not overlap nodes.
        const sourceRadius = getNodeRadius(d.source);
        const targetRadius = getNodeRadius(d.target);

        const sourceCoords = getCoordsForLayout(d.source, effectiveLayout);
        const targetCoords = getCoordsForLayout(d.target, effectiveLayout);

        const dx = targetCoords.x - sourceCoords.x;
        const dy = targetCoords.y - sourceCoords.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist <= sourceRadius + targetRadius) return null;

        const sx = sourceCoords.x + (dx / dist) * sourceRadius;
        const sy = sourceCoords.y + (dy / dist) * sourceRadius;
        const tx = targetCoords.x - (dx / dist) * targetRadius;
        const ty = targetCoords.y - (dy / dist) * targetRadius;

        return `M${sx},${sy}L${tx},${ty}`;
      });

    // Draw arrowheads for regular links at the midpoint
    const regularLinks = allLinks.filter(link => !link.isProjectLink);
    g.selectAll(".graph-arrowhead-group")
      .data(regularLinks, d => `${d.source.data?.id || d.source.id}-${d.target.data?.id || d.target.id}`)
      .join(
        enter => {
          const group = enter.append("g").attr("class", "graph-arrowhead-group");
          group.append("path")
            .attr("d", "M0,-4L-8,0L0,4") // Arrow shape
            .attr("fill", "none")
            .attr("stroke-width", 1.5)
            .attr("stroke-linecap", "round");
          return group;
        },
        update => update,
        exit => exit.remove()
      )
      .attr("transform", d => {
        const sourceRadius = getNodeRadius(d.source);
        const targetRadius = getNodeRadius(d.target);

        const sourceCoords = getCoordsForLayout(d.source, effectiveLayout);
        const targetCoords = getCoordsForLayout(d.target, effectiveLayout);
        
        const dx = targetCoords.x - sourceCoords.x;
        const dy = targetCoords.y - sourceCoords.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist <= sourceRadius + targetRadius) return "translate(-10000, -10000)"; // Hide if nodes overlap

        const sx = sourceCoords.x + (dx / dist) * sourceRadius;
        const sy = sourceCoords.y + (dy / dist) * sourceRadius;
        const tx = targetCoords.x - (dx / dist) * targetRadius;
        const ty = targetCoords.y - (dy / dist) * targetRadius;

        const midX = (sx + tx) / 2;
        const midY = (sy + ty) / 2;
        // Point from child (t) to parent (s) for correct arrow direction.
        const angle = Math.atan2(sy - ty, sx - tx) * 180 / Math.PI;
        
        return `translate(${midX}, ${midY}) rotate(${angle})`;
      })
      .select("path")
      .attr("stroke", "var(--graph-link-stroke-ecosystem)");

    // Draw node groups
    const nodeGroups = g
      .selectAll(".graph-view-node")
      .data(allNodes, (d) => d.data?.id || d.id)
      .join(
        (enter) => {
          const group = enter.append("g")
            .attr("class", d => d.isProxy ? "graph-view-node proxy" : "graph-view-node");
          
          // The native <title> element is removed to prevent it from interfering with the custom tooltip.

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
            .style("pointer-events", "none").style("user-select", "none");

          group.append("text").attr("class", "node-icon node-lock-icon").attr("dy", d => `${getNodeRadius(d) * 0.4}px`)
            .attr("dx", d => `${-getNodeRadius(d) * 0.9}px`)
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
        const { x, y } = getCoordsForLayout(d, effectiveLayout);
        return `translate(${x}, ${y})`;
      })
      .on("click", handleNodeClick)
      .on("dblclick", handleNodeDoubleClick)
      .on("contextmenu", handleNodeContextMenu)
      .on("mouseenter", handleNodeMouseEnter)
      .on("mouseleave", handleNodeMouseLeave);

    nodeGroups.select("circle").attr("fill", d => {
        if (d.data.importance === 'minor') return 'var(--importance-minor-bg)';
        if (d.data.importance === 'major') return 'var(--importance-major-bg)';
        return 'var(--importance-common-bg)';
    });

    // Handle proxy node labels (simple text)
    nodeGroups.filter(d => d.isProxy).select("text.node-label")
      .text(d => d.data.name || "");

    // Position the foreignObject for regular node labels using a transform
    nodeGroups.filter(d => !d.isProxy).select(".node-label-foreign-object")
      .attr("width", 120)
      .attr("height", 50)
      .attr("x", 0) // Reset x to 0, positioning is handled by transform
      .attr("y", 0) // Reset y to 0
      .attr("transform", d => {
          const radius = getNodeRadius(d);
          const labelWidth = 120;
          let x, y;

          if (d.depth === 0) {
              x = -labelWidth / 2;
              y = radius + 5; // spacing
          } else {
              // Position to the bottom-right of the node's origin
              x = radius * 0.707; // approx radius / sqrt(2)
              y = radius * 0.707; // approx radius / sqrt(2)
          }
          return `translate(${x}, ${y})`;
      });

    // Set the text content for the div inside the foreignObject
    nodeGroups.filter(d => !d.isProxy).select(".node-label-wrapper")
      .html(d => d.data.name || "");

    nodeGroups.select(".node-rune-icon")
      .attr("font-size", d => `${getRuneIconSize(d)}px`)
      .attr("transform", null) // No rotation needed for any layout
      .text(d => {
        if (d.isProxy) return '';
        return NODE_IMPORTANCE_RUNES[d.data.importance] || '•';
      });

    nodeGroups.select(".node-lock-icon")
      .attr("font-size", d => `${getNodeRadius(d) * 0.8}px`)
      .attr("transform", null) // No rotation needed for any layout
      .text(d => (d.data.isLocked && !d.isProxy ? "🔒" : ""));

  }, [g, nodes, links, handleNodeClick, handleNodeDoubleClick, handleNodeContextMenu, handleNodeMouseEnter, handleNodeMouseLeave, projectLinksAndProxyNodes, layout]);

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

    // The 'stroke' is now handled by CSS classes (.selected, .status-new, etc.), so we don't set it here.
    // This prevents JS from overriding the desired CSS-based stroke color.
    
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
    React.createElement("div", { ref: svgWrapperRef, className: "graph-view-wrapper" },
      React.createElement(GraphNodeTooltip, { tooltip: tooltip }),
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
      React.createElement("svg", { ref: svgRef, tabIndex: 0, "aria-label": "Interactive graph, use arrow keys to navigate nodes when focused." }),
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
            React.createElement("button", { onClick: zoomToFit, title: "Zoom to Fit", disabled: isAppBusy || isFocusMode }, "⛶"),
            React.createElement("button", { onClick: resetZoom, title: "Reset View", disabled: isAppBusy || isFocusMode }, "🎯"),
            React.createElement("button", { onClick: zoomIn, title: "Zoom In", disabled: isAppBusy || isFocusMode }, "➕"),
            React.createElement("button", { onClick: zoomOut, title: "Zoom Out", disabled: isAppBusy || isFocusMode }, "➖")
        )
      ),
      React.createElement(GraphMiniMap, {
        nodes: nodes,
        links: links,
        layout: layout,
        viewTransform: currentTransform,
        translateTo: translateTo,
        mainViewportSize: mainViewportSize,
        activeNodeId: activeNodeId
      })
    )
  );
};

export default React.memo(GraphViewComponent);