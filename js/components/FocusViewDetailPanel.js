
import React from 'react';
// import { TechTreeNode, NodeStatus, NodeEditModalConfig, Project } from '../types.js'; // Types removed
import ContextualHelpTooltip from './ContextualHelpTooltip.js';
// import { LinkSourceInfo } from '../hooks/useProjectLinking.js'; // Types removed

const NODE_IMPORTANCE_OPTIONS = [
    { value: 'minor', label: 'Minor', rune: '🌱' },
    { value: 'common', label: 'Common', rune: '🌿' },
    { value: 'major', label: 'Major', rune: '🌳' },
];

const FocusViewDetailPanel = ({
  node,
  isAppBusy,
  onNodeImportanceChange,
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

  const handleDetailPanelNodeAction = (action) => {
    if (isAppBusy) return;
    action();
  };
  
  const handleEditDetails = () => {
    onOpenNodeEditModal({
        mode: 'editName',
        targetNodeId: node.id,
        currentNodeName: node.name,
        currentNodeDescription: node.description,
        title: `Edit Details: ${node.name}`,
        label: 'Node Name',
        placeholder: 'Enter new name',
        initialValue: node.name,
        initialDescription: node.description
    });
  };

  return (
    React.createElement("div", { className: "focus-view-detail-panel", role: "region", "aria-labelledby": "detail-panel-heading" },
      React.createElement("h3", { id: "detail-panel-heading", style: { margin: '0 0 15px 0', fontSize: '1.2em' }},
        "System Intel: ", node.name.substring(0, 25), node.name.length > 25 ? '...' : '',
        React.createElement(ContextualHelpTooltip, { helpText: "Details and actions for the selected celestial object. Click parent, focus, or child objects to change selection here." })
      ),
      
      React.createElement("div", { className: "form-group", style: { background: 'rgba(0,0,0,0.2)', padding: '8px', borderRadius: 'var(--border-radius)'} },
        React.createElement("label", null, "Designation:"),
        React.createElement("p", { style: { fontSize: '1em', fontWeight: 'bold', margin: '2px 0 8px 0', color: 'var(--focus-panel-text)' }}, node.name),
        React.createElement("label", null, "Analysis:"),
        React.createElement("p", { style: { fontSize: '0.9em', margin: '2px 0 0 0', whiteSpace: 'pre-wrap', maxHeight: '120px', overflowY: 'auto'}}, node.description || React.createElement("i", {style: {opacity: 0.7}}, "(No analysis data)") )
      ),
      
      node.isLocked && React.createElement("p", { style: { fontSize: '0.85em', color: 'var(--warning-color)', textAlign: 'center' }}, "System details locked. Unlock to edit."),

      React.createElement("div", { className: "form-group" },
        React.createElement("label", { htmlFor: "focus-node-importance" }, "System Importance:"),
        React.createElement("select", {
          id: "focus-node-importance",
          value: node.importance || 'common',
          onChange: (e) => handleDetailPanelNodeAction(() => onNodeImportanceChange(node.id, e.target.value)),
          disabled: isAppBusy || node.isLocked,
          className: `importance-select importance-${node.importance || 'common'}`
        },
          NODE_IMPORTANCE_OPTIONS.map(opt => React.createElement("option", { key: opt.value, value: opt.value }, opt.rune, " ", opt.label))
        )
      ),

      isProjectRoot && incomingLinkInfo && (
        React.createElement("div", { style: { fontSize: '0.9em', color: 'var(--text-tertiary)', marginBottom: '10px', padding: '5px', background: 'rgba(var(--focus-panel-text), 0.05)', borderRadius: 'var(--border-radius)' }},
          "↩️ Linked from: ", React.createElement("strong", null, incomingLinkInfo.sourceProjectName), " / \"", incomingLinkInfo.sourceNodeName, "\""
        )
      ),

      React.createElement("div", { className: "panel-button-group" },
        React.createElement("button", { onClick: () => handleDetailPanelNodeAction(handleEditDetails), disabled: isAppBusy || node.isLocked },
            React.createElement("span", { className: "button-icon" }, "✏️"), " Edit Details"
        ),
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
