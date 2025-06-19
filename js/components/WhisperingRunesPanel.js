
import React, { useMemo, useState, useEffect, useRef } from 'react';
import { findNodeById } from '../utils.js';
import { NODE_IMPORTANCE_OPTIONS } from '../constants.js';

const WhisperingRunesPanel = ({
  targetNodeId, treeData,
  onOpenNodeEditModal, onToggleLock, onNodeImportanceChange,
  onLinkToProject, onGoToLinkedProject, onUnlinkProject,
  onDeleteNode, onSetFocusNode, onGenerateInsights,
  isAppBusy, yggdrasilViewMode,
  projects, activeProjectId, currentProjectRootId, findLinkSource, handleNavigateToSourceNode,
}) => {
  const [isSubMenuOpen, setIsSubMenuOpen] = useState(false);
  const [lockButtonFeedback, setLockButtonFeedback] = useState(false);
  
  const subMenuRef = useRef(null);
  const moreButtonRef = useRef(null);

  const node = useMemo(() => {
    if (!targetNodeId || !treeData) return null;
    return findNodeById(treeData, targetNodeId);
  }, [targetNodeId, treeData]);

  const isTargetNodeRoot = node?.id === currentProjectRootId;
  const incomingLinkSource = useMemo(() => {
    if (isTargetNodeRoot && activeProjectId && node) {
      return findLinkSource(activeProjectId, projects);
    }
    return null;
  }, [isTargetNodeRoot, activeProjectId, projects, findLinkSource, node]);

  useEffect(() => {
    if (!isSubMenuOpen) return;
    const handleClickOutside = (event) => {
        if (
            subMenuRef.current && !subMenuRef.current.contains(event.target) &&
            moreButtonRef.current && !moreButtonRef.current.contains(event.target)
        ) {
            setIsSubMenuOpen(false);
        }
    };
    const handleEscapeKey = (event) => { if(event.key === 'Escape') setIsSubMenuOpen(false); };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscapeKey);
    return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [isSubMenuOpen]);

  useEffect(() => {
    let timer;
    if (lockButtonFeedback) {
      timer = setTimeout(() => setLockButtonFeedback(false), 750);
    }
    return () => clearTimeout(timer);
  }, [lockButtonFeedback]);


  if (yggdrasilViewMode !== 'graph' || !node) { 
    return React.createElement("div", { className: "whispering-runes-panel hidden" }); 
  }
  
  const handleToggleLockWithFeedback = () => {
    if (node) { onToggleLock(node.id); setLockButtonFeedback(true); }
  };
  const handleEdit = () => onOpenNodeEditModal({ mode: 'editName', targetNodeId: node.id, currentNodeName: node.name, currentNodeDescription: node.description, title: `Edit Properties: ${node.name}`, label: "Node Name", placeholder: "Enter new node name", initialValue: node.name, initialDescription: node.description });
  const handleAddChild = () => onOpenNodeEditModal({ mode: 'addChild', targetNodeId: node.id, parentNodeName: node.name, title: `Add Child to: ${node.name}`, label: "New Child Name", placeholder: "Enter new child name" });
  const handleCycleImportance = () => {
    if (node) { onNodeImportanceChange(node.id, nextImportanceValue); }
  };

  const importanceCycle = ['common', 'major', 'minor'];
  const currentImportance = node.importance || 'common';
  const currentImportanceIndex = importanceCycle.indexOf(currentImportance);
  const nextImportanceValue = importanceCycle[(currentImportanceIndex + 1) % importanceCycle.length];

  const currentImportanceInfo = useMemo(() => 
    NODE_IMPORTANCE_OPTIONS.find(opt => opt.value === currentImportance) || NODE_IMPORTANCE_OPTIONS[1], 
    [currentImportance]
  );
  const nextImportanceInfo = useMemo(() => 
    NODE_IMPORTANCE_OPTIONS.find(opt => opt.value === nextImportanceValue) || NODE_IMPORTANCE_OPTIONS[1],
    [nextImportanceValue]
  );
  const lockIcon = node.isLocked ? (lockButtonFeedback ? '🔓' : '🔒') : (lockButtonFeedback ? '🔒' : '🔓');

  return (
    React.createElement("div", { className: `whispering-runes-panel ${node ? 'active' : ''}`, role: "toolbar", "aria-label": `Actions for ${node.name}` },
      React.createElement("h4", { style: { margin: '0 0 8px 0', fontSize: '0.9em', color: 'var(--text-secondary)', textAlign: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '5px' }},
        "Actions for: ", React.createElement("strong", {style: {color: 'var(--text-primary)'}}, node.name.length > 20 ? node.name.substring(0,18)+'...' : node.name)
      ),
      React.createElement("button", { onClick: handleEdit, disabled: isAppBusy, title: "Edit node name and description" }, React.createElement("span", { className: "rune-icon" }, "✏️"), " Edit Details"),
      React.createElement("button", { onClick: handleAddChild, disabled: isAppBusy, title: "Add a new child to this node" }, React.createElement("span", { className: "rune-icon" }, "➕"), " Add Child"),
      React.createElement("button", { 
        onClick: handleToggleLockWithFeedback, disabled: isAppBusy, title: node.isLocked ? "Unlock this node" : "Lock this node", className: lockButtonFeedback ? 'action-feedback' : '' },
        React.createElement("span", { className: "rune-icon" }, lockIcon), " ", node.isLocked ? 'Unlock' : 'Lock'
      ),
      React.createElement("button", {
        onClick: handleCycleImportance, disabled: isAppBusy, title: `Cycle Importance (next: ${nextImportanceInfo.label})`, className: `importance-cycle-button importance-${currentImportance}`},
        React.createElement("span", { className: "rune-icon" }, currentImportanceInfo.rune), ` ${currentImportanceInfo.label}`
      ),

      React.createElement("div", { className: "whispering-runes-more-actions-container" },
        React.createElement("button", { ref: moreButtonRef, onClick: () => setIsSubMenuOpen(p => !p), disabled: isAppBusy, title: "Show more actions" },
            React.createElement("span", { className: "rune-icon" }, "⚙️"), " More Actions"
        ),
        isSubMenuOpen && (
            React.createElement("div", { ref: subMenuRef, className: "whispering-runes-submenu" },
                yggdrasilViewMode !== 'focus' && onSetFocusNode && (
                  React.createElement("button", { onClick: () => { onSetFocusNode(node.id); setIsSubMenuOpen(false); }, disabled: isAppBusy, title: "Switch to Focus View for this node" }, React.createElement("span", { className: "rune-icon" }, "🎯"), " Focus View")
                ),
                onGenerateInsights && (
                  React.createElement("button", { onClick: () => { onGenerateInsights(node); setIsSubMenuOpen(false); }, disabled: isAppBusy, title: "Get AI-powered insights"}, React.createElement("span", { className: "rune-icon" }, "💡"), " AI Insights")
                ),
                node.linkedProjectId && onGoToLinkedProject && (
                  React.createElement("button", { onClick: () => { onGoToLinkedProject(node.linkedProjectId); setIsSubMenuOpen(false); }, disabled: isAppBusy, title: `Go to linked project: ${node.linkedProjectName}`}, React.createElement("span", { className: "rune-icon" }, "↪️"), " Go to Link")
                ),
                node.linkedProjectId && onUnlinkProject && (
                  React.createElement("button", { onClick: () => { onUnlinkProject(node.id); setIsSubMenuOpen(false); }, disabled: isAppBusy, style: {color: 'var(--error-color)'}, title: "Remove outgoing link"}, React.createElement("span", { className: "rune-icon" }, "🚫"), " Unlink Outgoing")
                ),
                incomingLinkSource && (
                  React.createElement("button", { onClick: () => { handleNavigateToSourceNode(incomingLinkSource.sourceProjectId, incomingLinkSource.sourceNodeId); setIsSubMenuOpen(false); }, disabled: isAppBusy, title: `Go to source: ${incomingLinkSource.sourceProjectName}`}, React.createElement("span", { className: "rune-icon" }, "↩️"), " Go to Source")
                ),
                !node.linkedProjectId && !incomingLinkSource && onLinkToProject && (
                  React.createElement("button", { onClick: () => { onLinkToProject(node.id); setIsSubMenuOpen(false); }, disabled: isAppBusy, title: "Link this node to another project."}, React.createElement("span", { className: "rune-icon" }, "🔗"), " Link Project")
                ),
                onDeleteNode && (
                  React.createElement(React.Fragment, null,
                    React.createElement("hr", null),
                    React.createElement("button", { onClick: () => { onDeleteNode(node.id); setIsSubMenuOpen(false); }, disabled: isAppBusy, style: {color: 'var(--error-color)'}, title: "Delete this node and all its children."}, React.createElement("span", { className: "rune-icon" }, "🗑️"), " Delete Node")
                  )
                )
            )
        )
      )
    )
  );
};

export default WhisperingRunesPanel;
