
import React, { useEffect, useRef } from 'react';
import PathToRootDisplay from './PathToRootDisplay.js';

const OverlayPanelView = ({
  title,
  isOpen,
  onClosePanel,
  children,
  isResizable = true, 
  showCloseButton = true,
  customHeaderActions,
  pathDisplayProps,
  onRestoreFocus, 
}) => {
  const panelRef = useRef(null);
  const closeButtonRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      const focusTarget = closeButtonRef.current || panelRef.current;
      // Set focus inside the panel when it opens for accessibility.
      setTimeout(() => focusTarget?.focus(), 50); 
      
      const handleEscape = (event) => {
        if (event.key === 'Escape') {
            onClosePanel(); 
        }
      };
      document.addEventListener('keydown', handleEscape);

      // Cleanup function to run when the panel is closing.
      return () => {
        document.removeEventListener('keydown', handleEscape);
        // Restore focus to the element that opened the panel.
        if (onRestoreFocus) {
          onRestoreFocus();
        }
      };
    }
  }, [isOpen, onClosePanel, onRestoreFocus]);


  return (
    React.createElement("aside", {
      ref: panelRef,
      className: `overlay-panel-view ${isOpen ? 'visible' : ''}`, 
      role: "dialog", 
      "aria-modal": isOpen, 
      "aria-labelledby": "overlay-panel-title",
      hidden: !isOpen, 
      tabIndex: isOpen ? -1 : undefined 
    },
      React.createElement("div", { className: "overlay-panel-header" },
        React.createElement("div", { className: "overlay-panel-header-main" },
            React.createElement("h3", { id: "overlay-panel-title", style: { color: 'var(--primary-accent)', margin: 0 }}, title),
            pathDisplayProps && React.createElement(PathToRootDisplay, { ...pathDisplayProps })
        ),
        React.createElement("div", { className: "overlay-panel-header-actions", style: {display: 'flex', gap: '8px', alignItems: 'center'}},
            customHeaderActions,
            showCloseButton && (
                React.createElement("button", {
                    ref: closeButtonRef,
                    onClick: onClosePanel,
                    className: "base-icon-button",
                    "aria-label": `Close ${title} panel`,
                    title: `Close ${title} panel`
                },
                    "×"
                )
            )
        )
      ),
      React.createElement("div", { className: "overlay-panel-content" },
        children
      )
    )
  );
};

export default OverlayPanelView;
