
import React from 'react';

const CollapsiblePanel = ({
  panelId,
  title,
  icon,
  isCollapsed,
  onToggle,
  children,
  headerActions,
}) => {

  const handleHeaderKeyDown = (event) => {
    // Allow panel to be toggled with Enter/Space when the header itself is focused.
    if (event.key === 'Enter' || event.key === ' ') {
      // Check if the event target is the header itself, not an interactive child.
      if (event.target === event.currentTarget) {
        event.preventDefault();
        onToggle(panelId);
      }
    }
  };

  const panelClasses = `panel ${isCollapsed ? 'collapsed' : ''}`;

  return (
    React.createElement("div", { className: panelClasses },
      React.createElement("div", {
        className: "collapsible-panel-header",
        onClick: () => onToggle(panelId),
        onKeyDown: handleHeaderKeyDown,
        role: "button",
        "aria-expanded": !isCollapsed,
        "aria-controls": `${panelId}-content`,
        tabIndex: 0,
        title: `${isCollapsed ? 'Expand' : 'Collapse'} ${title}`
      },
        icon && React.createElement("span", { className: "panel-header-icon", "aria-hidden": "true" }, icon),
        React.createElement("h3", null, title),
        React.createElement("div", { 
          className: "panel-header-actions",
          onClick: (e) => e.stopPropagation() // Prevent actions from toggling the panel
        },
            headerActions
        ),
        React.createElement("button", {
          className: `panel-toggle-button ${isCollapsed ? 'collapsed' : ''}`,
          "aria-label": `${isCollapsed ? 'Expand' : 'Collapse'} ${title}`,
          onClick: (e) => {
            e.stopPropagation(); // Stop this event from bubbling to the header...
            onToggle(panelId);   // ...and toggle the panel directly.
          },
        },
          React.createElement("svg", { viewBox: "0 0 24 24", fill: "currentColor", width: "1em", height: "1em", style: { display: 'block', pointerEvents: 'none' } },
            React.createElement("path", { d: "M7.41 8.59 12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z" })
          )
        )
      ),
      React.createElement("div", {
        id: `${panelId}-content`,
        className: `panel-content-wrapper ${isCollapsed ? 'collapsed' : ''}`
      },
        children
      )
    )
  );
};

export default CollapsiblePanel;
