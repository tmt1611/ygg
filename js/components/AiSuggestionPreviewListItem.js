
import React from 'react';
// import { TechTreeNode } from '../types.js'; // Types removed

const AiSuggestionPreviewListItem = ({ node, level, isVisualDiff = false }) => {
  let itemStyle = { 
    padding: '4px 6px', // Reduced padding
    margin: '2px 0',    // Reduced margin
    borderRadius: 'var(--border-radius)',
    border: '1px solid transparent',
    marginLeft: isVisualDiff ? `${level * 15}px` : `${level * 16}px`, // Further reduced indent for visual diff
    position: 'relative', 
    overflow: 'hidden', 
  };
  let changeStatusTextStyle = { color: 'var(--text-primary)', fontWeight: 'normal' };
  let titleText = node.description || node.name;
  let changeStatusIcon = { icon: '', color: 'var(--text-tertiary)'};

  let nodeNameStyle = { fontWeight: 500, fontSize: '0.85em' }; // Even smaller font

  switch (node._changeStatus) {
    case 'new':
      itemStyle.backgroundColor = 'var(--success-bg)';
      itemStyle.borderColor = 'var(--success-color)';
      changeStatusIcon = { icon: '➕', color: 'var(--success-color)' };
      changeStatusTextStyle.color = 'var(--success-color)';
      nodeNameStyle.color = 'var(--success-color)';
      titleText = "This node is newly added.";
      break;
    case 'content_modified':
      itemStyle.backgroundColor = 'var(--primary-accent-hover-bg)'; 
      itemStyle.borderColor = 'var(--primary-accent-light)';
      changeStatusIcon = { icon: '✏️', color: 'var(--primary-accent)' };
      changeStatusTextStyle.color = 'var(--primary-accent)';
      nodeNameStyle.color = 'var(--primary-accent-dark)';
      titleText = "Name, description, importance, or link of this unlocked node has changed.";
      break;
    case 'structure_modified':
      itemStyle.backgroundColor = 'var(--panel-alt-bg)'; 
      itemStyle.borderColor = 'var(--secondary-accent-dark)';
      changeStatusIcon = { icon: '📂', color: 'var(--secondary-accent-dark)' };
      changeStatusTextStyle.color = 'var(--secondary-accent-dark)';
      titleText = "The direct children of this node have changed (added, removed, or reordered).";
      break;
    case 'reparented':
      itemStyle.backgroundColor = 'var(--warning-bg)';
      itemStyle.borderColor = 'var(--warning-color)';
      changeStatusIcon = { icon: '↪️', color: 'var(--warning-color)' };
      changeStatusTextStyle.color = 'var(--warning-color)';
      nodeNameStyle.color = 'var(--text-primary)'; 
      titleText = `This node has been moved. Original parent ID: ${node._oldParentId || 'root'}.`;
      break;
    case 'locked_content_changed':
      itemStyle.backgroundColor = 'var(--error-bg)';
      itemStyle.borderColor = 'var(--error-color)';
      changeStatusIcon = { icon: '❗', color: 'var(--error-color)' };
      changeStatusTextStyle.color = 'var(--error-color)';
      nodeNameStyle.color = 'var(--error-color)';
      nodeNameStyle.fontWeight = 'bold';
      titleText = "CRITICAL: Content of this LOCKED node was modified by AI!";
      break;
    case 'removed': 
      itemStyle.backgroundColor = 'rgba(220, 53, 69, 0.1)'; 
      itemStyle.borderColor = 'var(--error-color)';
      itemStyle.opacity = 0.7;
      changeStatusIcon = { icon: '➖', color: 'var(--error-color)' };
      nodeNameStyle.textDecoration = 'line-through';
      nodeNameStyle.color = 'var(--error-color)';
      titleText = "This node was marked for removal but still appears in suggested tree structure (potential error).";
      break;
    case 'unchanged':
    default:
      itemStyle.border = '1px solid var(--border-color)'; 
      break;
  }
  const nodeImportanceText = node.importance ? ` (${node.importance.charAt(0).toUpperCase()})` : '';
  const linkedProjectText = node.linkedProjectId && node.linkedProjectName ? ` (🔗)` : '';

  return (
    React.createElement("li", { style: { listStyle: 'none' }, "aria-label": `Node: ${node.name}, Change Status: ${node._changeStatus || 'Unchanged'}`}, 
      React.createElement("div", { style: itemStyle, title: titleText },
        React.createElement("div", { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'nowrap', gap: '5px' }},
            React.createElement("span", { style: { ...nodeNameStyle, flexShrink: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '5px' }},
              changeStatusIcon.icon && React.createElement("span", { style: { color: changeStatusIcon.color, fontSize: '1.1em'}, "aria-hidden": "true" }, changeStatusIcon.icon),
              node.isLocked && React.createElement("span", { style: { color: node._changeStatus === 'locked_content_changed' ? 'var(--error-color)' : 'var(--text-tertiary)'}, title: "Locked" }, "🔒"),
              node.name
            ),
            React.createElement("span", { style: { fontSize: '0.8em', color: 'var(--text-secondary)', marginLeft: 'auto', whiteSpace: 'nowrap', flexShrink: 0 }},
                nodeImportanceText,
                linkedProjectText
            )
        ),
        node.description && (
          React.createElement("p", { style: { fontSize: '0.75em', color: 'var(--text-secondary)', marginTop: '2px', marginBottom: '1px', whiteSpace: 'pre-wrap', wordBreak: 'break-word', paddingLeft: '22px', opacity: 0.9 }},
            node.description
          )
        ),
        node._modificationDetails && node._modificationDetails.length > 0 && isVisualDiff && (
          React.createElement("ul", { style: { listStyle: 'disc', listStylePosition: 'inside', marginLeft: '15px', marginTop: '4px', fontSize: '0.75em', color: 'var(--text-tertiary)' }},
            node._modificationDetails.map((detail, index) => (
              React.createElement("li", { key: index, style: { lineHeight: '1.3', marginBottom: '2px' }}, detail)
            ))
          )
        )
      ),
      isVisualDiff && node.children && node.children.length > 0 && (
        React.createElement("ul", { style: { marginTop: '0px', paddingLeft: '0px' }},
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
