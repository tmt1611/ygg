import { useState, useEffect } from 'react';

const NODE_SIZES_PX = {
    minor: { width: 60, height: 60 },
    common: { width: 90, height: 90 },
    major: { width: 130, height: 130 },
};
const FOCUS_NODE_SCALE = 1.15;
const VERTICAL_SPACING = 40;
const HORIZONTAL_CHILD_GAP = 25;
const CHILD_ROW_VERTICAL_GAP = 30;

export const useFocusViewLayout = (
  layoutRef,
  focusNodeData,
  parentNodeData,
  childrenNodeData
) => {
  const [layoutMetrics, setLayoutMetrics] = useState({ positions: new Map(), width: 0, height: 0 });
  const [viewportSize, setViewportSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const element = layoutRef.current;
    if (!element) return;
    
    const resizeObserver = new ResizeObserver(entries => {
        for (let entry of entries) {
            setViewportSize({ width: entry.contentRect.width, height: entry.contentRect.height });
        }
    });
    
    resizeObserver.observe(element);
    
    // Set initial size
    setViewportSize({ width: element.clientWidth, height: element.clientHeight });

    return () => {
        if (element) {
            resizeObserver.unobserve(element);
        }
    };
  }, [layoutRef]);

  useEffect(() => {
    if (!focusNodeData || viewportSize.width === 0) {
        setLayoutMetrics({ positions: new Map(), width: 0, height: 0 });
        return;
    };

    const positions = new Map();
    
    // Calculate vertical starting points
    const parentSize = parentNodeData ? NODE_SIZES_PX[parentNodeData.importance || 'common'] : { width: 0, height: 0 };
    const focusSize = NODE_SIZES_PX[focusNodeData.importance || 'common'];

    const parentY = parentNodeData ? VERTICAL_SPACING + parentSize.height / 2 : 0;
    const scaledFocusHeight = focusSize.height * FOCUS_NODE_SCALE;
    const focusY = parentY + (parentNodeData ? parentSize.height / 2 + VERTICAL_SPACING : VERTICAL_SPACING) + scaledFocusHeight / 2;
    
    let totalHeight = focusY + scaledFocusHeight / 2 + VERTICAL_SPACING;

    // Position parent and focus nodes
    const centerX = viewportSize.width / 2;
    if (parentNodeData) {
        positions.set(parentNodeData.id, { x: centerX, y: parentY, width: parentSize.width, height: parentSize.height });
    }
    positions.set(focusNodeData.id, { x: centerX, y: focusY, width: focusSize.width * FOCUS_NODE_SCALE, height: scaledFocusHeight });

    // Position Children Nodes (with wrapping logic)
    if (childrenNodeData && childrenNodeData.length > 0) {
        let currentY = focusY + scaledFocusHeight / 2 + VERTICAL_SPACING;
        const availableWidth = viewportSize.width * 0.95;

        const rows = [];
        let currentRow = [];
        let currentRowWidth = 0;

        // Group nodes into rows based on available width
        childrenNodeData.forEach(child => {
            const childSize = NODE_SIZES_PX[child.importance || 'common'];
            const nodeWidthWithGap = childSize.width + (currentRow.length > 0 ? HORIZONTAL_CHILD_GAP : 0);

            if (currentRow.length > 0 && currentRowWidth + nodeWidthWithGap > availableWidth) {
                rows.push(currentRow);
                currentRow = [child];
                currentRowWidth = childSize.width;
            } else {
                currentRow.push(child);
                currentRowWidth += nodeWidthWithGap;
            }
        });
        if (currentRow.length > 0) {
            rows.push(currentRow);
        }

        // Place the generated rows
        rows.forEach(row => {
            const totalRowWidth = row.reduce((sum, child) => sum + NODE_SIZES_PX[child.importance || 'common'].width, 0) + (row.length - 1) * HORIZONTAL_CHILD_GAP;
            let currentX = centerX - totalRowWidth / 2;
            let maxChildHeightInRow = 0;

            row.forEach(child => {
                const childSize = NODE_SIZES_PX[child.importance || 'common'];
                maxChildHeightInRow = Math.max(maxChildHeightInRow, childSize.height);
                positions.set(child.id, {
                    x: currentX + childSize.width / 2,
                    y: currentY + childSize.height / 2,
                    width: childSize.width,
                    height: childSize.height
                });
                currentX += childSize.width + HORIZONTAL_CHILD_GAP;
            });
            currentY += maxChildHeightInRow + CHILD_ROW_VERTICAL_GAP;
        });

        totalHeight = currentY;
    }

    setLayoutMetrics({
        positions,
        width: viewportSize.width,
        height: Math.max(totalHeight, viewportSize.height),
    });
  }, [focusNodeData, parentNodeData, childrenNodeData, viewportSize]);
  
  return layoutMetrics;
};