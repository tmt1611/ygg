
import React from 'react';
// import { TechTreeNode } from '../types.js'; // Types removed

const GraphSelectedNodePanel = ({ selectedNode }) => {
  if (!selectedNode) {
    return null; 
  }

  return (
    React.createElement("aside", { className: "graph-view-selected-node-panel", style: { padding: '10px', border: '1px solid var(--border-color)', margin: '10px' }},
      React.createElement("h4", null, "Selected: ", selectedNode.name),
      React.createElement("p", null, selectedNode.description || "No description.")
    )
  );
};

export default GraphSelectedNodePanel;
