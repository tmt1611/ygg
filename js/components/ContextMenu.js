
import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';

const NODE_IMPORTANCE_OPTIONS = [
    { value: 'minor', label: 'Minor' },
    { value: 'common', label: 'Common' },
    { value: 'major', label: 'Major' },
];

const ContextMenu = ({
  isOpen, position, node, onClose, onToggleLock, onChangeImportance, onEditName, onAddChild,
  onSetFocus, onDeleteNode, onLinkToProject, onGoToLinkedProject, onUnlinkProject,  
  projects, activeProjectId, currentProjectRootId, findLinkSource, handleNavigateToSourceNode,
  linkSourceInfoFromView,
}) => {
  const menuRef = useRef(null);
  const [isImportanceSubMenuOpen, setIsImportanceSubMenuOpen] = useState(false);
  const [focusedItemIndex, setFocusedItemIndex] = useState(0); 
  const [focusedImportanceIndex, setFocusedImportanceIndex] = useState(0);
  const [menuStyle, setMenuStyle] = useState({});
  const [copyFeedback, setCopyFeedback] = useState({});

  const baseMenuStyle = {
    background: 'var(--panel-bg)', color: 'var(--text-primary)', border: '1px solid var(--border-color-strong)', 
    borderRadius: 'var(--border-radius)', padding: '5px 0', minWidth: '220px', 
    boxShadow: 'var(--box-shadow-md)', zIndex: 1010 
  };
  
  const basicButtonStyle = {
      display: 'block', width: '100%', textAlign: 'left', padding: '10px 15px', 
      fontSize: '0.95em', background: 'none', border: 'none', cursor: 'pointer',
      color: 'var(--text-primary)', transition: 'background-color 0.1s ease-in-out', position: 'relative', 
  };
  
  const focusedStyle = { backgroundColor: 'var(--primary-accent-hover-bg)', color: 'var(--primary-accent-dark)' };

  const changeImportanceActionRef = useRef(() => { 
    setIsImportanceSubMenuOpen(true); 
    setFocusedImportanceIndex(NODE_IMPORTANCE_OPTIONS.findIndex(opt => opt.value === (node?.importance || 'common'))); 
  });

  const handleCopy = useCallback((type) => {
    if (!node) return;

    let textToCopy = '';
    switch (type) {
      case 'id': textToCopy = node.id; break;
      case 'name': textToCopy = node.name; break;
      case 'json': {
        const cleanNodeForExport = (nodeToClean) => {
            const { _parentId, _changeStatus, _modificationDetails, _oldParentId, ...rest } = nodeToClean;
            const cleanedNode = { ...rest };
            if (cleanedNode.children) {
                cleanedNode.children = cleanedNode.children.map(cleanNodeForExport);
            }
            return cleanedNode;
        };
        textToCopy = JSON.stringify(cleanNodeForExport(node), null, 2);
        break;
      }
      default: return;
    }

    navigator.clipboard.writeText(textToCopy).then(() => {
      setCopyFeedback(prev => ({ ...prev, [type]: true }));
      setTimeout(() => setCopyFeedback(prev => ({ ...prev, [type]: false })), 1500);
    }).catch(err => {
      console.error(`Failed to copy ${type}:`, err);
    });
  }, [node]);

  const isCurrentNodeRoot = node?.id === currentProjectRootId;
  const incomingLink = useMemo(() => {
    if (isCurrentNodeRoot && activeProjectId && node) { 
        return linkSourceInfoFromView || findLinkSource(activeProjectId, projects);
    }
    return null;
  }, [isCurrentNodeRoot, activeProjectId, projects, findLinkSource, node, linkSourceInfoFromView]);


  const { menuItemsJsx, menuActions } = useMemo(() => {
    const items = [];
    const actions = [];
    let currentFocusableIndex = 0; 

    const addItemToLists = (
        action, 
        label, 
        options = {}
    ) => {
        const focusIndex = currentFocusableIndex;
        actions.push(options.isDisabled ? null : action); 
        items.push(
            React.createElement("li", { role: "none", key: options.id || label },
                React.createElement("button", { 
                    style: { 
                        ...basicButtonStyle, 
                        ...(focusedItemIndex === focusIndex && !options.isDisabled ? focusedStyle : {}),
                        ...(options.isDestructive && !options.isDisabled ? { color: 'var(--error-color)'} : {}),
                        ...(options.isDestructive && focusedItemIndex === focusIndex && !options.isDisabled ? { backgroundColor: 'var(--error-bg)', color: 'var(--error-color)'} : {}),
                        ...(options.hasSubmenu && options.isSubmenuOpen ? {backgroundColor: 'var(--primary-accent-hover-bg)', color: 'var(--primary-accent-dark)'} : {}),
                        ...(options.isDisabled ? { color: 'var(--disabled-text)', cursor: 'not-allowed', opacity: 0.6 } : {})
                    }, 
                    role: "menuitem", 
                    onClick: !options.isDisabled && action ? () => { action(); if (!options.hasSubmenu) onClose(); } : undefined, 
                    tabIndex: -1, 
                    "aria-haspopup": options.hasSubmenu,
                    "aria-expanded": options.hasSubmenu ? options.isSubmenuOpen : undefined,
                    disabled: options.isDisabled,
                    title: options.title || label
                },
                    options.icon && React.createElement("span", { style: { marginRight: '10px', display: 'inline-block', width: '1em', textAlign: 'center' }, "aria-hidden": "true" }, options.icon),
                    label,
                    options.hasSubmenu && React.createElement("span", { className: "context-menu-submenu-indicator" }, "➡️")
                )
            )
        );
        if (!options.isDisabled) currentFocusableIndex++;
    };

    if (node) {
        addItemToLists(() => onEditName(), "Edit Details...", {id: 'edit', icon: '✏️'});
        addItemToLists(() => onAddChild(), "Add Child Node...", {id: 'add-child', icon: '➕'});
        items.push(React.createElement("li", { role: "none", key: "sep1" }, React.createElement("hr", null))); 
        addItemToLists(() => onToggleLock(), node.isLocked ? 'Unlock Node' : 'Lock Node', {id: 'toggle-lock', icon: node.isLocked ? '🔓' : '🔒'});
        addItemToLists(changeImportanceActionRef.current, "Change Importance", { hasSubmenu: true, isSubmenuOpen: isImportanceSubMenuOpen, id: 'change-importance', icon: '⚖️' });
        
        if (onSetFocus) addItemToLists(() => onSetFocus(), "Set as Focus Node", {id: 'set-focus', icon: '🎯'});

        if (node.linkedProjectId) {
            if (onGoToLinkedProject) addItemToLists(() => onGoToLinkedProject(), `Go to: ${node.linkedProjectName || '...'}`, {id: 'go-to-link', icon: '↪️', title: `Go to project: ${node.linkedProjectName || 'Linked Project'}`});
            if (onUnlinkProject) addItemToLists(() => onUnlinkProject(), "Unlink Outgoing Project", {isDestructive: true, id: 'unlink-outgoing', icon: '🚫'});
        } else if (!incomingLink) { 
            if (onLinkToProject) addItemToLists(() => onLinkToProject(), "Link to Project...", {id: 'link-project', icon: '🔗'});
        }

        if (incomingLink) {
            addItemToLists(
                () => handleNavigateToSourceNode(incomingLink.sourceProjectId, incomingLink.sourceNodeId),
                `From: ${incomingLink.sourceProjectName.substring(0,12)}...`,
                {id: 'go-to-source', icon: '↩️', title: `From: ${incomingLink.sourceProjectName} / ${incomingLink.sourceNodeName}`}
            );
            addItemToLists(null, "Unlink (Incoming)", { id: 'unlink-incoming-disabled', isDisabled: true, title: "Remove link from source project to unlink.", icon: '🚫' });
        }
        
        items.push(React.createElement("li", { role: "none", key: "sep2" }, React.createElement("hr", null)));
        addItemToLists(() => handleCopy('name'), `Copy Name`, {id: 'copy-name', icon: copyFeedback.name ? '✅' : '📋'});
        addItemToLists(() => handleCopy('id'), `Copy ID`, {id: 'copy-id', icon: copyFeedback.id ? '✅' : '🆔'});
        addItemToLists(() => handleCopy('json'), `Copy as JSON`, {id: 'copy-json', icon: copyFeedback.json ? '✅' : '📦'});
        if (onDeleteNode) {
            items.push(React.createElement("li", { role: "none", key: "sep-delete" }, React.createElement("hr", null)));
            addItemToLists(() => onDeleteNode(), "Delete Node...", {isDestructive: true, id: 'delete-node', icon: '🗑️'});
        }
    }
    return { menuItemsJsx: items, menuActions: actions.filter(a => a !== null) };
  }, [node, onEditName, onAddChild, onToggleLock, onSetFocus, onLinkToProject, onGoToLinkedProject, onUnlinkProject, onDeleteNode, handleCopy, copyFeedback, isImportanceSubMenuOpen, focusedItemIndex, onClose, incomingLink, handleNavigateToSourceNode]);


  useEffect(() => {
    if (isOpen && position && menuRef.current) {
      const menuWidth = menuRef.current.offsetWidth || 220; 
      const menuHeight = menuRef.current.offsetHeight || 200; 
      let { x, y } = position;
      if (x + menuWidth > window.innerWidth - 10) x = window.innerWidth - menuWidth - 10; 
      if (y + menuHeight > window.innerHeight - 10) y = window.innerHeight - menuHeight - 10; 
      setMenuStyle({ top: Math.max(5,y), left: Math.max(5,x), position: 'fixed' });
    }
  }, [isOpen, position]);


  useEffect(() => {
    if (!isOpen) {
      setIsImportanceSubMenuOpen(false);
      setFocusedItemIndex(0);
      setCopyFeedback({});
      return;
    }
    const menuItemsToFocus = menuRef.current?.querySelectorAll('button[role="menuitem"]:not([disabled])');
    if (menuItemsToFocus && menuItemsToFocus.length > focusedItemIndex) {
        (menuItemsToFocus[focusedItemIndex])?.focus();
    }
    const handleClickOutside = (event) => { if (menuRef.current && !menuRef.current.contains(event.target)) onClose(); };
    const handleEscapeKey = (event) => { if (event.key === 'Escape') onClose(); };
    document.addEventListener('mousedown', handleClickOutside); document.addEventListener('keydown', handleEscapeKey);
    return () => { document.removeEventListener('mousedown', handleClickOutside); document.removeEventListener('keydown', handleEscapeKey); };
  }, [isOpen, onClose]); 

  const handleKeyDown = useCallback((event) => {
    if (!isOpen || !node) return;
    
    if (isImportanceSubMenuOpen) {
      switch (event.key) {
        case 'ArrowUp': event.preventDefault(); setFocusedImportanceIndex(prev => Math.max(0, prev - 1)); break;
        case 'ArrowDown': event.preventDefault(); setFocusedImportanceIndex(prev => Math.min(NODE_IMPORTANCE_OPTIONS.length - 1, prev + 1)); break;
        case 'Enter': case ' ': event.preventDefault(); onChangeImportance(NODE_IMPORTANCE_OPTIONS[focusedImportanceIndex].value); setIsImportanceSubMenuOpen(false); onClose(); break;
        case 'Escape': case 'ArrowLeft': event.preventDefault(); setIsImportanceSubMenuOpen(false); 
            const changeImportanceActionIndex = menuActions.findIndex(action => action === changeImportanceActionRef.current);
            if (changeImportanceActionIndex !== -1) setFocusedItemIndex(changeImportanceActionIndex);
            break; 
        default: break;
      }
    } else {
      const currentAction = menuActions[focusedItemIndex];
      switch (event.key) {
        case 'ArrowUp': event.preventDefault(); setFocusedItemIndex(prev => Math.max(0, prev - 1)); break;
        case 'ArrowDown': event.preventDefault(); setFocusedItemIndex(prev => Math.min(menuActions.length - 1, prev + 1)); break;
        case 'Enter': case ' ':
          event.preventDefault();
          if (currentAction) currentAction(); 
          break;
        case 'ArrowRight':
          if (currentAction === changeImportanceActionRef.current) {
            event.preventDefault(); setIsImportanceSubMenuOpen(true);
            setFocusedImportanceIndex(NODE_IMPORTANCE_OPTIONS.findIndex(opt => opt.value === (node?.importance || 'common')));
          }
          break;
        default: break;
      }
    }
  }, [isOpen, node, isImportanceSubMenuOpen, focusedItemIndex, focusedImportanceIndex, menuActions, onClose, onChangeImportance]);


  useEffect(() => { 
    if (isOpen && menuRef.current) {
      if (isImportanceSubMenuOpen) {
        const importanceItems = menuRef.current.querySelectorAll('button[role="menuitemradio"]');
        (importanceItems[focusedImportanceIndex])?.focus();
      } else {
        const mainItems = menuRef.current.querySelectorAll('button[role="menuitem"]:not([disabled])');
        if (mainItems.length > focusedItemIndex) {
            (mainItems[focusedItemIndex])?.focus();
        } else if (mainItems.length > 0) { 
            (mainItems[0])?.focus();
            setFocusedItemIndex(0);
        }
      }
    }
  }, [isOpen, isImportanceSubMenuOpen, focusedItemIndex, focusedImportanceIndex]);


  if (!isOpen || !position || !node) return null;

  return (
    React.createElement("div", { ref: menuRef, className: "minimal-context-menu", style: { ...baseMenuStyle, ...menuStyle }, role: "menu",
      "aria-orientation": "vertical", "aria-labelledby": "context-menu-node-name", onKeyDown: handleKeyDown },
      React.createElement("div", { id: "context-menu-node-name", style: { padding: '8px 15px', fontSize: '0.85em', color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-color)', marginBottom: '4px' }},
        "Node: ", React.createElement("strong", { style: { color: 'var(--text-primary)' }}, node.name.length > 25 ? node.name.substring(0,22) + '...' : node.name)
      ),
      React.createElement("ul", { style: { listStyle: 'none', padding: 0, margin: 0 }}, menuItemsJsx),
      isImportanceSubMenuOpen && (
        React.createElement("div", { style: { position: 'absolute', left: '100%', top: menuRef.current?.children[1]?.children[3] instanceof HTMLElement ? (menuRef.current.children[1].children[3]).offsetTop : 0, background: 'var(--panel-bg)', border: '1px solid var(--border-color-strong)', borderRadius: 'var(--border-radius)', boxShadow: 'var(--box-shadow-md)', padding: '5px 0', zIndex: 1011, minWidth: '120px' }, role: "menu", "aria-orientation": "vertical"},
          NODE_IMPORTANCE_OPTIONS.map((importanceOption, index) => ( 
            React.createElement("li", { role: "none", key: importanceOption.value },
                React.createElement("button", { style: { ...basicButtonStyle, ...(focusedImportanceIndex === index ? focusedStyle : {}), fontWeight: node.importance === importanceOption.value ? '600' : 'normal', color: node.importance === importanceOption.value ? 'var(--primary-accent-dark)' : 'var(--text-primary)', }, 
                    role: "menuitemradio", "aria-checked": node.importance === importanceOption.value, 
                    onClick: () => { onChangeImportance(importanceOption.value); onClose(); }, tabIndex: -1}, 
                    importanceOption.label 
                )
            ))
          )
        )
      )
    )
  );
};

export default ContextMenu;
