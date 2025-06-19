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
  onBackgroundClick
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
    // The size is [angle, radius]. 2 * Math.PI is a full circle.
    // Make radius dependent on depth to avoid clutter
    return tree()
      .size([2 * Math.PI, depth * radialRadiusFactor])
      .separation((a, b) => (a.parent === b.parent ? 2 : 2.5));
  }, [rootHierarchy, radialRadiusFactor]);

  const resetZoom = useCallback(() => {
    if (svgSelectionRef.current && zoomBehaviorRef.current && svgRef.current && svgRef.current.parentElement) {
      const { clientWidth, clientHeight } = svgRef.current.parentElement;
      if (clientWidth > 0 && clientHeight > 0) {
        const initialTransform = zoomIdentity.translate(clientWidth / 2, clientHeight / 2).scale(0.8);
        svgSelectionRef.current.transition().duration(750).call(zoomBehaviorRef.current.transform, initialTransform);
      }
    }
  }, []);

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
    }
  }, [svgRef, onBackgroundClick]); 

  // This new effect handles the initial centering.
  useLayoutEffect(() => {
    if (treeData && g) {
      // Center the graph on first load of a new tree.
      // A small delay helps ensure the parent container has its final dimensions.
      const timer = setTimeout(() => {
        resetZoom();
      }, 50); 
      initialDataLoadedForSession.current = true;
      return () => clearTimeout(timer);
    } else if (!treeData) {
      // Reset the flag if data is unloaded, allowing re-centering on next load.
      initialDataLoadedForSession.current = false;
    }
  }, [treeData, g, resetZoom]);

  const nodesAndLinks = useMemo(() => {
    if (!rootHierarchy) return { nodes: [], links: [] };
    const treeRoot = treeLayout(rootHierarchy);
    const nodes = treeRoot.descendants();
    const links = treeRoot.links();
    // For radial, x is angle, y is radius. No swap needed.
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