import React, { useMemo, useRef, useEffect, useCallback } from 'react';
import { select, drag } from 'd3';

const MINI_MAP_WIDTH = 200;
const MINI_MAP_HEIGHT = 150;
const PADDING = 10;

const GraphMiniMap = ({
  nodes,
  links,
  layout,
  viewTransform,
  translateTo,
  mainViewportSize,
  activeNodeId,
}) => {
  const miniMapRef = useRef(null);
  const viewRectRef = useRef(null);

  const { viewBox, nodePositions, linkPositions } = useMemo(() => {
    if (!nodes || nodes.length === 0) {
      return { viewBox: `0 0 ${MINI_MAP_WIDTH} ${MINI_MAP_HEIGHT}`, nodePositions: [], linkPositions: [] };
    }

    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;

    const getCoords = (node) => {
      if (layout === 'radial') {
        const angle = node.x - Math.PI / 2;
        return { x: node.y * Math.cos(angle), y: node.y * Math.sin(angle) };
      }
      if (layout === 'vertical') return { x: node.x, y: node.y };
      return { x: node.y, y: node.x }; // horizontal
    };

    const nodePositions = nodes.map(node => {
      const { x, y } = getCoords(node);
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y);
      return { x, y, id: node.data.id };
    });

    const width = maxX - minX;
    const height = maxY - minY;
    const viewBox = `${minX - PADDING} ${minY - PADDING} ${width + PADDING * 2} ${height + PADDING * 2}`;

    const linkPositions = links.map(link => {
      const sourceCoords = getCoords(link.source);
      const targetCoords = getCoords(link.target);
      return { x1: sourceCoords.x, y1: sourceCoords.y, x2: targetCoords.x, y2: targetCoords.y };
    });

    return { viewBox, nodePositions, linkPositions };
  }, [nodes, links, layout]);

  const viewRect = useMemo(() => {
    if (!mainViewportSize || !viewTransform || mainViewportSize.width === 0) return { x: 0, y: 0, width: 0, height: 0 };
    const { k, x, y } = viewTransform;
    const { width, height } = mainViewportSize;
    return {
      width: width / k,
      height: height / k,
      x: -x / k,
      y: -y / k,
    };
  }, [viewTransform, mainViewportSize]);

  const handleMiniMapClick = useCallback((event) => {
    const svg = miniMapRef.current;
    if (!svg || event.target !== svg) return; // Only trigger on background click
    const pt = svg.createSVGPoint();
    pt.x = event.clientX;
    pt.y = event.clientY;
    const transformedPt = pt.matrixTransform(svg.getScreenCTM().inverse());
    translateTo(transformedPt.x, transformedPt.y);
  }, [translateTo]);

  useEffect(() => {
    if (!viewRectRef.current || !miniMapRef.current) return;

    const dragBehavior = drag()
      .on('start', function(event) {
        select(this).raise().attr('stroke', 'var(--primary-accent)');
        event.sourceEvent.stopPropagation();
      })
      .on('drag', function(event) {
        const svg = miniMapRef.current;
        if (!svg) return;
        const pt = svg.createSVGPoint();
        pt.x = event.sourceEvent.clientX;
        pt.y = event.sourceEvent.clientY;
        const transformedPt = pt.matrixTransform(svg.getScreenCTM().inverse());
        translateTo(transformedPt.x, transformedPt.y);
      })
      .on('end', function() {
        select(this).attr('stroke', 'var(--graph-node-selected-stroke)');
      });

    select(viewRectRef.current).call(dragBehavior);
  }, [translateTo]);

  if (!nodes || nodes.length === 0) {
    return null;
  }

  return (
    React.createElement("div", { className: "graph-minimap-container" },
      React.createElement("svg", {
        ref: miniMapRef,
        width: MINI_MAP_WIDTH,
        height: MINI_MAP_HEIGHT,
        viewBox: viewBox,
        onClick: handleMiniMapClick,
      },
        React.createElement("g", { className: "minimap-links" },
          linkPositions.map((link, i) =>
            React.createElement("line", { key: i, x1: link.x1, y1: link.y1, x2: link.x2, y2: link.y2 })
          )
        ),
        React.createElement("g", { className: "minimap-nodes" },
          nodePositions.map((node, i) =>
            React.createElement("circle", {
              key: node.id || i,
              cx: node.x,
              cy: node.y,
              r: 5,
              className: activeNodeId === node.id ? 'active' : '',
            })
          )
        ),
        React.createElement("rect", {
          ref: viewRectRef,
          className: "minimap-view-rect",
          x: viewRect.x,
          y: viewRect.y,
          width: viewRect.width,
          height: viewRect.height
        })
      )
    )
  );
};

export default React.memo(GraphMiniMap);