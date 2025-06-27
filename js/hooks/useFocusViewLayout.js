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

  // Memoize child node dimensions to avoid recalculating on every render
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
    const centerX = viewportWidth / 2;

    const parentSize = parentNodeData ? NODE_SIZES_PX[parentNodeData.importance || 'common'] : { width: 0, height: 0 };
    const focusSize = {
        width: NODE_SIZES_PX[focusNodeData.importance || 'common'].width * FOCUS_NODE_SCALE,
        height: NODE_SIZES_PX[focusNodeData.importance || 'common'].height * FOCUS_NODE_SCALE,
    };

    const parentY = parentNodeData ? VERTICAL_SPACING : 0;
    if (parentNodeData) {
      positions.set(parentNodeData.id, { x: centerX, y: parentY + parentSize.height / 2, ...parentSize });
    }

    const focusLevelY = parentNodeData 
      ? parentY + parentSize.height + VERTICAL_SPACING
      : VERTICAL_SPACING;
    
    const maxFocusLevelHeight = Math.max(focusSize.height, ...siblingsDims.map(d => d.height), 0);
    const focusLevelCenterY = focusLevelY + maxFocusLevelHeight / 2;

    // Place focus node first
    positions.set(focusNodeData.id, { x: centerX, y: focusLevelCenterY, ...focusSize });

    // Place siblings
    const leftSiblings = siblingsDims.filter((_, i) => i % 2 === 0);
    const rightSiblings = siblingsDims.filter((_, i) => i % 2 !== 0);

    let currentX_left = centerX - focusSize.width / 2 - HORIZONTAL_CHILD_GAP;
    leftSiblings.reverse().forEach(siblingDim => {
      positions.set(siblingDim.id, {
        x: currentX_left - siblingDim.width / 2,
        y: focusLevelCenterY,
        ...siblingDim
      });
      currentX_left -= (siblingDim.width + HORIZONTAL_CHILD_GAP);
    });

    let currentX_right = centerX + focusSize.width / 2 + HORIZONTAL_CHILD_GAP;
    rightSiblings.forEach(siblingDim => {
      positions.set(siblingDim.id, {
        x: currentX_right + siblingDim.width / 2,
        y: focusLevelCenterY,
        ...siblingDim
      });
      currentX_right += (siblingDim.width + HORIZONTAL_CHILD_GAP);
    });
    
    let totalHeight = focusLevelY + maxFocusLevelHeight + VERTICAL_SPACING;

    // Children layout logic
    if (childrenDims.length > 0) {
      let currentY = focusLevelY + maxFocusLevelHeight + VERTICAL_SPACING;
      const availableWidth = Math.max(300, viewportWidth * 0.95);
      
      const rows = [];
      let currentRow = [];
      let currentRowWidth = 0;
      
      childrenDims.forEach(childDim => {
        const requiredWidth = childDim.width + (currentRow.length > 0 ? HORIZONTAL_CHILD_GAP : 0);
        if (currentRow.length > 0 && currentRowWidth + requiredWidth > availableWidth) {
          rows.push(currentRow);
          currentRow = [childDim];
          currentRowWidth = childDim.width;
        } else {
          currentRow.push(childDim);
          currentRowWidth += requiredWidth;
        }
      });
      if (currentRow.length > 0) rows.push(currentRow);

      rows.forEach(row => {
        const maxRowHeight = Math.max(...row.map(d => d.height), 0);
        const rowCenterY = currentY + maxRowHeight / 2;
        const totalRowWidth = row.reduce((sum, dim) => sum + dim.width, 0) + (row.length - 1) * HORIZONTAL_CHILD_GAP;
        let currentX = centerX - totalRowWidth / 2;
        
        row.forEach(childDim => {
          positions.set(childDim.id, {
            x: currentX + childDim.width / 2,
            y: rowCenterY,
            ...childDim,
          });
          currentX += childDim.width + HORIZONTAL_CHILD_GAP;
        });
        currentY += maxRowHeight + CHILD_ROW_VERTICAL_GAP;
      });
      totalHeight = currentY;
    }
    
    // Add some padding at the bottom
    totalHeight += VERTICAL_SPACING;

    setLayoutMetrics({
      positions,
      width: viewportWidth,
      height: totalHeight,
    });

  }, [focusNodeData, parentNodeData, childrenDims, siblingsDims, viewportWidth]);
  
  return layoutMetrics;
};