import React, { useEffect, useRef, useMemo, useCallback, useState } from 'react';
import { linkRadial, select, linkVertical, linkHorizontal } from 'd3';
import { useD3Tree } from '../hooks/useD3Tree.js';
import { NODE_IMPORTANCE_RUNES } from '../constants.js';

// Helper function to wrap SVG text
function wrap(textSelection, width, maxLines = 3) {
    textSelection.each(function() {
        const text = select(this);
        const words = text.text().split(/\s+/).reverse();
        let word;
        let line = [];
        let lineNumber = 0;
        const lineHeight = 1.2; // ems
        
        const initialX = text.attr('x') || 0;
        text.text(null); // Clear original text

        let tspan = text.append('tspan').attr('x', initialX);

        while ((word = words.pop()) && lineNumber < maxLines) {
            line.push(word);
            tspan.text(line.join(' '));
            if (tspan.node().getComputedTextLength() > width) {
                if (line.length > 1) {
                    line.pop(); // The last word made it too long
                    tspan.text(line.join(' '));
                    
                    if (lineNumber + 1 >= maxLines) {
                        tspan.text(tspan.text() + '…');
                        break; // Stop if we are on the last line
                    }
                    
                    // Start a new line with the popped word
                    line = [word];
                    lineNumber++;
                    tspan = text.append('tspan').attr('x', initialX).attr('dy', `${lineHeight}em`).text(word);
                }
                
                // This handles both a single long word on the first line,
                // or a single long word on a subsequent line.
                if (tspan.node().getComputedTextLength() > width) {
                    let currentText = tspan.text();
                    while (tspan.node().getComputedTextLength() > width && currentText.length > 1) {
                        currentText = currentText.slice(0, -1);
                        tspan.text(currentText + '…');
                    }
                }
            }
        }
        
        if (words.length > 0 && lineNumber < maxLines) {
            const currentText = tspan.text();
            if (!currentText.endsWith('…')) {
                tspan.text(currentText + '…');
            }
        }

        // Adjust for multi-line text to keep it centered on its anchor point
        const numLines = text.selectAll('tspan').size();
        if (numLines > 1) {
            const dominantBaseline = text.attr('dominant-baseline');
            const firstTspan = text.select('tspan');
            const totalExtraHeightEms = (numLines - 1) * lineHeight;

            if (dominantBaseline === 'middle') {
                // Shift up by half the total height of the extra lines
                firstTspan.attr('dy', `-${totalExtraHeightEms / 2}em`);
            } else if (dominantBaseline === 'baseline') {
                // For text placed above the node, shift the entire block up
                firstTspan.attr('dy', `-${totalExtraHeightEms}em`);
            }
            // For 'hanging', no adjustment is needed as it's already anchored at the top.
        }
    });
}


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
  isAppBusy,
  projects,
  activeProjectId,
  findLinkSource,
  onNavigateToLinkedProject,
  handleNavigateToSourceNode
}) => {
  const LAYOUT_CYCLE = ['radial', 'vertical', 'horizontal'];
  const [layout, setLayout] = useState('radial'); // 'radial', 'vertical', or 'horizontal'

  const svgContainerDivRef = useRef(null); 
  const svgRef = useRef(null); 
  
  const { g, nodes, links, config, resetZoom, zoomIn, zoomOut } = useD3Tree(svgRef, treeData, {}, onCloseContextMenu, layout);

  const toggleLayout = useCallback(() => {
    setLayout(prev => {
      const currentIndex = LAYOUT_CYCLE.indexOf(prev);
      const newLayout = LAYOUT_CYCLE[(currentIndex + 1) % LAYOUT_CYCLE.length];
      // A brief delay allows the state to update before we recenter the view on the new layout.
      setTimeout(resetZoom, 50);
      return newLayout;
    });
  }, [resetZoom]);

  const projectLinksAndProxyNodes = useMemo(() => {
    // NOTE: Project links are currently only visualized in the 'radial' layout for simplicity.
    if (layout !== 'radial' || !nodes || nodes.length === 0 || !projects) {
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
      .attr("d", d => {
        if (layout === 'radial') return linkRadial().angle(n => n.x).radius(n => n.y)(d);
        if (layout === 'vertical') return linkVertical().x(n => n.x).y(n => n.y)(d);
        // For horizontal, we swap x and y for d3.linkHorizontal
        return linkHorizontal().x(n => n.y).y(n => n.x)(d);
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
            } else {
              el.append("circle").attr("r", getNodeRadius).attr("stroke-width", 1.5).style("cursor", "pointer");
            }
          });

          group.append("text").attr("class", "node-label")
            .style("pointer-events", "none").style("user-select", "none");
          
          group.append("text").attr("class", "node-rune-icon").attr("dy", "0.35em")
            .attr("font-size", d => `${getNodeRadius(d) * 0.9}px`).style("pointer-events", "none").style("user-select", "none");

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
        if (layout === 'radial') {
            return `rotate(${d.x * 180 / Math.PI - 90}) translate(${d.y}, 0)`;
        } else if (layout === 'vertical') {
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

    nodeGroups.select(".node-label")
      .attr("fill", 'var(--graph-node-text)')
      .attr("font-size", "11px")
      .style("user-select", "none")
      .style("pointer-events", "none")
      .attr("transform", d => {
        if (d.isProxy) {
            const rotation = layout === 'radial' ? -(d.x * 180 / Math.PI - 90) : 0;
            return `rotate(${rotation})`;
        }

        const radius = getNodeRadius(d);
        const spacing = 10;

        if (layout === 'radial') {
            const angle = d.x;
            const rotation = -(d.x * 180 / Math.PI - 90);

            // d3.tree radial layout: 0 is top, PI/2 is right, PI is bottom, 3PI/2 is left
            const isTopCone = angle > (1.75 * Math.PI) || angle < (0.25 * Math.PI);
            const isBottomCone = angle > (0.75 * Math.PI) && angle < (1.25 * Math.PI);

            let x = 0;
            let y = 0;

            if (isTopCone) {
                y = -radius - spacing;
            } else if (isBottomCone) {
                y = radius + spacing;
            } else { // Left or Right side
                const isLeft = angle > Math.PI; // Left half of the circle (bottom-to-top)
                x = isLeft ? -radius - spacing : radius + spacing;
            }
            
            return `rotate(${rotation}) translate(${x}, ${y})`;
        }
        
        // For vertical and horizontal, no rotation in the group, so it's simpler.
        if (layout === 'vertical') {
            return `translate(0, ${radius + spacing})`;
        } else { // horizontal
            return `translate(${radius + spacing}, 0)`;
        }
      })
      .attr("text-anchor", d => {
          if (d.isProxy || layout === 'vertical') return "middle";
          if (layout === 'horizontal') return "start";
          
          // Radial layout
          const angle = d.x;
          const isTopCone = angle > (1.75 * Math.PI) || angle < (0.25 * Math.PI);
          const isBottomCone = angle > (0.75 * Math.PI) && angle < (1.25 * Math.PI);

          if (isTopCone || isBottomCone) {
              return "middle";
          }
          return (angle > Math.PI) ? "end" : "start"; // Left half is end-anchored
      })
      .attr("dominant-baseline", d => {
        if (d.isProxy) return "middle";
        if (layout === 'horizontal') return "middle";
        if (layout === 'vertical') return "hanging"; // Text is below node

        if (layout === 'radial') {
            const angle = d.x;
            const isTopCone = angle > (1.75 * Math.PI) || angle < (0.25 * Math.PI);
            const isBottomCone = angle > (0.75 * Math.PI) && angle < (1.25 * Math.PI);
            if (isTopCone) return "baseline"; // Text is above node
            if (isBottomCone) return "hanging"; // Text is below node
            return "middle"; // Text is to the side
        }
        return "middle";
      })
      .attr("dy", null) // dy is handled by the wrap function for multi-line text
      .attr("dx", null)
      .text(d => d.isProxy ? d.data.name : (d.data.name || ""))
      .each(function(d) {
        select(this).selectAll("tspan").remove();
        if (!d.isProxy && d.data.name) {
            const maxTextWidth = 90;
            const maxLines = 3;
            wrap(select(this), maxTextWidth, maxLines);
        }
      });

    nodeGroups.select(".node-rune-icon")
      .attr("transform", d => {
        if (layout === 'radial') return `rotate(${-(d.x * 180 / Math.PI - 90)})`;
        return null; // No rotation for vertical or horizontal
      })
      .text(d => {
        if (d.isProxy) return '';
        return NODE_IMPORTANCE_RUNES[d.data.importance] || '•';
      });

    nodeGroups.select(".node-lock-icon")
      .attr("transform", d => {
        if (layout === 'radial') return `rotate(${-(d.x * 180 / Math.PI - 90)})`;
        return null; // No rotation for vertical or horizontal
      })
      .text(d => (d.data.isLocked && !d.isProxy ? "🔒" : ""));

  }, [g, nodes, links, handleNodeClick, handleNodeDoubleClick, handleNodeContextMenu, projectLinksAndProxyNodes, layout]);

  // Effect for dynamic styling (selection, search highlight)
  useEffect(() => {
    if (!g) return;

    const nodeSelection = g.selectAll(".graph-view-node");
    
    nodeSelection
      .classed("selected", d => !d.isProxy && d.data.id === activeNodeId)
      .classed("highlighted", false); // No search term, so nothing is highlighted

    nodeSelection.select("circle")
      .attr("stroke", d => {
          return d.isProxy ? null : (d.data.id === activeNodeId ? 'var(--graph-node-selected-stroke)' : 'var(--graph-node-stroke)');
      });

  }, [g, activeNodeId, nodes, layout]); // Using 'nodes' and 'layout' to re-run on data change.


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
        React.createElement("button", { onClick: toggleLayout, title: "Toggle Layout", disabled: isAppBusy }, layout === 'radial' ? '🌳' : (layout === 'vertical' ? '↔️' : '⭕')),
        React.createElement("button", { onClick: zoomIn, title: "Zoom In", disabled: isAppBusy }, "➕"),
        React.createElement("button", { onClick: zoomOut, title: "Zoom Out", disabled: isAppBusy }, "➖"),
        React.createElement("button", { onClick: resetZoom, title: "Reset Zoom & Pan", disabled: isAppBusy }, "🎯")
      )
    )
  );
};

export default React.memo(GraphViewComponent);