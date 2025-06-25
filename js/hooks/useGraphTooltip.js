import { useState, useCallback, useRef } from 'react';

const TOOLTIP_DELAY = 300; // ms
const TOOLTIP_OFFSET = 15; // px

export const useGraphTooltip = () => {
  const [tooltip, setTooltip] = useState({
    visible: false,
    content: null,
    parent: null,
    position: { x: 0, y: 0 },
  });
  const hoverTimeoutRef = useRef(null);

  const showTooltip = useCallback((nodeData, event, parentData = null) => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }

    hoverTimeoutRef.current = setTimeout(() => {
      const { clientX, clientY } = event;
      
      // Basic positioning logic
      let x = clientX + TOOLTIP_OFFSET;
      let y = clientY + TOOLTIP_OFFSET;

      // Adjust if tooltip goes off-screen
      const tooltipWidth = 280; // from CSS
      const tooltipHeight = 150; // estimated
      if (x + tooltipWidth > window.innerWidth) {
        x = clientX - tooltipWidth - TOOLTIP_OFFSET;
      }
      if (y + tooltipHeight > window.innerHeight) {
        y = clientY - tooltipHeight - TOOLTIP_OFFSET;
      }

      setTooltip({
        visible: true,
        content: nodeData,
        parent: parentData,
        position: { x, y },
      });
    }, TOOLTIP_DELAY);
  }, []);

  const hideTooltip = useCallback(() => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    setTooltip(prev => ({ ...prev, visible: false }));
  }, []);

  return {
    tooltip,
    showTooltip,
    hideTooltip,
  };
};