
import React, { useState, useEffect, useMemo } from 'react';
// import { TechTreeNode, NodeStatus, NodeEditModalConfig, Project } from '../types.js'; // Types removed
import ContextualHelpTooltip from './ContextualHelpTooltip.js';
// import { LinkSourceInfo } from '../hooks/useProjectLinking.js'; // Types removed

const NODE_STATUS_OPTIONS = [
    { value: 'small', label: 'Small', rune: '🌱' },
    { value: 'medium', label: 'Medium', rune: '🌿' },
    { value: 'large', label: 'Large', rune: '🌳' },
];

const FocusViewDetailPanel = ({
  node,
  isAppBusy,
  onNodeStatusChange,
  onToggleLock,
  onOpenNodeEditModal,
  onOpenLinkProjectModal,
  onNavigateToLinkedProject,
  onUnlinkProjectFromNode,
  onDeleteNode,
  onExitFocusView,
  isProjectRoot,
  incomingLinkInfo,
  handleNavigateToSourceNode,
}) => {
  const [editableName, setEditableName] = useState('');
  const [editableDescription, setEditableDescription] = useState('');

  useEffect(() => {
    if (node) {
      setEditableName(node.name);
      setEditableDescription(node.description || '');
    } else {
      setEditableName('');
      setEditableDescription('');
    }
  }, [node]);

  if (!node) {
    return (
      React.createElement("div", { className: "focus-view-detail-panel", role: "region", "aria-labelledby": "detail-panel-heading-placeholder" },
        React.createElement("h3", { id: "detail-panel-heading-placeholder", style: { margin: '0 0 15px 0', fontSize: '1.2em' }},
          "System Intel"
        ),
        React.createElement("p", { style: { textAlign: 'center', color: 'var(--focus-placeholder-text)' }},
          "Select a system component for detailed intel."
        ),
        React.createElement("button", { onClick: onExitFocusView, style: { marginTop: 'auto', width: '100%' }, className: "secondary" },
          "Exit Focus View"
        )
      )
    );
  }

  const handleSaveChanges = () => {
    if (node.name !== editableName.trim() || (node.description || '') !== editableDescription.trim()) {
      onOpenNodeEditModal({
        mode: 'editName',
        targetNodeId: node.id,
        currentNodeName: node.name,
        currentNodeDescription: node.description,
        title: `Confirm Edit: ${node.name}`,
        label: "Node Name",
        placeholder: "Enter node name",
        initialValue: editableName.trim(),
        initialDescription: editableDescription.trim(),
      });
    }
  };

  const handleDetailPanelNodeAction = (action) => {
    if (isAppBusy) return;
    action();
  };
  
  const nameChanged = node.name !== editableName.trim();
  const descriptionChanged = (node.description || '') !== editableDescription.trim();
  const hasUnsavedChanges = (nameChanged || descriptionChanged) && !node.isLocked;

  return (
    React.createElement("div", { className: "focus-view-detail-panel", role: "region", "aria-labelledby": "detail-panel-heading" },
      React.createElement("h3", { id: "detail-panel-heading", style: { margin: '0 0 15px 0', fontSize: '1.2em' }},
        "System Intel: ", node.name.substring(0, 25), node.name.length > 25 ? '...' : '',
        React.createElement(ContextualHelpTooltip, { helpText: "Details and actions for the selected celestial object. Click parent, focus, or child objects to change selection here." })
      ),

      React.createElement("div", { className: "form-group" },
        React.createElement("label", { htmlFor: "focus-node-name" }, "Designation:"),
        React.createElement("input", {
          type: "text",
          id: "focus-node-name",
          value: editableName,
          onChange: (e) => setEditableName(e.target.value),
          disabled: isAppBusy || node.isLocked
        })
      ),
      React.createElement("div", { className: "form-group" },
        React.createElement("label", { htmlFor: "focus-node-description" }, "Analysis:"),
        React.createElement("textarea", {
          id: "focus-node-description",
          value: editableDescription,
          onChange: (e) => setEditableDescription(e.target.value),
          rows: 4,
          disabled: isAppBusy || node.isLocked
        })
      ),
      hasUnsavedChanges && (
        React.createElement("button", { onClick: handleSaveChanges, disabled: isAppBusy, className: "primary", style: { width: '100%', marginBottom: '10px' }},
          "Save Detail Changes"
        )
      ),
      node.isLocked && React.createElement("p", { style: { fontSize: '0.85em', color: 'var(--warning-color)', textAlign: 'center' }}, "System details locked. Unlock to edit."),

      React.createElement("div", { className: "form-group" },
        React.createElement("label", { htmlFor: "focus-node-status" }, "System Size/Status:"),
        React.createElement("select", {
          id: "focus-node-status",
          value: node.status || 'medium',
          onChange: (e) => handleDetailPanelNodeAction(() => onNodeStatusChange(node.id, e.target.value)),
          disabled: isAppBusy || node.isLocked,
          className: `status-select status-${node.status || 'medium'}`
        },
          NODE_STATUS_OPTIONS.map(opt => React.createElement("option", { key: opt.value, value: opt.value }, opt.rune, " ", opt.label))
        )
      ),

      isProjectRoot && incomingLinkInfo && (
        React.createElement("div", { style: { fontSize: '0.9em', color: 'var(--text-tertiary)', marginBottom: '10px', padding: '5px', background: 'rgba(var(--focus-panel-text), 0.05)', borderRadius: 'var(--border-radius)' }},
          "↩️ Linked from: ", React.createElement("strong", null, incomingLinkInfo.sourceProjectName), " / \"", incomingLinkInfo.sourceNodeName, "\""
        )
      ),

      React.createElement("div", { className: "panel-button-group" },
        React.createElement("button", { onClick: () => handleDetailPanelNodeAction(() => onToggleLock(node.id)), disabled: isAppBusy },
          node.isLocked ? '🔓 Unlock System' : '🔒 Lock System'
        ),
        React.createElement("button", {
          onClick: () => handleDetailPanelNodeAction(() => onOpenNodeEditModal({
            mode: 'addChild', targetNodeId: node.id, parentNodeName: node.name,
            title: `Add Subsystem to: ${node.name}`, label: 'New Subsystem Name', placeholder: 'Enter name'
          })),
          disabled: isAppBusy
        },
          React.createElement("span", { className: "button-icon" }, "➕"), " Add Subsystem"
        ),

        node.linkedProjectId && onNavigateToLinkedProject && (
          React.createElement("button", { onClick: () => handleDetailPanelNodeAction(() => onNavigateToLinkedProject(node.linkedProjectId)), disabled: isAppBusy },
            React.createElement("span", { className: "button-icon" }, "↪️"), " Jump to Linked System (", node.linkedProjectName?.substring(0, 10) || 'Link', ")"
          )
        ),
        node.linkedProjectId && onUnlinkProjectFromNode && (
          React.createElement("button", { onClick: () => handleDetailPanelNodeAction(() => onUnlinkProjectFromNode(node.id)), disabled: isAppBusy, className: "secondary" },
            React.createElement("span", { className: "button-icon" }, "🚫"), " Sever Outgoing Link"
          )
        ),

        isProjectRoot && incomingLinkInfo && (
          React.createElement("button", { onClick: () => handleDetailPanelNodeAction(() => handleNavigateToSourceNode(incomingLinkInfo.sourceProjectId, incomingLinkInfo.sourceNodeId)), disabled: isAppBusy },
            React.createElement("span", { className: "button-icon" }, "↩️"), " Jump to Source System"
          )
        ),

        !node.linkedProjectId && !(isProjectRoot && incomingLinkInfo) && (
          React.createElement("button", { onClick: () => handleDetailPanelNodeAction(() => onOpenLinkProjectModal(node.id)), disabled: isAppBusy },
            React.createElement("span", { className: "button-icon" }, "🔗"), " Establish Hyperspace Link"
          )
        ),
        React.createElement("button", {
          onClick: () => handleDetailPanelNodeAction(() => onDeleteNode(node.id)),
          disabled: isAppBusy,
          className: "danger",
          style: { background: 'var(--error-bg)', color: 'var(--error-color)', borderColor: 'var(--error-color)' }
        },
          React.createElement("span", { className: "button-icon" }, "🗑️"), " Decommission System"
        )
      ),
      React.createElement("button", { onClick: onExitFocusView, style: { marginTop: 'auto', width: '100%' }, className: "secondary" },
        "Exit Focus View"
      )
    )
  );
};

export default FocusViewDetailPanel;
