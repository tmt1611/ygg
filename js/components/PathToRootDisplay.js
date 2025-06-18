
import React from 'react';
import { getAncestorIds, findNodeById } from '../utils.js'; 

const PathToRootDisplay = ({
  treeData,
  currentNodeId,
  onSelectPathNode,
  pathContext,
}) => {
  if (!treeData || !currentNodeId) {
    return React.createElement("div", { className: "path-to-root-display" }, React.createElement("span", null, "Not available."));
  }

  const ancestorIds = getAncestorIds(currentNodeId, treeData);
  const pathNodes = [];

  if (treeData && ancestorIds.length > 0) {
    ancestorIds.forEach(id => {
      const node = findNodeById(treeData, id);
      if (node) pathNodes.push(node);
    });
  }
  
  const currentNodeDetails = findNodeById(treeData, currentNodeId);
  if (currentNodeDetails) {
    if (!pathNodes.length || pathNodes[pathNodes.length -1]?.id !== currentNodeDetails.id) {
        pathNodes.push(currentNodeDetails);
    }
  }


  if (pathNodes.length === 0) {
     const title = pathContext === 'stellar' ? "Current Location: Sector Core" : "Current Location: Root";
    return React.createElement("div", { className: "path-to-root-display" }, React.createElement("span", null, title));
  }

  const pathTitle = pathContext === 'stellar' ? "Route:" : "Path:";

  return (
    React.createElement("div", { className: "path-to-root-display", "aria-label": "Navigation path to current object" },
      React.createElement("strong", { style: { marginRight: '5px', color: 'var(--text-secondary)', flexShrink: 0 }}, pathTitle),
      pathNodes.map((node, index) => (
        React.createElement(React.Fragment, { key: node.id },
          React.createElement("span", {
            onClick: () => onSelectPathNode(node.id),
            onKeyDown: (e) => { if (e.key === 'Enter' || e.key === ' ') onSelectPathNode(node.id); },
            role: "button",
            tabIndex: 0,
            title: `Navigate to: ${node.name}`,
            "aria-current": node.id === currentNodeId ? "page" : undefined,
            className: `path-segment ${node.id === currentNodeId ? 'current-focus-path-node' : ''}`
          },
            node.name
          ),
          index < pathNodes.length - 1 && React.createElement("span", { className: "path-separator", "aria-hidden": "true" }, ">")
        )
      ))
    )
  );
};

export default React.memo(PathToRootDisplay);
