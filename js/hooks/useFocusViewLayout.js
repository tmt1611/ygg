import { useState, useEffect }from 'react';

const NODE_SIZES_PX = {
    minor: { width: 60, height: 60 },
    common: { width: 90, height: 90 },
    major: { width: 130, height: 130 },
};
const FOCUS_NODE_SCALE = 1.15;
const VERTICAL_SPACING = 30;
const HORIZONTAL_CHILD_GAP = 20;
const CHILD_ROW_VERTICAL_GAP = 25;

export const useFocusViewLayout = (
  layoutRef,
  focusNodeData,
  parentNodeData,
  childrenNodeData
) => {
  const [allNodePositions, setAllNodePositions] = useState(new Map());
  const [layoutSize, setLayoutSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const element = layoutRef.current;
    if (!element) return;
    
    const resizeObserver = new ResizeObserver(entries => {
        for (let entry of entries) {
            setLayoutSize({ width: entry.contentRect.width, height: entry.contentRect.height });
        }
    });
    
    resizeObserver.observe(element);
    
    return () => {
        resizeObserver.unobserve(element);
    };
  }, [layoutRef]);

  useEffect(() => {
    if (!focusNodeData || layoutSize.width === 0 || layoutSize.height === 0) {
        setAllNodePositions(new Map()); // Clear positions if container is not ready
        return;
    };

    const layoutWidth = layoutSize.width;
    const layoutHeight = layoutSize.height;
    const positions = new Map();

    // Position Focus Node
    const focusSize = NODE_SIZES_PX[focusNodeData.importance || 'common'];
    const scaledFocusWidth = focusSize.width * FOCUS_NODE_SCALE;
    const scaledFocusHeight = focusSize.height * FOCUS_NODE_SCALE;
    const focusX = layoutWidth / 2;
    const focusY = layoutHeight * 0.35;
    positions.set(focusNodeData.id, { x: focusX, y: focusY, width: scaledFocusWidth, height: scaledFocusHeight });

    // Position Parent Node
    if (parentNodeData) {
        const parentSize = NODE_SIZES_PX[parentNodeData.importance || 'common'];
        const parentX = focusX;
        const parentY = focusY - (scaledFocusHeight / 2) - (parentSize.height / 2) - VERTICAL_SPACING;
        positions.set(parentNodeData.id, { x: parentX, y: parentY, width: parentSize.width, height: parentSize.height });
    }

    // Position Children Nodes (with wrapping)
    if (childrenNodeData.length > 0) {
        let currentY = focusY + (scaledFocusHeight / 2) + VERTICAL_SPACING;
        const maxRowWidth = layoutWidth * 0.9;
        let currentRow = [];
        let currentRowWidth = 0;

        const placeRow = (row, yPos) => {
            const totalRowWidth = row.reduce((sum, child) => sum + NODE_SIZES_PX[child.importance || 'common'].width, 0) + (row.length - 1) * HORIZONTAL_CHILD_GAP;
            let currentX = focusX - totalRowWidth / 2;
            let maxChildHeightInRow = 0;
            row.forEach(child => {
                const childSize = NODE_SIZES_PX[child.importance || 'common'];
                maxChildHeightInRow = Math.max(maxChildHeightInRow, childSize.height);
                positions.set(child.id, {
                    x: currentX + childSize.width / 2, y: yPos + childSize.height / 2,
                    width: childSize.width, height: childSize.height
                });
                currentX += childSize.width + HORIZONTAL_CHILD_GAP;
            });
            return maxChildHeightInRow;
        };

        for (const child of childrenNodeData) {
            const childSize = NODE_SIZES_PX[child.importance || 'common'];
            const potentialRowWidth = currentRowWidth + (currentRow.length > 0 ? HORIZONTAL_CHILD_GAP : 0) + childSize.width;
            if (currentRow.length > 0 && potentialRowWidth > maxRowWidth) {
                const rowHeight = placeRow(currentRow, currentY);
                currentY += rowHeight + CHILD_ROW_VERTICAL_GAP;
                currentRow = [child];
                currentRowWidth = childSize.width;
            } else {
                currentRow.push(child);
                currentRowWidth = potentialRowWidth;
            }
        }
        if (currentRow.length > 0) {
            placeRow(currentRow, currentY);
        }
    }

    setAllNodePositions(positions);
  }, [focusNodeData, parentNodeData, childrenNodeData, layoutSize]);
  
  return allNodePositions;
};