
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
  const handleHeaderClick = () => {
    onToggle(panelId);
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onToggle(panelId);
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
        title: `Click to ${isCollapsed ? 'expand' : 'collapse'} ${title}`
      },
        icon && React.createElement("span", { className: "panel-header-icon", "aria-hidden": "true" }, icon),
        React.createElement("h3", null, title),
        headerActions && React.createElement("div", { className: "panel-header-actions", onClick: (e)=> e.stopPropagation()}, headerActions),
        React.createElement("button", {
          className: `panel-toggle-button ${isCollapsed ? 'collapsed' : ''}`,
          "aria-hidden": "true", 
          tabIndex: -1,      
          onClick: (e) => { e.stopPropagation(); handleHeaderClick();} 
        },
          React.createElement("svg", { viewBox: "0 0 24 24", fill: "currentColor", "aria-hidden": "true" },
            React.createElement("path", { d: "M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6z" })
          )
        )
      ),
      React.createElement("div", {
        id: `${panelId}-content`,
        className: `panel-content-wrapper ${isCollapsed ? 'collapsed' : ''}`,
        "aria-hidden": isCollapsed
      },
        children
      )
    )
  );
};

export default CollapsiblePanel;
