
import React, { useState } from 'react';
import TechTreeListView from '../TechTreeListView.js';
import { filterTree, areAllNodesExpanded } from '../../utils.js'; 

const ListViewTabContent = ({
  techTreeData,
  showListDescriptionsGlobal,
  onToggleNodeLock,
  onAddQuickChild,
  onNodeImportanceChange,
  onOpenNodeEditModal,
  isAppBusy,
  collapsedNodeIds,
  onToggleCollapseNode,
  onSwitchToFocusView, 
  onNavigateToLinkedProject, 
  onOpenContextMenu,
  onSelectListItem,
  selectedNodeId,
  projects,
  activeProjectId,
  findLinkSource,
  handleNavigateToSourceNode,
  handleToggleAllNodesList,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  if (!techTreeData && !isAppBusy) {
    return (
      React.createElement("div", { style: { textAlign: 'center', padding: '30px', color: 'var(--text-secondary)', background: 'var(--panel-alt-bg)', borderRadius: 'var(--border-radius)', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }},
        React.createElement("span", {style: {fontSize: '2.5em', marginBottom: '15px'}}, "🍃"),
        React.createElement("p", {style: {fontSize: '1.2em', color: 'var(--text-primary)'}}, "No Structure Data"),
        React.createElement("p", null, "Generate or load a structure using the Workspace to see it here.")
      )
    );
  }

  const displayedTreeData = techTreeData ? filterTree(techTreeData, searchTerm) : null;
  const allExpanded = techTreeData ? areAllNodesExpanded(techTreeData, collapsedNodeIds) : true;

  return (
    React.createElement("div", { style: { display: 'flex', flexDirection: 'column', height: '100%', gap: '10px' }}, 
      techTreeData && (
        React.createElement("div", { style: { 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            paddingBottom: '8px', 
            borderBottom: '1px solid var(--border-color)', 
            marginBottom: '8px',
            gap: '12px'
        }},
          React.createElement("div", { style: { flexGrow: 1, maxWidth: '400px' }},
            React.createElement("input", {
              type: "search",
              placeholder: "Filter list by name/description...",
              value: searchTerm,
              onChange: (e) => setSearchTerm(e.target.value),
              style: { width: '100%' },
              "aria-label": "Filter list of nodes",
              disabled: isAppBusy || !techTreeData
            })
          ),
          React.createElement("button", { 
            onClick: handleToggleAllNodesList, 
            disabled: isAppBusy || !techTreeData,
            className: "secondary",
            style: {padding: '6px 10px', fontSize: '0.9em'},
            title: allExpanded ? "Collapse all expandable nodes" : "Expand all nodes"
          },
            allExpanded ? 'Collapse All ➖' : 'Expand All ➕'
          )
        )
      ),

      displayedTreeData ? (
        React.createElement("div", { style: { flexGrow: 1, overflow: 'hidden' }},
            React.createElement(TechTreeListView, {
              treeData: displayedTreeData,
              showDescriptions: showListDescriptionsGlobal,
              onToggleLock: onToggleNodeLock,
              onAddQuickChild: onAddQuickChild,
              onNodeImportanceChange: onNodeImportanceChange,
              onOpenNodeEditModal: onOpenNodeEditModal,
              searchTerm: searchTerm,
              isAppBusy: isAppBusy,
              collapsedNodeIds: collapsedNodeIds,
              onToggleCollapseNode: onToggleCollapseNode,
              onSwitchToFocusView: onSwitchToFocusView,
              onNavigateToLinkedProject: onNavigateToLinkedProject,
              onOpenContextMenu: onOpenContextMenu,
              onSelectListItem: onSelectListItem,
              selectedNodeId: selectedNodeId,
              projects: projects,
              activeProjectId: activeProjectId,
              treeDataRootId: techTreeData?.id,
              findLinkSource: findLinkSource,
              handleNavigateToSourceNode: handleNavigateToSourceNode
            })
        )
      ) : (
        techTreeData && searchTerm &&
        React.createElement("div", { style: { textAlign: 'center', padding: '30px', color: 'var(--text-secondary)', background: 'var(--panel-alt-bg)', borderRadius: 'var(--border-radius)', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }},
          React.createElement("span", {style: {fontSize: '2.5em', marginBottom: '15px'}}, "🔍"),
          React.createElement("p", {style: {fontSize: '1.1em', color: 'var(--text-primary)'}}, "No Nodes Match Search"),
          React.createElement("p", null, "Try refining your search term: \"", searchTerm, "\"")
        )
      )
    )
  );
};

export default ListViewTabContent;
