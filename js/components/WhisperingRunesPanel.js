
import React, { useMemo, useState, useEffect } from 'react';
// import { TechTreeNode, NodeStatus, NodeEditModalConfig, Project } from '../types.js'; // Types removed
import { findNodeById } from '../utils.js';
// import { LinkSourceInfo } from '../hooks/useProjectLinking.js'; // Types removed

const WhisperingRunesPanel = ({
  targetNodeId, treeData,
  onOpenNodeEditModal, onToggleLock, onNodeImportanceChange,
  onLinkToProject, onGoToLinkedProject, onUnlinkProject,
  onDeleteNode, onSetFocusNode, onGenerateInsights,
  isAppBusy, activeOverlayPanel, yggdrasilViewMode,
  projects, activeProjectId, currentProjectRootId, findLinkSource, handleNavigateToSourceNode,
}) => {
  const node = useMemo(() => {
    if (!targetNodeId || !treeData) return null;
    return findNodeById(treeData, targetNodeId);
  }, [targetNodeId, treeData]);

  const [lockButtonFeedback, setLockButtonFeedback] = useState(false);

  const isTargetNodeRoot = node?.id === currentProjectRootId;
  const incomingLinkSource = useMemo(() => {
    if (isTargetNodeRoot && activeProjectId && node) {
      return findLinkSource(activeProjectId, projects);
    }
    return null;
  }, [isTargetNodeRoot, activeProjectId, projects, findLinkSource, node]);


  const handleToggleLockWithFeedback = () => {
    if (node) {
      onToggleLock(node.id);
      setLockButtonFeedback(true);
    }
  };

  useEffect(() => {
    let timer;
    if (lockButtonFeedback) {
      timer = setTimeout(() => setLockButtonFeedback(false), 750);
    }
    return () => clearTimeout(timer);
  }, [lockButtonFeedback]);


  if (yggdrasilViewMode === 'workspace' || !node) { 
    return React.createElement("div", { className: "whispering-runes-panel hidden" }); 
  }
  

  const handleEdit = () => onOpenNodeEditModal({ mode: 'editName', targetNodeId: node.id, currentNodeName: node.name, currentNodeDescription: node.description, title: `Edit Properties: ${node.name}`, label: "Node Name", placeholder: "Enter new node name", initialValue: node.name, initialDescription: node.description });
  const handleAddChild = () => onOpenNodeEditModal({ mode: 'addChild', targetNodeId: node.id, parentNodeName: node.name, title: `Add Child to: ${node.name}`, label: "New Child Name", placeholder: "Enter new child name" });

  const importanceOptions = [
    { value: 'minor', label: 'Minor', rune: '🌱' },
    { value: 'common', label: 'Common', rune: '🌿' },
    { value: 'major', label: 'Major', rune: '🌳' },
  ];

  const lockIcon = node.isLocked ? (lockButtonFeedback ? '🔓' : '🔒') : (lockButtonFeedback ? '🔒' : '🔓');


  return (
    React.createElement("div", { className: `whispering-runes-panel ${node ? 'active' : ''}`, role: "toolbar", "aria-label": `Actions for ${node.name}` },
      React.createElement("h4", { style: { margin: '0 0 8px 0', fontSize: '0.9em', color: 'var(--text-secondary)', textAlign: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '5px' }},
        "Actions for: ", React.createElement("strong", {style: {color: 'var(--text-primary)'}}, node.name.length > 20 ? node.name.substring(0,18)+'...' : node.name)
      ),
      React.createElement("button", { onClick: handleEdit, disabled: isAppBusy, title: "Edit node name and description" }, React.createElement("span", { className: "rune-icon" }, "✏️"), " Edit Details"),
      React.createElement("button", { onClick: handleAddChild, disabled: isAppBusy, title: "Add a new child to this node" }, React.createElement("span", { className: "rune-icon" }, "➕"), " Add Child"),
      React.createElement("button", { 
        onClick: handleToggleLockWithFeedback, 
        disabled: isAppBusy, 
        title: node.isLocked ? "Unlock this node" : "Lock this node (prevents AI modification)",
        className: lockButtonFeedback ? 'action-feedback' : ''
       },
        React.createElement("span", { className: "rune-icon" }, lockIcon), " ", node.isLocked ? 'Unlock' : 'Lock'
      ),

      React.createElement("div", { style: { margin: '5px 0' }},
        React.createElement("label", { htmlFor: `rune-importance-select-${node.id}`, style: {fontSize: '0.85em', color: 'var(--text-tertiary)', display: 'block', marginBottom: '3px'}}, "Importance:"),
        React.createElement("select", {
          id: `rune-importance-select-${node.id}`,
          value: node.importance || 'common',
          onChange: (e) => onNodeImportanceChange(node.id, e.target.value),
          disabled: isAppBusy,
          className: `importance-select importance-${node.importance || 'common'}`,
          style: {width: '100%', padding: '6px 8px', fontSize: '0.9em'},
          "aria-label": `Current importance: ${node.importance || 'common'}. Change importance.`
        },
          importanceOptions.map(opt => React.createElement("option", { key: opt.value, value: opt.value }, opt.rune, " ", opt.label))
        )
      ),

      activeOverlayPanel !== 'focus' && onSetFocusNode && (
        React.createElement("button", { onClick: () => onSetFocusNode(node.id), disabled: isAppBusy, title: "Open in Focus View panel" }, React.createElement("span", { className: "rune-icon" }, "🎯"), " Focus View")
      ),

      onGenerateInsights && (
        React.createElement("button", { onClick: () => onGenerateInsights(node), disabled: isAppBusy, title: "Get AI-powered insights and suggestions for this node."}, React.createElement("span", { className: "rune-icon" }, "💡"), " AI Insights")
      ),

      node.linkedProjectId && onGoToLinkedProject && (
        React.createElement("button", { onClick: () => onGoToLinkedProject(node.linkedProjectId), disabled: isAppBusy, title: `Go to linked project: ${node.linkedProjectName}`}, React.createElement("span", { className: "rune-icon" }, "↪️"), " Go to Link")
      ),
      node.linkedProjectId && onUnlinkProject && (
        React.createElement("button", { onClick: () => onUnlinkProject(node.id), disabled: isAppBusy, style: {color: 'var(--error-color)'}, title: "Remove outgoing link to other project"}, React.createElement("span", { className: "rune-icon" }, "🚫"), " Unlink Outgoing")
      ),

      incomingLinkSource && (
        React.createElement("button", { onClick: () => handleNavigateToSourceNode(incomingLinkSource.sourceProjectId, incomingLinkSource.sourceNodeId), disabled: isAppBusy, title: `Go to source: ${incomingLinkSource.sourceProjectName} / ${incomingLinkSource.sourceNodeName}`}, React.createElement("span", { className: "rune-icon" }, "↩️"), " Go to Source")
      ),
      
      !node.linkedProjectId && !incomingLinkSource && onLinkToProject && (
        React.createElement("button", { onClick: () => onLinkToProject(node.id), disabled: isAppBusy, title: "Link this node to another project."}, React.createElement("span", { className: "rune-icon" }, "🔗"), " Link Project")
      ),


      onDeleteNode && (
        React.createElement("button", { onClick: () => onDeleteNode(node.id), disabled: isAppBusy, style: {color: 'var(--error-color)'}, title: "Delete this node and all its children."}, React.createElement("span", { className: "rune-icon" }, "🗑️"), " Delete Node")
      )
    )
  );
};

export default WhisperingRunesPanel;
