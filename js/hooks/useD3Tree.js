import { useEffect, useMemo, useRef, useCallback, useState } from 'react';
import { select, zoom, hierarchy, tree, zoomIdentity, linkHorizontal } from 'd3';

const defaultTreeConfig = {
  nodeRadius: 10,
  horizontalSpacing: 180, 
  verticalSpacing: 90,    
  margin: { top: 20, right: 120, bottom: 20, left: 120 },
};

export const useD3Tree = (
  svgRef,
  treeData,
  config = {}
) => {
  const finalConfig = { ...defaultTreeConfig, ...config };
  const { margin, horizontalSpacing, verticalSpacing } = finalConfig;

  const svgSelectionRef = useRef(null);
  const gSelectionRef = useRef(null);
  const zoomBehaviorRef = useRef(null);
  const [g, setG] = useState(null);

  const rootHierarchy = useMemo(() => {
    if (!treeData) return null;
    return hierarchy(treeData);
  }, [treeData]);

  const treeLayout = useMemo(() => {
    return tree()
      .nodeSize([verticalSpacing, horizontalSpacing]) 
      .separation((a, b) => (a.parent === b.parent ? 1 : 1.25));
  }, [verticalSpacing, horizontalSpacing]);

  useEffect(() => {
    if (!svgRef.current) return;

    if (!svgSelectionRef.current) {
      const svg = select(svgRef.current);
      svgSelectionRef.current = svg;
      svg.select("g").remove(); 
      
      const containerDiv = svgRef.current.parentElement;
      if (!containerDiv) return;
      const { clientWidth, clientHeight } = containerDiv;

      const gElement = svg.append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);
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
      
      if (clientWidth > 0 && clientHeight > 0) {
        const initialTransform = zoomIdentity.translate(clientWidth / 4, clientHeight / 2).scale(0.8);
        svg.call(zoomBehaviorRef.current.transform, initialTransform);
      }
    }
  }, [svgRef, margin.left, margin.top]); 

  const nodesAndLinks = useMemo(() => {
    if (!rootHierarchy) return { nodes: [], links: [] };
    const treeRoot = treeLayout(rootHierarchy);
    const nodes = treeRoot.descendants();
    const links = treeRoot.links();
    nodes.forEach(node => { const temp = node.x; node.x = node.y; node.y = temp; });
    return { nodes, links };
  }, [rootHierarchy, treeLayout]);

  const resetZoom = useCallback(() => {
    if (svgSelectionRef.current && zoomBehaviorRef.current && svgRef.current && svgRef.current.parentElement) {
      const { clientWidth, clientHeight } = svgRef.current.parentElement;
      if (clientWidth > 0 && clientHeight > 0) {
        const initialTransform = zoomIdentity.translate(clientWidth / 4, clientHeight / 2).scale(0.8);
        svgSelectionRef.current.transition().duration(750).call(zoomBehaviorRef.current.transform, initialTransform);
      }
    }
  }, [svgRef]); 

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