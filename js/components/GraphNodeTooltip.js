import React from 'react';
import { NODE_IMPORTANCE_OPTIONS } from '../constants.js';

const GraphNodeTooltip = ({ tooltip }) => {
  const { visible, content, position } = tooltip;

  if (!visible || !content) {
    return null;
  }

  const { name, description, importance, isLocked, children, linkedProjectName } = content;
  const importanceInfo = NODE_IMPORTANCE_OPTIONS.find(opt => opt.value === (importance || 'common')) || {};

  return (
    React.createElement("div", {
      className: `graph-node-tooltip ${visible ? 'visible' : ''}`,
      style: {
        top: `${position.y}px`,
        left: `${position.x}px`,
      }
    },
      React.createElement("div", { className: "graph-node-tooltip-header" },
        React.createElement("span", { className: "graph-node-tooltip-icon" }, importanceInfo.rune || '•'),
        React.createElement("h4", { className: "graph-node-tooltip-name" }, name)
      ),
      React.createElement("div", { className: "graph-node-tooltip-meta" },
        isLocked && React.createElement("span", { className: "graph-node-tooltip-meta-item" }, "🔒 Locked"),
        React.createElement("span", { className: "graph-node-tooltip-meta-item" }, "Importance: ", importanceInfo.label || 'Common'),
        children && React.createElement("span", { className: "graph-node-tooltip-meta-item" }, "Children: ", children.length),
        linkedProjectName && React.createElement("span", { className: "graph-node-tooltip-meta-item" }, "🔗 ", linkedProjectName)
      ),
      React.createElement("p", { className: "graph-node-tooltip-description" },
        description || React.createElement("i", null, "No description provided.")
      ),
      React.createElement("div", { className: "graph-node-tooltip-footer" },
        "Double-click for Focus View"
      )
    )
  );
};

export default GraphNodeTooltip;