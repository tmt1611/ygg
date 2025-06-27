import { useState, useEffect, useMemo } from 'react';

const NODE_SIZES_PX = {
    minor: { width: 60, height: 60 },
    common: { width: 90, height: 90 },
    major: { width: 130, height: 130 },
};
const FOCUS_NODE_SCALE = 1.15;
const VERTICAL_SPACING = 60; // Spacing between areas
const HORIZONTAL_NODE_GAP = 30;
const VERTICAL_ROW_GAP = 30; // Spacing between rows of nodes within an area
const AREA_PADDING = 20; // Padding inside area markers

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
    const focusSize = {
        width: NODE_SIZES_PX[focusNodeData.importance || 'common'].width * FOCUS_NODE_SCALE,
        height: NODE_SIZES_PX[focusNodeData.importance || 'common'].height * FOCUS_NODE_SCALE,
    };
    
    const layoutWidth = viewportWidth;
    const centerX = layoutWidth / 2;
    
    let currentY = 0;
    
    // --- Helper to calculate and position rows of nodes ---
    const calculateAndPositionRows = (nodeDims, startY, centerHorizontally = true) => {
      if (nodeDims.length === 0) {
        return { totalHeight: 0, endY: startY };
      }
      
      const wrappingWidth = layoutWidth - (AREA_PADDING * 4); // Extra padding for safety
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
        
        const startX = centerHorizontally ? centerX - row.width / 2 : AREA_PADDING * 2;
        let currentX = startX;
        
        row.items.forEach(childDim => {
          positions.set(childDim.id, {
            x: currentX + childDim.width / 2,
            y: rowCenterY,
            ...childDim,
          });
          currentX += childDim.width + HORIZONTAL_NODE_GAP;
        });
        
        rowY += maxRowHeight + VERTICAL_ROW_GAP;
        totalHeight += maxRowHeight + VERTICAL_ROW_GAP;
      });

      return { totalHeight: totalHeight - VERTICAL_ROW_GAP };
    };

    // --- 1. Parent Area ---
    const parentSize = parentNodeData ? NODE_SIZES_PX[parentNodeData.importance || 'common'] : { width: 100, height: 40 }; // Placeholder size
    const parentAreaHeight = parentSize.height + AREA_PADDING * 2;
    areaRects.parent = { x: 0, y: currentY, width: layoutWidth, height: parentAreaHeight };
    if (parentNodeData) {
      positions.set(parentNodeData.id, { x: centerX, y: currentY + parentAreaHeight / 2, ...parentSize });
    }
    currentY += parentAreaHeight + VERTICAL_SPACING;

    // --- 2. Siblings Area (New) ---
    if (siblingsNodeData.length > 0) {
        const siblingsAreaStartY = currentY;
        const { totalHeight: siblingsAreaContentHeight } = calculateAndPositionRows(siblingsDims, siblingsAreaStartY + AREA_PADDING, true);
        const siblingsAreaHeight = siblingsAreaContentHeight > 0 ? siblingsAreaContentHeight + AREA_PADDING * 2 : 0;
        if (siblingsAreaHeight > 0) {
            areaRects.siblings = { x: 0, y: siblingsAreaStartY, width: layoutWidth, height: siblingsAreaHeight };
            currentY += siblingsAreaHeight + VERTICAL_SPACING;
        }
    }

    // --- 3. Focus Area ---
    const focusAreaStartY = currentY;
    const focusAreaHeight = focusSize.height + AREA_PADDING * 2;
    areaRects.focus = { x: 0, y: focusAreaStartY, width: layoutWidth, height: focusAreaHeight };
    positions.set(focusNodeData.id, { x: centerX, y: focusAreaStartY + focusAreaHeight / 2, ...focusSize });
    currentY += focusAreaHeight + VERTICAL_SPACING;

    // --- 4. Children Area ---
    const childrenAreaStartY = currentY;
    const { totalHeight: childrenAreaContentHeight } = calculateAndPositionRows(childrenDims, childrenAreaStartY + AREA_PADDING, true);
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