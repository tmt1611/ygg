
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
  const handleHeaderClick = (e) => {
    // Prevent toggling when clicking on an action button inside the header
    if (e.target.closest('.panel-header-actions')) return;
    onToggle(panelId);
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      if (document.activeElement === event.currentTarget) {
          event.preventDefault();
          onToggle(panelId);
      }
    }
  };

  const panelClasses = `collapsible-panel-root ${isCollapsed ? 'is-collapsed' : 'is-expanded'}`;

  return (
    React.createElement("div", { className: panelClasses }, 
      React.createElement("div", {
        className: "collapsible-panel-header",
        onClick: handleHeaderClick,
        onKeyDown: handleKeyDown,
        role: "button",
        "aria-expanded": !isCollapsed,
        "aria-controls": `${panelId}-content`,
        tabIndex: 0,
        title: `${isCollapsed ? 'Expand' : 'Collapse'} ${title}`
      },
        icon && React.createElement("span", { className: "panel-header-icon", "aria-hidden": "true" }, icon),
        React.createElement("h3", { className: "collapsible-panel-title"}, title),
        React.createElement("div", { className: "panel-header-actions-wrapper"},
            headerActions && React.createElement("div", { className: "panel-header-actions"}, headerActions),
            React.createElement("span", {
              className: `panel-toggle-icon`,
              "aria-hidden": "true", 
            },
              React.createElement("svg", { viewBox: "0 0 24 24", fill: "currentColor", "aria-hidden": "true" },
                React.createElement("path", { d: "M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6z" })
              )
            )
        )
      ),
      React.createElement("div", {
        id: `${panelId}-content`,
        className: `panel-content-wrapper ${isCollapsed ? 'collapsed' : ''}`,
        "aria-hidden": isCollapsed
      },
        React.createElement("div", { className: "panel-content-inner" },
            children
        )
      )
    )
  );
};

export default CollapsiblePanel;
