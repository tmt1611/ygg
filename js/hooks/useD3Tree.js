import { useEffect, useMemo, useRef, useCallback, useState, useLayoutEffect } from 'react';
import { select, zoom, hierarchy, tree, zoomIdentity } from 'd3';
import { getAllNodesAsMap, findNodeById } from '../utils.js';

const createD3Marker = (defsSelection, id, className) => {
  defsSelection.append('marker')
    .attr('id', id)
    .attr('class', className)
    .attr('viewBox', '-10 -5 10 10')
    .attr('refX', 0)
    .attr('refY', 0)
    .attr('orient', 'auto')
    .attr('markerWidth', 6)
    .attr('markerHeight', 6)
    .append('svg:path')
    .attr('d', 'M0,-5L-10,0L0,5');
};

const defaultTreeConfig = {
  nodeRadius: 16, // Base for 'common', but will be overridden in GraphViewComponent
  // New config for radial layout
  radialRadiusFactor: 150, // Increased to provide more space between levels
  margin: { top: 20, right: 20, bottom: 20, left: 20 },
};

export const useD3Tree = (
  svgRef,
  treeData,
  config = {},
  onBackgroundClick,
  onBackgroundContextMenu,
  layout = 'radial' // 'radial', 'vertical', 'horizontal'
) => {
  const finalConfig = { ...defaultTreeConfig, ...config };
  const { margin, radialRadiusFactor } = finalConfig;

  const svgSelectionRef = useRef(null);
  const gSelectionRef = useRef(null);
  const zoomBehaviorRef = useRef(null);
  const [g, setG] = useState(null);
  const [currentTransform, setCurrentTransform] = useState(zoomIdentity);

  const rootHierarchy = useMemo(() => {
    if (!treeData) return null;
    // The hierarchy is now always based on the full treeData.
    // Focus mode will be handled by dimming, not by changing the data.
    return hierarchy(treeData);
  }, [treeData]);

  const treeLayout = useMemo(() => {
    const depth = rootHierarchy ? rootHierarchy.height : 1;
    if (layout === 'radial') {
      // The size is [angle, radius]. 2 * Math.PI is a full circle.
      // Make radius dependent on depth to avoid clutter
      return tree()
        .size([2 * Math.PI, depth * radialRadiusFactor])
        .separation((a, b) => (a.parent === b.parent ? 3 : 4));
    } else if (layout === 'vertical') {
      // For a top-down tree, nodeSize defines spacing between nodes.
      // Increased width to prevent label overlap.
      return tree().nodeSize([140, 200]); // [width between nodes, height between levels]
    } else { // 'horizontal' layout
      // For a left-to-right tree, nodeSize is [height between nodes, width between levels]
      // Increased height between nodes and width between levels.
      return tree().nodeSize([110, 250]);
    }
  }, [rootHierarchy, radialRadiusFactor, layout]);

  const nodesAndLinks = useMemo(() => {
    if (!rootHierarchy) return { nodes: [], links: [] };
    const treeRoot = treeLayout(rootHierarchy);
    const nodes = treeRoot.descendants();
    const links = treeRoot.links();
    // For radial, x is angle, y is radius.
    // For tree, x and y are cartesian coordinates.
    return { nodes, links };
  }, [rootHierarchy, treeLayout]);

  const centerOnNode = useCallback((nodeId) => {
    if (!svgSelectionRef.current || !zoomBehaviorRef.current || !svgRef.current.parentElement || !nodesAndLinks.nodes || nodesAndLinks.nodes.length === 0) return;

    const nodeToCenter = nodesAndLinks.nodes.find(n => n.data.id === nodeId);
    if (!nodeToCenter) return;

    const { clientWidth, clientHeight } = svgRef.current.parentElement;
    const currentTransform = select(svgRef.current).property('__zoom');
    const scale = currentTransform ? currentTransform.k : 1;
    const effectiveLayout = layout;

    let x, y;
    if (effectiveLayout === 'radial') {
        const angle = nodeToCenter.x - Math.PI / 2;
        x = nodeToCenter.y * Math.cos(angle);
        y = nodeToCenter.y * Math.sin(angle);
    } else if (effectiveLayout === 'vertical') {
        x = nodeToCenter.x;
        y = nodeToCenter.y;
    } else { // horizontal
        x = nodeToCenter.y;
        y = nodeToCenter.x;
    }

    const transform = zoomIdentity
      .translate(clientWidth / 2, clientHeight / 2)
      .scale(scale)
      .translate(-x, -y);

    svgSelectionRef.current.transition().duration(750).call(zoomBehaviorRef.current.transform, transform);
  }, [nodesAndLinks, layout]);

  const resetZoom = useCallback(() => {
    if (svgSelectionRef.current && zoomBehaviorRef.current && svgRef.current && svgRef.current.parentElement) {
      const { clientWidth, clientHeight } = svgRef.current.parentElement;
      if (clientWidth > 0 && clientHeight > 0) {
        let initialTransform;
        const effectiveLayout = layout;

        if (effectiveLayout === 'radial') {
            initialTransform = zoomIdentity.translate(clientWidth / 2, clientHeight / 2).scale(0.65);
        } else if (effectiveLayout === 'vertical') {
            // Center the tree horizontally, and position it near the top.
            const yOffset = margin.top * 4;
            initialTransform = zoomIdentity.translate(clientWidth / 2, yOffset).scale(0.65);
        } else { // horizontal
            // Center the tree vertically, and position it near the left.
            initialTransform = zoomIdentity.translate(margin.left * 6, clientHeight / 2).scale(0.6);
        }
        svgSelectionRef.current.transition().duration(750).call(zoomBehaviorRef.current.transform, initialTransform);
      }
    }
  }, [layout, margin.top, margin.left]);

  const zoomToFit = useCallback(() => {
    if (!svgSelectionRef.current || !zoomBehaviorRef.current || !svgRef.current.parentElement || !nodesAndLinks.nodes || nodesAndLinks.nodes.length === 0) return;

    const { nodes } = nodesAndLinks;
    const { clientWidth, clientHeight } = svgRef.current.parentElement;
    if (clientWidth === 0 || clientHeight === 0) return;

    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;

    nodes.forEach(node => {
        let x, y;
        if (layout === 'radial') {
            const angle = node.x - Math.PI / 2;
            x = node.y * Math.cos(angle);
            y = node.y * Math.sin(angle);
        } else if (layout === 'vertical') {
            x = node.x;
            y = node.y;
        } else { // horizontal
            x = node.y;
            y = node.x;
        }
        const padding = 30; // A fixed padding around each node for bounds calculation
        if (x - padding < minX) minX = x - padding;
        if (x + padding > maxX) maxX = x + padding;
        if (y - padding < minY) minY = y - padding;
        if (y + padding > maxY) maxY = y + padding;
    });

    const boundsWidth = maxX - minX;
    const boundsHeight = maxY - minY;

    if (boundsWidth === 0 || boundsHeight === 0) {
        resetZoom();
        return;
    }

    const scaleX = clientWidth / boundsWidth;
    const scaleY = clientHeight / boundsHeight;
    const scale = Math.min(scaleX, scaleY) * 0.9; // 0.9 for padding

    const translateX = (clientWidth / 2) - (scale * (minX + boundsWidth / 2));
    const translateY = (clientHeight / 2) - (scale * (minY + boundsHeight / 2));

    const transform = zoomIdentity.translate(translateX, translateY).scale(scale);

    svgSelectionRef.current.transition().duration(750).call(zoomBehaviorRef.current.transform, transform);
  }, [nodesAndLinks, layout, resetZoom]);

  useLayoutEffect(() => {
    if (!svgRef.current) return;

    if (!svgSelectionRef.current) {
      const svg = select(svgRef.current);
      svgSelectionRef.current = svg;
      svg.select("g").remove(); 
      svg.select("defs").remove();

      const defs = svg.append('defs');

      // The 'arrowhead' is now drawn manually in GraphViewComponent, so we only need the project one.
      createD3Marker(defs, 'arrowhead-project', 'graph-arrowhead-project');
      
      // The 'g' element will be centered, and nodes will be positioned relative to it.
      const gElement = svg.append("g");
      gSelectionRef.current = gElement;
      setG(gElement);

      zoomBehaviorRef.current = zoom()
        .scaleExtent([0.1, 3])
        .on("zoom", (event) => {
          if (gSelectionRef.current) {
            gSelectionRef.current.attr("transform", event.transform);
          }
          setCurrentTransform(event.transform);
          // Close context menu on pan/zoom
          if (onBackgroundClick) {
            onBackgroundClick();
          }
        });
      svg.call(zoomBehaviorRef.current);
      svg.on("dblclick.zoom", null); // Prevent zoom on double-click, allowing node dblclick to fire.

      if (onBackgroundClick) {
        svg.on('click', (event) => {
          if (event.target === svg.node()) {
            onBackgroundClick();
          }
        });
      }
      if (onBackgroundContextMenu) {
        svg.on('contextmenu', (event) => {
            if (event.target === svg.node()) {
                event.preventDefault();
                onBackgroundContextMenu({ x: event.clientX, y: event.clientY });
            }
        });
      }
    }
  }, [svgRef, onBackgroundClick, onBackgroundContextMenu]); 

  // This new effect handles the initial centering when a new tree is loaded.
  useLayoutEffect(() => {
    if (treeData && g) {
      // Center the graph on first load of a new tree.
      // A small delay helps ensure the parent container has its final dimensions.
      const timer = setTimeout(() => {
        resetZoom();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [treeData, g, resetZoom]);

  const zoomIn = useCallback(() => {
    if (svgSelectionRef.current && zoomBehaviorRef.current) {
      svgSelectionRef.current.transition().duration(250).call(zoomBehaviorRef.current.scaleBy, 1.2);
    }
  }, []); 

  const zoomOut = useCallback(() => {
    if (svgSelectionRef.current && zoomBehaviorRef.current) {
      svgSelectionRef.current.transition().duration(250).call(zoomBehaviorRef.current.scaleBy, 1 / 1.2);
    }
  }, []);

  const translateTo = useCallback((x, y) => {
    if (svgSelectionRef.current && zoomBehaviorRef.current) {
        svgSelectionRef.current.transition().duration(750).call(zoomBehaviorRef.current.translateTo, x, y);
    }
  }, []);


  return { 
    g,
    nodes: nodesAndLinks.nodes, 
    links: nodesAndLinks.links,
    config: finalConfig,
    resetZoom,
    zoomToFit,
    zoomIn,
    zoomOut,
    centerOnNode,
    currentTransform,
    translateTo,
  };
};