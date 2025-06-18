import React from 'react';

const DiffDetail = ({ detail }) => {
  const renderValue = (value) => {
    if (value === null || value === undefined || value === '') {
      return React.createElement("i", null, "(empty)");
    }
    const strValue = String(value);
    return strValue.length > 70 ? `${strValue.substring(0, 67)}...` : strValue;
  };

  return (
    React.createElement("li", { className: "diff-details-item" },
      React.createElement("strong", null, detail.label, ":"),
      detail.type === 'critical' ? (
        React.createElement("span", { className: "diff-to" }, detail.to)
      ) : (
        React.createElement(React.Fragment, null,
          React.createElement("span", { className: "diff-from" }, renderValue(detail.from)),
          React.createElement("span", { className: "diff-arrow" }, "→"),
          React.createElement("span", { className: "diff-to" }, renderValue(detail.to))
        )
      )
    )
  );
};


const AiSuggestionPreviewListItem = ({ node, level, isVisualDiff = false }) => {
  let titleText = node.description || node.name;
  let changeStatusIcon = '';

  switch (node._changeStatus) {
    case 'new':
      changeStatusIcon = '➕';
      titleText = "This node is newly added.";
      break;
    case 'content_modified':
      changeStatusIcon = '✏️';
      titleText = "Name, description, importance, or link of this unlocked node has changed.";
      break;
    case 'structure_modified':
      changeStatusIcon = '📂';
      titleText = "The direct children of this node have changed (added, removed, or reordered).";
      break;
    case 'reparented':
      changeStatusIcon = '↪️';
      titleText = `This node has been moved. Original parent ID: ${node._oldParentId || 'root'}.`;
      break;
    case 'locked_content_changed':
      changeStatusIcon = '❗';
      titleText = "CRITICAL: Content of this LOCKED node was modified by AI!";
      break;
    case 'removed': 
      changeStatusIcon = '➖';
      titleText = "This node was marked for removal but still appears in suggested tree structure (potential error).";
      break;
    default:
      break;
  }
  const nodeImportanceText = node.importance ? ` (${node.importance.charAt(0).toUpperCase()})` : '';
  const linkedProjectText = node.linkedProjectId && node.linkedProjectName ? ` (🔗)` : '';
  
  const itemClassName = `diff-list-item status-${node._changeStatus || 'unchanged'}`;
  const itemStyle = {
    marginLeft: `${level * 18}px`,
  };

  return (
    React.createElement("li", { style: { listStyle: 'none' }, "aria-label": `Node: ${node.name}, Change Status: ${node._changeStatus || 'Unchanged'}`}, 
      React.createElement("div", { style: itemStyle, className: itemClassName, title: titleText },
        React.createElement("div", { className: "diff-list-item-header" },
            React.createElement("span", { className: "diff-list-item-name-section" },
              changeStatusIcon && React.createElement("span", { className: "diff-change-icon", "aria-hidden": "true" }, changeStatusIcon),
              node.isLocked && React.createElement("span", { className: "diff-lock-icon", title: "Locked" }, "🔒"),
              node.name
            ),
            React.createElement("span", { className: "diff-list-item-meta" },
                nodeImportanceText,
                linkedProjectText
            )
        ),
        node.description && (
          React.createElement("p", { className: "diff-list-item-desc" },
            node.description
          )
        ),
        node._modificationDetails && node._modificationDetails.length > 0 && isVisualDiff && (
          React.createElement("ul", { className: "diff-details-list" },
            node._modificationDetails.map((detail, index) => (
              React.createElement(DiffDetail, { key: index, detail: detail })
            ))
          )
        )
      ),
      isVisualDiff && node.children && node.children.length > 0 && (
        React.createElement("ul", { className: "diff-list-child-container" },
          node.children.map(child => (
            React.createElement(AiSuggestionPreviewListItem, {
              key: `${child.id}-${child._changeStatus || 'child'}-${level+1}`,
              node: child,
              level: level + 1,
              isVisualDiff: true 
            })
          ))
        )
      )
    )
  );
};

export default AiSuggestionPreviewListItem;