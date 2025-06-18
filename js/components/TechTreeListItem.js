
import React, { useMemo, useCallback, useState, useEffect } from 'react';
// import { TechTreeNode, NodeStatus, Project } from '../types.js'; // Types removed
// import { LinkSourceInfo } from '../hooks/useProjectLinking.js'; // Types removed

const RUNE_IMPORTANCE_OPTIONS = [
    { value: 'minor', label: 'Minor', rune: '🌱' },
    { value: 'common', label: 'Common', rune: '🌿' },
    { value: 'major', label: 'Major', rune: '🌳' },
];

const TechTreeListItemComponent = ({
    node, showDescriptionsGlobal,
    onToggleLock, onAddQuickChild,
    onNodeImportanceChange,
    onOpenNodeEditModal, level, searchTerm, isAppBusy, collapsedNodeIds, onToggleCollapseNode,
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
  const [isDescriptionLocallyVisible, setIsDescriptionLocallyVisible] = useState(null);

  useEffect(() => {
    setIsDescriptionLocallyVisible(null);
  }, [showDescriptionsGlobal, node.id]);

  const isEffectivelyDescriptionVisible = useMemo(() => {
    return isDescriptionLocallyVisible !== null ? isDescriptionLocallyVisible : showDescriptionsGlobal;
  }, [isDescriptionLocallyVisible, showDescriptionsGlobal]);

  const handleToggleLocalDescription = useCallback(() => {
    setIsDescriptionLocallyVisible(prevLocal => prevLocal === null ? !showDescriptionsGlobal : !prevLocal);
  }, [showDescriptionsGlobal]);

  const isCollapsed = collapsedNodeIds.has(node.id);
  const hasChildren = !!(node.children && node.children.length > 0);

  const handleImportanceChange = useCallback((e) => {
    onNodeImportanceChange(node.id, e.target.value);
  }, [node.id, onNodeImportanceChange]);

  const handleEditNameAndDescriptionClick = useCallback(() => {
    onOpenNodeEditModal({
        mode: 'editName',
        targetNodeId: node.id,
        currentNodeName: node.name,
        currentNodeDescription: node.description,
        title: `Edit: ${node.name}`,
        label: "Node Name",
        placeholder: "Enter new node name",
        initialValue: node.name,
        initialDescription: node.description,
    });
  }, [node.id, node.name, node.description, onOpenNodeEditModal]);

  const handleAddChildClick = useCallback((event) => {
    if (event.shiftKey) {
      onAddQuickChild(node.id);
    } else {
      onOpenNodeEditModal({
          mode: 'addChild',
          targetNodeId: node.id,
          parentNodeName: node.name,
          title: `Add Child to: ${node.name}`,
          label: "New Child Name",
          placeholder: "Enter new child name",
      });
    }
  }, [node.id, node.name, onOpenNodeEditModal, onAddQuickChild]);

  const handleNodeCollapseToggle = useCallback((event) => {
    if (hasChildren) {
      onToggleCollapseNode(node.id, event.shiftKey);
    }
  }, [node.id, hasChildren, onToggleCollapseNode]);

  const handleLockToggle = useCallback(() => {
    onToggleLock(node.id);
  }, [node.id, onToggleLock]);
  
  const handleFocusNodeClick = useCallback(() => { 
    onSwitchToFocusView(node.id);
  }, [node.id, onSwitchToFocusView]);

  const incomingLinkSource = useMemo(() => {
    if (node.id === treeDataRootId && activeProjectId) {
      return findLinkSource(activeProjectId, projects);
    }
    return null;
  }, [node.id, treeDataRootId, activeProjectId, projects, findLinkSource]);

  const handleGoToLinkedProjectClick = useCallback(() => {
    if (incomingLinkSource) {
      handleNavigateToSourceNode(incomingLinkSource.sourceProjectId, incomingLinkSource.sourceNodeId);
    } else if (node.linkedProjectId && onNavigateToLinkedProject) {
      onNavigateToLinkedProject(node.linkedProjectId);
    }
  }, [node.linkedProjectId, onNavigateToLinkedProject, incomingLinkSource, handleNavigateToSourceNode]);

  const getHighlightedText = useCallback((text, highlight) => {
    if (!highlight?.trim() || !text) return text;
    const escapedHighlight = highlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const parts = text.split(new RegExp(`(${escapedHighlight})`, 'gi'));
    return parts.map((part, i) =>
      part.toLowerCase() === highlight.toLowerCase() ? (
        React.createElement("mark", { key: i, className: "search-highlight" }, part)
      ) : ( part )
    );
  }, []);

  const handleNodeNameClick = useCallback(() => {
    if (onSelectListItem) {
      onSelectListItem(node.id);
    }
    if (hasChildren) {
      onToggleCollapseNode(node.id, false); 
    }
  }, [node.id, hasChildren, onSelectListItem, onToggleCollapseNode]);

  const handleContextMenu = useCallback((event) => {
    event.preventDefault();
    if (onSelectListItem) onSelectListItem(node.id); 
    onOpenContextMenu(node.id, { x: event.clientX, y: event.clientY }, incomingLinkSource);
  }, [node.id, onOpenContextMenu, onSelectListItem, incomingLinkSource]);

  const itemStyle = {
    marginLeft: `${level * 8}px`, 
  };

  const itemContentVisible = (node.description && isEffectivelyDescriptionVisible) || hasChildren;

  let nodeNameTitle = node.name;
  if (node.linkedProjectId && node.linkedProjectName) {
    nodeNameTitle += ` (🔗 Links to: ${node.linkedProjectName})`;
  } else if (incomingLinkSource) {
    nodeNameTitle += ` (↩️ Linked from: ${incomingLinkSource.sourceProjectName} / ${incomingLinkSource.sourceNodeName})`;
  }

  const currentImportanceObject = RUNE_IMPORTANCE_OPTIONS.find(opt => opt.value === (node.importance || 'common')) || RUNE_IMPORTANCE_OPTIONS[1];


  return (
    React.createElement("li", { className: "list-view-item", style: itemStyle, "aria-labelledby": `node-name-${node.id}`, onContextMenu: handleContextMenu },
      React.createElement("div", { className: `list-view-item-header ${itemContentVisible && !isCollapsed ? 'expanded' : ''}`},
        React.createElement("div", { className: "list-view-name-section" },
          hasChildren && (
            React.createElement("button", { onClick: handleNodeCollapseToggle, disabled: isAppBusy, className: "list-item-chevron-icon base-icon-button",
              "aria-expanded": !isCollapsed, "aria-controls": hasChildren ? `children-of-${node.id}` : undefined,
              "aria-label": `${isCollapsed ? `Expand ${node.name}` : `Collapse ${node.name}`}${hasChildren ? ". Shift-click to toggle all descendants." : ""}`,
              title: `${isCollapsed ? `Expand ${node.name}` : `Collapse ${node.name}`}${hasChildren ? ". Shift-click to toggle all descendants." : ""}`},
              isCollapsed ? '▶' : '▼'
            )
          ),
          !hasChildren && React.createElement("span", { style: { display: 'inline-block', width: '26px', height: '26px', marginRight: '2px' }}, " "),
          
          node.linkedProjectId && (
            React.createElement("span", { style: { fontSize: '1em', marginRight: '4px', color: 'var(--primary-accent)' }, title: `Links to project: ${node.linkedProjectName || 'Unknown'}`}, "🔗")
          ),
          incomingLinkSource && (
            React.createElement("span", { style: { fontSize: '1em', marginRight: '4px', color: 'var(--secondary-accent-dark)' }, title: `Linked from: ${incomingLinkSource.sourceProjectName} / ${incomingLinkSource.sourceNodeName}`}, "↩️")
          ),

          React.createElement("span", { id: `node-name-${node.id}`,
             className: `list-view-node-name ${hasChildren || onSelectListItem ? 'clickable' : ''} ${node.isLocked ? 'locked' : ''}`,
             title: nodeNameTitle,
             onClick: handleNodeNameClick 
          },
            getHighlightedText(node.name, searchTerm)
          )
        ),

        React.createElement("div", { className: "list-view-actions" },
           React.createElement("button", { onClick: handleLockToggle, disabled: isAppBusy,
            className: `list-item-action-icon base-icon-button ${node.isLocked ? 'locked' : ''}`,
            "aria-pressed": !!node.isLocked,
            "aria-label": node.isLocked ? `Unlock node ${node.name}` : `Lock node ${node.name}`,
            title: node.isLocked ? `Unlock Node` : `Lock Node`},
            node.isLocked ? '🔒' : '🔓'
          ),
           React.createElement("div", { className: "list-view-importance-select-wrapper" },
              React.createElement("select", {
                value: node.importance || 'common',
                onChange: handleImportanceChange,
                disabled: isAppBusy,
                className: `list-view-importance-select importance-${node.importance || 'common'}`,
                "aria-label": `Importance for ${node.name}`,
                title: `Current importance: ${currentImportanceObject.rune} ${currentImportanceObject.label}. Click to change.`
              },
                RUNE_IMPORTANCE_OPTIONS.map(opt => React.createElement("option", { key: opt.value, value: opt.value }, opt.rune, " ", opt.label))
              )
            ),
           React.createElement("button", { onClick: handleToggleLocalDescription, disabled: isAppBusy || !node.description, className: "list-item-action-icon base-icon-button",
            "aria-pressed": isEffectivelyDescriptionVisible,
            "aria-label": isEffectivelyDescriptionVisible ? `Hide description for ${node.name}` : `Show description for ${node.name}`,
            title: node.description ? (isEffectivelyDescriptionVisible ? `Hide Description` : `Show Description`) : "No description available"},
            isEffectivelyDescriptionVisible ? '👁️' : '👁️‍🗨️'
          ),
          React.createElement("button", { onClick: handleEditNameAndDescriptionClick, disabled: isAppBusy, className: "list-item-action-icon primary-action base-icon-button",
            "aria-label": `Edit ${node.name}`, title: `Edit Name & Description`},
            "✏️"
          ),
          React.createElement("button", { onClick: handleAddChildClick, disabled: isAppBusy, className: "list-item-action-icon base-icon-button",
            "aria-label": `Add child to ${node.name}. Hold Shift to add without a prompt.`, title: `Add Child Node (Shift+Click for quick add)`},
            "✨"
          ),
           React.createElement("button", { onClick: handleFocusNodeClick, disabled: isAppBusy, className: "list-item-action-icon primary-action base-icon-button", 
            "aria-label": `Focus on ${node.name}`, title: `Focus on Node`},
            "🎯"
          ),
          (node.linkedProjectId || incomingLinkSource) && (onNavigateToLinkedProject || handleNavigateToSourceNode) && (
            React.createElement("button", { onClick: handleGoToLinkedProjectClick, disabled: isAppBusy, className: "list-item-action-icon base-icon-button",
              "aria-label": incomingLinkSource ? `Go to source: ${incomingLinkSource.sourceProjectName}` : `Go to linked project: ${node.linkedProjectName}`, 
              title: incomingLinkSource ? `Go to Source: ${incomingLinkSource.sourceProjectName} / ${incomingLinkSource.sourceNodeName}` : `Go to Linked Project: ${node.linkedProjectName || 'Unknown'}`},
              incomingLinkSource ? '↩️' : '↪️'
            )
          )
        )
      ),

      !isCollapsed && node.description && isEffectivelyDescriptionVisible && (
        React.createElement("div", { className: "list-view-item-content" },
          React.createElement("div", { className: "list-view-description-area" }, 
            React.createElement("div", { className: "list-view-description" },
                getHighlightedText(node.description, searchTerm)
            )
          )
        )
      ),

      hasChildren && !isCollapsed && (
        React.createElement("ul", { id: `children-of-${node.id}`, className: "list-view-child-container" },
          node.children.map(child => (
            React.createElement(TechTreeListItem, { 
              key: child.id, node: child,
              showDescriptionsGlobal: showDescriptionsGlobal,
              onToggleLock: onToggleLock,
              onAddQuickChild: onAddQuickChild,
              onNodeImportanceChange: onNodeImportanceChange,
              onOpenNodeEditModal: onOpenNodeEditModal, level: level + 1,
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
          ))
        )
      )
    )
  );
};

const TechTreeListItem = React.memo(TechTreeListItemComponent);
export default TechTreeListItem;
