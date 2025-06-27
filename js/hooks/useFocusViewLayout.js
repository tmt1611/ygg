import { useState, useEffect, useMemo } from 'react';

const NODE_SIZES_PX = {
    minor: { width: 60, height: 60 },
    common: { width: 90, height: 90 },
    major: { width: 130, height: 130 },
};
const FOCUS_NODE_SCALE = 1.15;
const VERTICAL_SPACING = 50; // Reduced from 60
const HORIZONTAL_NODE_GAP = 25; // Reduced from 30
const VERTICAL_ROW_GAP = 25; // Reduced from 30
const AREA_PADDING = 20;

/**
 * A pure helper function to calculate node positions within an area, supporting wrapping.
 * @returns {{totalHeight: number, positions: Map<string, object>}}
 */
const calculateNodeRowsAndPositions = (nodeDims, startY, layoutWidth, centerX) => {
  const newPositions = new Map();
  if (nodeDims.length === 0) {
    return { totalHeight: 0, positions: newPositions };
  }

  const wrappingWidth = layoutWidth - (AREA_PADDING * 4);
  const rows = [];
  let currentRow = [];
  let currentRowWidth = 0;

  nodeDims.forEach(nodeDim => {
    const requiredWidth = nodeDim.width + (currentRow.length > 0 ? HORIZONTAL_NODE_GAP : 0);
    if (currentRow.length > 0 && currentRowWidth + requiredWidth > wrappingWidth) {
      rows.push({ items: currentRow, width: currentRowWidth });
      currentRow = [nodeDim];
      currentRowWidth = nodeDim.width;
    } else {
      currentRow.push(nodeDim);
      currentRowWidth += requiredWidth;
    }
  });
  if (currentRow.length > 0) {
    rows.push({ items: currentRow, width: currentRowWidth });
  }

  let rowY = startY;
  let totalHeight = 0;

  rows.forEach(row => {
    const maxRowHeight = Math.max(...row.items.map(d => d.height), 0);
    const rowCenterY = rowY + maxRowHeight / 2;
    
    const startX = centerX - row.width / 2;
    let currentX = startX;
    
    row.items.forEach(childDim => {
      newPositions.set(childDim.id, {
        x: currentX + childDim.width / 2,
        y: rowCenterY,
        ...childDim,
      });
      currentX += childDim.width + HORIZONTAL_NODE_GAP;
    });
    
    rowY += maxRowHeight + VERTICAL_ROW_GAP;
    totalHeight += maxRowHeight + VERTICAL_ROW_GAP;
  });

  return { totalHeight: totalHeight > 0 ? totalHeight - VERTICAL_ROW_GAP : 0, positions: newPositions };
};


export const useFocusViewLayout = (
  layoutRef,
  focusNodeData,
  parentNodeData,
  childrenNodeData,
  siblingsNodeData
) => {
  const [layoutMetrics, setLayoutMetrics] = useState({ positions: new Map(), areaRects: {}, width: 0, height: 0 });
  const [viewportWidth, setViewportWidth] = useState(0);

  const childrenDims = useMemo(() => 
    childrenNodeData.map(child => ({
      ...NODE_SIZES_PX[child.importance || 'common'],
      id: child.id,
    })), [childrenNodeData]);

  const siblingsDims = useMemo(() =>
    siblingsNodeData.map(sibling => ({
      ...NODE_SIZES_PX[sibling.importance || 'common'],
      id: sibling.id,
    })), [siblingsNodeData]);

  useEffect(() => {
    const element = layoutRef.current;
    if (!element) return;
    
    const resizeObserver = new ResizeObserver(entries => {
      if (entries[0]) {
        setViewportWidth(entries[0].contentRect.width);
      }
    });
    
    resizeObserver.observe(element);
    setViewportWidth(element.clientWidth);

    return () => {
      if (element) {
        resizeObserver.unobserve(element);
      }
    };
  }, [layoutRef]);

  useEffect(() => {
    if (!focusNodeData || viewportWidth === 0) {
      setLayoutMetrics({ positions: new Map(), areaRects: {}, width: 0, height: 0 });
      return;
    }

    const positions = new Map();
    const areaRects = {};
    
    const layoutWidth = viewportWidth;
    const centerX = layoutWidth / 2;
    
    let currentY = 0;

    // --- 1. Parent Area ---
    const parentSize = parentNodeData ? NODE_SIZES_PX[parentNodeData.importance || 'common'] : { width: 100, height: 40 };
    const parentAreaHeight = parentSize.height + AREA_PADDING * 2;
    areaRects.parent = { x: 0, y: currentY, width: layoutWidth, height: parentAreaHeight };
    if (parentNodeData) {
      positions.set(parentNodeData.id, { x: centerX, y: currentY + parentAreaHeight / 2, ...parentSize });
    }
    currentY += parentAreaHeight + VERTICAL_SPACING;

    // --- 2. Center Area (Focus + Siblings) ---
    const centerAreaStartY = currentY;
    const focusSize = {
        width: NODE_SIZES_PX[focusNodeData.importance || 'common'].width * FOCUS_NODE_SCALE,
        height: NODE_SIZES_PX[focusNodeData.importance || 'common'].height * FOCUS_NODE_SCALE,
    };

    let leftWidth = 0, rightWidth = 0;
    const leftSiblings = [], rightSiblings = [];

    // Balance siblings by width
    siblingsDims.forEach(dim => {
      if (leftWidth <= rightWidth) {
        leftSiblings.push(dim);
        leftWidth += dim.width + HORIZONTAL_NODE_GAP;
      } else {
        rightSiblings.push(dim);
        rightWidth += dim.width + HORIZONTAL_NODE_GAP;
      }
    });
    
    const maxSiblingHeight = Math.max(0, ...siblingsDims.map(d => d.height));
    const centerRowHeight = Math.max(focusSize.height, maxSiblingHeight);
    const centerRowY = centerAreaStartY + centerRowHeight / 2 + AREA_PADDING;

    positions.set(focusNodeData.id, { x: centerX, y: centerRowY, ...focusSize });
    
    // Position left siblings
    let currentX = centerX - (focusSize.width / 2) - HORIZONTAL_NODE_GAP;
    leftSiblings.reverse().forEach(dim => {
        positions.set(dim.id, {
            x: currentX - dim.width / 2,
            y: centerRowY, ...dim
        });
        currentX -= (dim.width + HORIZONTAL_NODE_GAP);
    });

    // Position right siblings
    currentX = centerX + (focusSize.width / 2) + HORIZONTAL_NODE_GAP;
    rightSiblings.forEach(dim => {
        positions.set(dim.id, {
            x: currentX + dim.width / 2,
            y: centerRowY, ...dim
        });
        currentX += (dim.width + HORIZONTAL_NODE_GAP);
    });
    
    const centerAreaHeight = centerRowHeight + AREA_PADDING * 2;
    areaRects.focus = { x: 0, y: centerAreaStartY, width: layoutWidth, height: centerAreaHeight };
    currentY += centerAreaHeight + VERTICAL_SPACING;

    // --- 3. Children Area ---
    const childrenAreaStartY = currentY;
    const { totalHeight: childrenAreaContentHeight, positions: childrenPositions } = calculateNodeRowsAndPositions(childrenDims, childrenAreaStartY + AREA_PADDING, layoutWidth, centerX);
    childrenPositions.forEach((pos, id) => positions.set(id, pos));
    const childrenAreaHeight = childrenAreaContentHeight > 0 ? childrenAreaContentHeight + AREA_PADDING * 2 : 120;
    areaRects.children = { x: 0, y: childrenAreaStartY, width: layoutWidth, height: childrenAreaHeight };
    currentY = childrenAreaStartY + childrenAreaHeight;
    
    const totalHeight = currentY + AREA_PADDING;

    setLayoutMetrics({
      positions,
      areaRects,
      width: layoutWidth,
      height: totalHeight,
    });
  }, [focusNodeData, parentNodeData, childrenNodeData, siblingsNodeData, viewportWidth]);
  
  return layoutMetrics;
};