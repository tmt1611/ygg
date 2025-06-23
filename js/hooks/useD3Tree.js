import { useEffect, useMemo, useRef, useCallback, useState, useLayoutEffect } from 'react';
import { select, zoom, hierarchy, tree, zoomIdentity } from 'd3';

const defaultTreeConfig = {
  nodeRadius: 16, // Base for 'common', but will be overridden in GraphViewComponent
  // New config for radial layout
  radialRadiusFactor: 120, 
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
  const initialDataLoadedForSession = useRef(false);

  const rootHierarchy = useMemo(() => {
    if (!treeData) return null;
    return hierarchy(treeData);
  }, [treeData]);

  const treeLayout = useMemo(() => {
    const depth = rootHierarchy ? rootHierarchy.height : 1;
    if (layout === 'radial') {
      // The size is [angle, radius]. 2 * Math.PI is a full circle.
      // Make radius dependent on depth to avoid clutter
      return tree()
        .size([2 * Math.PI, depth * radialRadiusFactor])
        .separation((a, b) => (a.parent === b.parent ? 2 : 2.5));
    } else if (layout === 'vertical') {
      // For a top-down tree, nodeSize defines spacing between nodes.
      return tree().nodeSize([80, 180]); // [width between nodes, height between levels]
    } else { // 'horizontal' layout
      // For a left-to-right tree, nodeSize is [height between nodes, width between levels]
      return tree().nodeSize([80, 220]);
    }
  }, [rootHierarchy, radialRadiusFactor, layout]);

  const resetZoom = useCallback(() => {
    if (svgSelectionRef.current && zoomBehaviorRef.current && svgRef.current && svgRef.current.parentElement) {
      const { clientWidth, clientHeight } = svgRef.current.parentElement;
      if (clientWidth > 0 && clientHeight > 0) {
        let initialTransform;
        if (layout === 'radial') {
            initialTransform = zoomIdentity.translate(clientWidth / 2, clientHeight / 2).scale(0.8);
        } else if (layout === 'vertical') {
            // Center the tree horizontally, and position it near the top.
            initialTransform = zoomIdentity.translate(clientWidth / 2, margin.top * 4).scale(0.7);
        } else { // horizontal
            // Center the tree vertically, and position it near the left.
            initialTransform = zoomIdentity.translate(margin.left * 6, clientHeight / 2).scale(0.7);
        }
        svgSelectionRef.current.transition().duration(750).call(zoomBehaviorRef.current.transform, initialTransform);
      }
    }
  }, [layout, margin.top, margin.left]);

  useLayoutEffect(() => {
    if (!svgRef.current) return;

    if (!svgSelectionRef.current) {
      const svg = select(svgRef.current);
      svgSelectionRef.current = svg;
      svg.select("g").remove(); 
      
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
        });
      svg.call(zoomBehaviorRef.current);

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
  }, [treeData, g, resetZoom]); // resetZoom is stable but depends on layout, so this effect runs on treeData or layout change.

  const nodesAndLinks = useMemo(() => {
    if (!rootHierarchy) return { nodes: [], links: [] };
    const treeRoot = treeLayout(rootHierarchy);
    const nodes = treeRoot.descendants();
    const links = treeRoot.links();
    // For radial, x is angle, y is radius.
    // For tree, x and y are cartesian coordinates.
    return { nodes, links };
  }, [rootHierarchy, treeLayout]);

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


  return { 
    g,
    nodes: nodesAndLinks.nodes, 
    links: nodesAndLinks.links,
    config: finalConfig,
    resetZoom,
    zoomIn,
    zoomOut,
  };
};