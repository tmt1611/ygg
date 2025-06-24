import React from 'react';

const CollapsiblePanel = ({
  panelId,
  title,
  icon,
  isCollapsed,
  onToggle,
  children,
  headerActions,
  variant = 'workspace' // 'workspace' or 'sidebar'
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

  const panelClasses = `panel panel-variant-${variant} ${isCollapsed ? 'collapsed' : ''}`;

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
          // The onClick is inherited from the header, no need to stop propagation or define it here.
          // This makes the button a part of the larger clickable header area.
          tabIndex: -1, // Prevent tabbing to this button since the header is already focusable.
          "aria-hidden": "true" // The whole header is the button, so this is decorative.
        },
          "›"
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