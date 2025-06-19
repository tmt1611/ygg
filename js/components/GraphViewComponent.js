import React, { useEffect, useRef, useMemo, useCallback } from 'react';
import { linkRadial, select } from 'd3';
import { useD3Tree } from '../hooks/useD3Tree.js';
import { NODE_IMPORTANCE_RUNES } from '../constants.js';

// Helper function to wrap SVG text
function wrap(textSelection, width, maxLines = 2) {
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
            if (tspan.node().getComputedTextLength() > width && line.length > 1) {
                line.pop();
                tspan.text(line.join(' '));
                if (lineNumber + 1 >= maxLines) {
                    tspan.text(tspan.text() + '…');
                    break;
                }
                line = [word];
                lineNumber++;
                tspan = text.append('tspan').attr('x', initialX).attr('dy', `${lineHeight}em`).text(word);
            }
        }
        
        if (words.length > 0 && lineNumber < maxLines) {
            tspan.text(tspan.text() + '…');
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
            } else if (dominantBaseline === 'auto' || dominantBaseline === 'alphabetic') { // This is for 'top'
                // Shift up by the total height of the extra lines
                firstTspan.attr('dy', `-${totalExtraHeightEms}em`);
            }
            // 'hanging' (bottom) doesn't need adjustment as it expands down.
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
  isAppBusy,
  projects,
  activeProjectId,
  findLinkSource,
  onNavigateToLinkedProject,
  handleNavigateToSourceNode
}) => {


  const svgContainerDivRef = useRef(null); 
  const svgRef = useRef(null); 
  
  const { g, nodes, links, config, resetZoom, zoomIn, zoomOut } = useD3Tree(svgRef, treeData);

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
      .attr("d", linkRadial().angle(d => d.x).radius(d => d.y));

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
        if (d.data._changeStatus && d.data._changeStatus !== 'unchanged') {
          classes.push(`status-${d.data._changeStatus}`);
        }
        return classes.join(' ');
      })
      .attr("transform", d => `rotate(${d.x * 180 / Math.PI - 90}) translate(${d.y}, 0)`)
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
      .attr("fill", "var(--graph-node-text)")
      .attr("font-size", "11px")
      .style("user-select", "none")
      .style("pointer-events", "none")
      .attr("transform", d => {
          // Counter-rotate the text to keep it horizontal
          const rotation = -(d.x * 180 / Math.PI - 90);
          const angle = d.x * 180 / Math.PI;
          const radius = getNodeRadius(d);
          const spacing = 8; // Increased spacing slightly
          let x = 0;
          let y = 0;

          // Determine position based on angle
          if (angle > 15 && angle < 165) { // Bottom-ish
              y = radius + spacing;
          } else if (angle > 195 && angle < 345) { // Top-ish
              y = -(radius + spacing);
          } else { // Sides
              x = (angle >= 165 && angle <= 195) ? -spacing : spacing;
              y = 0;
          }
          
          return `rotate(${rotation}) translate(${x}, ${y})`;
      })
      .attr("text-anchor", d => {
          if (d.isProxy) return "middle";
          const angle = d.x * 180 / Math.PI;
          if (angle > 15 && angle < 165) return "middle"; // Bottom-ish
          if (angle > 195 && angle < 345) return "middle"; // Top-ish
          return angle >= 165 && angle <= 195 ? "end" : "start"; // Sides
      })
      .attr("dominant-baseline", d => {
          if (d.isProxy) return "middle";
          const angle = d.x * 180 / Math.PI;
          if (angle > 15 && angle < 165) return "hanging"; // Bottom
          if (angle > 195 && angle < 345) return "auto"; // Top (alphabetic)
          return "middle"; // Sides
      })
      .attr("dy", d => d.isProxy ? "0.3em" : null)
      .attr("dx", null)
      .text(d => d.isProxy ? d.data.name : (d.data.name || ""))
      .each(function(d) {
        select(this).selectAll("tspan").remove();
        if (!d.isProxy && d.data.name) {
            const maxTextWidth = 100; // pixels
            wrap(select(this), maxTextWidth, 2);
        }
      });

    nodeGroups.select(".node-rune-icon")
      .attr("transform", d => `rotate(${-(d.x * 180 / Math.PI - 90)})`)
      .text(d => {
        if (d.isProxy) return '';
        // Now that text is outside, the rune can be inside.
        return NODE_IMPORTANCE_RUNES[d.data.importance] || '•';
      });

    nodeGroups.select(".node-lock-icon")
      .attr("transform", d => `rotate(${-(d.x * 180 / Math.PI - 90)})`)
      .text(d => (d.data.isLocked && !d.isProxy ? "🔒" : ""));

  }, [g, nodes, links, handleNodeClick, handleNodeDoubleClick, handleNodeContextMenu, projectLinksAndProxyNodes]);

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

  }, [g, activeNodeId, nodes]); // Using 'nodes' to re-run on data change.


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
        React.createElement("button", { onClick: resetZoom, title: "Reset Zoom & Pan", disabled: isAppBusy }, "🎯")
      )
    )
  );
};

export default React.memo(GraphViewComponent);