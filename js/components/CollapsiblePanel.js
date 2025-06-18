
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
    // Let clicks on buttons inside actions be handled by their own logic
    if (e.target.closest('button, a')) {
        if(e.target.closest('.panel-toggle-button')) {
             onToggle(panelId);
        }
        return;
    }
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

  return (
    React.createElement("div", { className: "panel" },
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
        React.createElement("h3", null, title),
        React.createElement("div", { className: "panel-header-actions" },
            headerActions,
            React.createElement("button", {
              className: `panel-toggle-button base-icon-button ${isCollapsed ? 'collapsed' : ''}`,
              "aria-label": `${isCollapsed ? 'Expand' : 'Collapse'} ${title}`,
            },
              React.createElement("svg", { viewBox: "0 0 24 24", fill: "currentColor", width: "1em", height: "1em", style: { display: 'block', pointerEvents: 'none' } },
                React.createElement("path", { d: "M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6z" })
              )
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
