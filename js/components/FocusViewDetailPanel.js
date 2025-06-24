import React from 'react';
import ContextualHelpTooltip from './ContextualHelpTooltip.js';
import { NODE_IMPORTANCE_OPTIONS } from '../constants.js';

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
      
      React.createElement("div", { className: "focus-view-info-block" },
        React.createElement("label", null, "Designation"),
        React.createElement("p", { className: "info-block-name" }, node.name),
        React.createElement("label", null, "Analysis"),
        React.createElement("p", { className: "info-block-description" }, node.description || React.createElement("i", null, "(No analysis data)"))
      ),
      
      node.isLocked && React.createElement("p", { style: { fontSize: '0.85em', color: 'var(--warning-color)', textAlign: 'center' }}, "System details locked. Unlock to edit."),

      React.createElement("div", { className: "form-group" },
        React.createElement("label", { htmlFor: "focus-node-importance" }, "System Importance:"),
        React.createElement("div", { id: "focus-node-importance", className: "segmented-control focus-view-importance-control" },
          NODE_IMPORTANCE_OPTIONS.map(opt => React.createElement("button", {
            key: opt.value,
            type: "button",
            className: (node.importance || 'common') === opt.value ? 'active' : '',
            onClick: () => onNodeImportanceChange(node.id, opt.value),
            disabled: isAppBusy || node.isLocked,
            title: `Set importance to ${opt.label}`
          }, opt.rune, " ", opt.label))
        )
      ),

      isProjectRoot && incomingLinkInfo && (
        React.createElement("div", { style: { fontSize: '0.9em', color: 'var(--text-tertiary)', marginBottom: '10px', padding: '5px', background: 'rgba(var(--focus-panel-text), 0.05)', borderRadius: 'var(--border-radius)' }},
          "↩️ Linked from: ", React.createElement("strong", null, incomingLinkInfo.sourceProjectName), " / \"", incomingLinkInfo.sourceNodeName, "\""
        )
      ),

      React.createElement("div", { className: "panel-sub-header" }, "Core Actions"),
      React.createElement("div", { className: "panel-button-group" },
        React.createElement("button", { onClick: handleEditDetails, disabled: isAppBusy || node.isLocked, title: "Edit name and description" }, React.createElement("span", { className: "button-icon" }, "✏️"), "Edit Details"),
        React.createElement("button", { onClick: () => onToggleLock(node.id), disabled: isAppBusy, title: node.isLocked ? "Unlock this celestial object" : "Lock this celestial object to prevent changes" }, React.createElement("span", { className: "button-icon" }, node.isLocked ? '🔓' : '🔒'), node.isLocked ? 'Unlock System' : 'Lock System'),
        React.createElement("button", { onClick: () => onOpenNodeEditModal({ mode: 'addChild', targetNodeId: node.id, parentNodeName: node.name, title: `Add Subsystem to: ${node.name}`, label: 'New Subsystem Name', placeholder: 'Enter name', initialValue: '', initialDescription: '' }), disabled: isAppBusy, title: "Add a new child object" }, React.createElement("span", { className: "button-icon" }, "➕"), "Add Subsystem")
      ),
      
      React.createElement("div", { className: "panel-sub-header" }, "Hyperspace Links"),
      React.createElement("div", { className: "panel-button-group" },
        node.linkedProjectId && onNavigateToLinkedProject && (React.createElement("button", { onClick: () => onNavigateToLinkedProject(node.linkedProjectId), disabled: isAppBusy, title: `Jump to linked project: ${node.linkedProjectName}` }, React.createElement("span", { className: "button-icon" }, "↪️"), "Jump to Linked System")),
        node.linkedProjectId && onUnlinkProjectFromNode && (React.createElement("button", { onClick: () => onUnlinkProjectFromNode(node.id), disabled: isAppBusy, className: "secondary", title: "Remove the outgoing link to another project" }, React.createElement("span", { className: "button-icon" }, "🚫"), "Sever Outgoing Link")),
        isProjectRoot && incomingLinkInfo && (React.createElement("button", { onClick: () => handleNavigateToSourceNode(incomingLinkInfo.sourceProjectId, incomingLinkInfo.sourceNodeId), disabled: isAppBusy, title: `Jump to source project: ${incomingLinkInfo.sourceProjectName}` }, React.createElement("span", { className: "button-icon" }, "↩️"), "Jump to Source System")),
        !node.linkedProjectId && !(isProjectRoot && incomingLinkInfo) && (React.createElement("button", { onClick: () => onOpenLinkProjectModal(node.id), disabled: isAppBusy, title: "Create a link from this object to another project" }, React.createElement("span", { className: "button-icon" }, "🔗"), "Establish Hyperspace Link"))
      ),
      
      React.createElement("div", { className: "panel-sub-header" }, "Danger Zone"),
      React.createElement("div", { className: "panel-button-group" },
        React.createElement("button", { onClick: () => onDeleteNode(node.id), disabled: isAppBusy, className: "danger", title: "Permanently delete this object and all its children" }, React.createElement("span", { className: "button-icon" }, "🗑️"), "Decommission System")
      ),
      React.createElement("button", { onClick: onExitFocusView, style: { marginTop: 'auto', width: '100%' }, className: "secondary" },
        "Exit Focus View"
      )
    )
  );
};

export default FocusViewDetailPanel;