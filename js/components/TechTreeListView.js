
import React from 'react';
import TechTreeListItem from './TechTreeListItem.js'; 

const TechTreeListViewComponent = ({
    treeData, showDescriptions, onToggleLock, onAddQuickChild, onNodeImportanceChange,
    onOpenNodeEditModal, searchTerm, isAppBusy, collapsedNodeIds, onToggleCollapseNode,
    onSwitchToFocusView,
    onNavigateToLinkedProject,
    onOpenContextMenu,
    onSelectListItem,
    projects, 
    activeProjectId,
    treeDataRootId,
    findLinkSource,
    handleNavigateToSourceNode,
}) => {

  if (!treeData) {
    return (
        React.createElement("div", { style: { textAlign: 'center', padding: '30px', color: 'var(--text-secondary)', background: 'var(--panel-alt-bg)', borderRadius: 'var(--border-radius)', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'} },
            React.createElement("span", { style: {fontSize: '2.5em', marginBottom: '15px'} }, "🍃"),
            React.createElement("p", { style: {fontSize: '1.2em', color: 'var(--text-primary)'} }, "No Nodes to Display"),
            React.createElement("p", null, "Your search may not match any nodes, or no structure data has been loaded or generated yet.")
        )
    );
  }

  return (
    React.createElement("div", { style: { height: '100%', overflowY: 'auto', border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius)', background: 'var(--app-bg)', padding: '8px' }},
      React.createElement("ul", { style: { listStyleType: 'none', padding: '0', margin: '0' }},
        React.createElement(TechTreeListItem, {
            key: treeData.id, node: treeData,
            showDescriptionsGlobal: showDescriptions,
            onToggleLock: onToggleLock, onAddQuickChild: onAddQuickChild, onNodeImportanceChange: onNodeImportanceChange,
            onOpenNodeEditModal: onOpenNodeEditModal, level: 0,
            searchTerm: searchTerm, isAppBusy: isAppBusy,
            collapsedNodeIds: collapsedNodeIds, onToggleCollapseNode: onToggleCollapseNode,
            onSwitchToFocusView: onSwitchToFocusView, 
            onNavigateToLinkedProject: onNavigateToLinkedProject, 
            onOpenContextMenu: onOpenContextMenu,
            onSelectListItem: onSelectListItem,
            projects: projects, 
            activeProjectId: activeProjectId, 
            treeDataRootId: treeDataRootId, 
            findLinkSource: findLinkSource, 
            handleNavigateToSourceNode: handleNavigateToSourceNode 
        })
      )
    )
  );
};

const TechTreeListView = React.memo(TechTreeListViewComponent);
export default TechTreeListView;
