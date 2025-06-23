import React, { useState } from 'react';

const DiffDetail = ({ detail }) => {
  const renderValue = (value) => {
    if (value === null || value === undefined || value === '') {
      return React.createElement("i", { style: { opacity: 0.7 } }, "(empty)");
    }
    const strValue = String(value);
    return strValue.length > 70 ? `${strValue.substring(0, 67)}...` : strValue;
  };

  return (
    React.createElement("li", { className: "diff-details-item" },
      React.createElement("strong", null, detail.label, ":"),
      detail.type === 'critical' ? (
        React.createElement("span", { className: "diff-to", style: { fontWeight: 'bold' } }, detail.to)
      ) : (
        React.createElement("span", null,
          React.createElement("span", { className: "diff-from" }, renderValue(detail.from)),
          React.createElement("span", { className: "diff-arrow" }, " → "),
          React.createElement("span", { className: "diff-to" }, renderValue(detail.to))
        )
      )
    )
  );
};


const AiSuggestionPreviewListItem = ({ node, level, isVisualDiff = false }) => {
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);

  const hasLongDescription = node.description && node.description.length > 120; // Set a threshold for when to collapse
  const isDescriptionEffectivelyCollapsed = hasLongDescription && !isDescriptionExpanded;

  const changeStatusMap = {
    new: { icon: '➕', title: "This node is newly added." },
    content_modified: { icon: '✏️', title: "Name, description, importance, or link of this unlocked node has changed." },
    structure_modified: { icon: '📂', title: "The direct children of this node have changed (added, removed, or reordered)." },
    reparented: { icon: '↪️', title: `This node has been moved. Original parent ID: ${node._oldParentId || 'root'}.` },
    locked_content_changed: { icon: '❗', title: "CRITICAL: Content of this LOCKED node was modified by AI!" },
    removed: { icon: '➖', title: "This node and its children will be removed from the tree." },
    unchanged: { icon: '', title: node.description || node.name }
  };

  const { icon: changeStatusIcon, title: titleText } = changeStatusMap[node._changeStatus] || changeStatusMap.unchanged;
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
          React.createElement("div", { className: "diff-list-item-desc-wrapper" },
            hasLongDescription && (
              React.createElement("button", {
                className: "diff-list-item-desc-toggle",
                onClick: (e) => { e.stopPropagation(); setIsDescriptionExpanded(!isDescriptionExpanded); },
                "aria-expanded": isDescriptionExpanded
              },
                isDescriptionExpanded ? "Show less" : "Show full description..."
              )
            ),
            React.createElement("div", { className: `diff-list-item-desc ${isDescriptionEffectivelyCollapsed ? 'collapsed' : ''}` },
              node.description
            )
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
              node: (node._changeStatus === 'removed') ? {...child, _changeStatus: 'removed'} : child,
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