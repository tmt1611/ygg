import { useState, useEffect, useMemo } from 'react';

const NODE_SIZES_PX = {
    minor: { width: 60, height: 60 },
    common: { width: 90, height: 90 },
    major: { width: 130, height: 130 },
};
const FOCUS_NODE_SCALE = 1.15;
const VERTICAL_SPACING = 50; // Increased spacing
const HORIZONTAL_CHILD_GAP = 30; // Increased spacing
const CHILD_ROW_VERTICAL_GAP = 40; // Increased spacing

export const useFocusViewLayout = (
  layoutRef,
  focusNodeData,
  parentNodeData,
  childrenNodeData,
  siblingsNodeData
) => {
  const [layoutMetrics, setLayoutMetrics] = useState({ positions: new Map(), width: 0, height: 0 });
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
      setLayoutMetrics({ positions: new Map(), width: 0, height: 0 });
      return;
    }

    const positions = new Map();
    const focusSize = {
        width: NODE_SIZES_PX[focusNodeData.importance || 'common'].width * FOCUS_NODE_SCALE,
        height: NODE_SIZES_PX[focusNodeData.importance || 'common'].height * FOCUS_NODE_SCALE,
    };
    
    // --- Determine Layout Width ---
    const allFocusLevelDims = [
      ...siblingsDims.filter((_, i) => i % 2 === 0).reverse(),
      {...focusSize, id: focusNodeData.id},
      ...siblingsDims.filter((_, i) => i % 2 !== 0),
    ];
    const totalFocusLevelWidth = allFocusLevelDims.reduce((acc, dim) => acc + dim.width, 0) + (allFocusLevelDims.length - 1) * HORIZONTAL_CHILD_GAP;

    let maxChildRowWidth = 0;
    const childrenRows = [];
    if (childrenDims.length > 0) {
        const wrappingWidth = Math.max(300, viewportWidth * 0.95);
        let currentRow = [];
        let currentRowWidth = 0;
        
        childrenDims.forEach(childDim => {
            const requiredWidth = childDim.width + (currentRow.length > 0 ? HORIZONTAL_CHILD_GAP : 0);
            if (currentRow.length > 0 && currentRowWidth + requiredWidth > wrappingWidth) {
                childrenRows.push({items: currentRow, width: currentRowWidth});
                maxChildRowWidth = Math.max(maxChildRowWidth, currentRowWidth);
                currentRow = [childDim];
                currentRowWidth = childDim.width;
            } else {
                currentRow.push(childDim);
                currentRowWidth += requiredWidth;
            }
        });
        if (currentRow.length > 0) {
            childrenRows.push({items: currentRow, width: currentRowWidth});
            maxChildRowWidth = Math.max(maxChildRowWidth, currentRowWidth);
        }
    }

    const layoutWidth = Math.max(totalFocusLevelWidth, maxChildRowWidth, viewportWidth) + 100; // Add horizontal padding
    const centerX = layoutWidth / 2;

    // --- Position Nodes ---
    const parentSize = parentNodeData ? NODE_SIZES_PX[parentNodeData.importance || 'common'] : { width: 0, height: 0 };
    const parentY = parentNodeData ? VERTICAL_SPACING : 0;
    if (parentNodeData) {
      positions.set(parentNodeData.id, { x: centerX, y: parentY + parentSize.height / 2, ...parentSize });
    }

    const focusLevelY = parentNodeData ? parentY + parentSize.height + VERTICAL_SPACING : VERTICAL_SPACING;
    const maxFocusLevelHeight = Math.max(focusSize.height, ...siblingsDims.map(d => d.height), 0);
    const focusLevelCenterY = focusLevelY + maxFocusLevelHeight / 2;
    
    // Position focus level nodes (focus + siblings) centered within their total width
    let currentX = centerX - totalFocusLevelWidth / 2;
    allFocusLevelDims.forEach(dim => {
        positions.set(dim.id, {
            x: currentX + dim.width / 2,
            y: focusLevelCenterY,
            ...dim
        });
        currentX += (dim.width + HORIZONTAL_CHILD_GAP);
    });
    
    let totalHeight = focusLevelY + maxFocusLevelHeight + VERTICAL_SPACING;

    // Position children rows
    if (childrenRows.length > 0) {
      let currentY = focusLevelY + maxFocusLevelHeight + VERTICAL_SPACING;
      childrenRows.forEach(row => {
        const maxRowHeight = Math.max(...row.items.map(d => d.height), 0);
        const rowCenterY = currentY + maxRowHeight / 2;
        let currentChildX = centerX - row.width / 2;
        
        row.items.forEach(childDim => {
          positions.set(childDim.id, {
            x: currentChildX + childDim.width / 2,
            y: rowCenterY,
            ...childDim,
          });
          currentChildX += childDim.width + HORIZONTAL_CHILD_GAP;
        });
        currentY += maxRowHeight + CHILD_ROW_VERTICAL_GAP;
      });
      totalHeight = currentY;
    }
    
    totalHeight += VERTICAL_SPACING; // Bottom padding

    setLayoutMetrics({
      positions,
      width: layoutWidth,
      height: totalHeight,
    });
  }, [focusNodeData, parentNodeData, childrenDims, siblingsDims, viewportWidth]);
  
  return layoutMetrics;
};