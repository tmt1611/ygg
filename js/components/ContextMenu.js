import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { NODE_IMPORTANCE_OPTIONS } from '../constants.js';
import { getNodePathString, cleanTreeForExport } from '../utils.js';

const getCopyLabel = (type, copyFeedback, copyError) => {
    if (copyError === type) return "Error!";
    if (copyFeedback === type) return "Copied!";
    switch (type) {
        case 'name': return "Name";
        case 'id': return "ID";
        case 'path': return "Path";
        case 'json': return "Node (JSON)";
        default: return "Copy";
    }
};

const ContextMenu = ({
  isOpen, position, node, techTreeData, onClose, onToggleLock, onChangeImportance, onEditName, onAddChild, onAddQuickChild,
  onSetFocus, onDeleteNode, onLinkToProject, onGoToLinkedProject, onUnlinkProject, onGenerateInsights,
  onLockAllChildren, onUnlockAllChildren, onChangeImportanceOfAllChildren, onDeleteAllChildren,
  onPasteNode,
  modalManager,
  projects, activeProjectId, currentProjectRootId, findLinkSource, handleNavigateToSourceNode,
  linkSourceInfoFromView,
}) => {
  const menuRef = useRef(null);
  const submenuTimerRef = useRef(null);
  const [openSubmenuId, setOpenSubmenuId] = useState(null);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [focusedSubmenuIndex, setFocusedSubmenuIndex] = useState(-1);
  const [menuStyle, setMenuStyle] = useState({});
  const [submenuStyle, setSubmenuStyle] = useState({});
  const [copyFeedback, setCopyFeedback] = useState('');
  const [copyError, setCopyError] = useState('');
  const [canPaste, setCanPaste] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (navigator.clipboard && navigator.clipboard.readText) {
        setCanPaste(true);
      } else {
        setCanPaste(false);
      }
    }
  }, [isOpen]);

  const handleCopy = useCallback((type) => {
    if (!node) return;
    let textToCopy = '';
    switch (type) {
        case 'id': textToCopy = node.id; break;
        case 'name': textToCopy = node.name; break;
        case 'path': textToCopy = getNodePathString(node.id, techTreeData); break;
        case 'json':
            textToCopy = JSON.stringify(cleanTreeForExport(node), null, 2);
            break;
        default: return;
    }
    navigator.clipboard.writeText(textToCopy).then(() => {
        setCopyFeedback(type);
        setCopyError('');
        setTimeout(() => setCopyFeedback(''), 1500);
    }).catch(err => {
        console.error(`Failed to copy ${type}:`, err);
        setCopyError(type);
        setCopyFeedback('');
        setTimeout(() => setCopyError(''), 1500);
    });
  }, [node, techTreeData]);

  const isCurrentNodeRoot = node?.id === currentProjectRootId;
  const incomingLink = useMemo(() => {
    if (isCurrentNodeRoot && activeProjectId && node) {
        return linkSourceInfoFromView || findLinkSource(activeProjectId, projects);
    }
    return null;
  }, [isCurrentNodeRoot, activeProjectId, projects, findLinkSource, node, linkSourceInfoFromView]);

  const menuItems = useMemo(() => {
    if (!node) return [];

    const hasChildren = node.children && node.children.length > 0;

    return [
      // Primary Actions
      { id: 'edit', label: "Edit Details...", icon: '✏️', action: () => onEditName(node) },
      { id: 'add-child', label: "Add Child Node...", icon: '➕', action: () => onAddChild(node) },
      onAddQuickChild && { id: 'add-quick-child', label: "Add Quick Child", icon: '⚡️', action: () => onAddQuickChild(node.id), title: "Adds a new child with a default name, skipping the prompt." },
      !!onSetFocus && { id: 'set-focus', label: "Set as Focus Node", icon: '🎯', action: () => onSetFocus(node.id) },
      { type: 'separator' },
      // State Management
      { id: 'toggle-lock', label: node.isLocked ? 'Unlock Node' : 'Lock Node', icon: node.isLocked ? '🔓' : '🔒', action: () => onToggleLock(node.id) },
      {
        id: 'change-importance', label: "Change Importance", icon: '⚖️', hasSubmenu: true,
        submenu: NODE_IMPORTANCE_OPTIONS.map(opt => ({
          id: `importance-${opt.value}`, label: opt.label,
          action: () => onChangeImportance(node.id, opt.value),
          isChecked: (node.importance || 'common') === opt.value,
        }))
      },
      { type: 'separator' },
      // Structural Actions
      onPasteNode && { id: 'paste-node', label: "Paste Node as Child", icon: '📎', action: () => onPasteNode(node.id), isDisabled: !canPaste, title: canPaste ? "Paste a node (copied from clipboard) as a child of this node" : "Clipboard API not available or permission denied" },
      { type: 'separator' },
      // Submenus
      {
        id: 'ai-actions', label: "AI Actions...", icon: '🤖', hasSubmenu: true,
        submenu: [
          { id: 'ai-quick-edit', label: "Quick Edit with AI...", icon: '✍️', action: () => modalManager.openAiQuickEditModal({ targetNodeId: node.id }), isDisabled: node.isLocked, title: node.isLocked ? "Unlock node to use AI quick edit" : "Make a small, targeted change to this node using an AI prompt" },
          { id: 'ai-insights', label: "Node Insights", icon: '💡', action: () => onGenerateInsights(node) },
        ]
      },
      {
        id: 'link-actions', label: "Project Linking...", icon: '🔗', hasSubmenu: true,
        submenu: [
          ...(node.linkedProjectId ? [
            onGoToLinkedProject && { id: 'go-to-link', label: `Go to: ${node.linkedProjectName || '...'}`, icon: '↪️', title: `Go to project: ${node.linkedProjectName || 'Linked Project'}`, action: () => onGoToLinkedProject(node.linkedProjectId) },
            onUnlinkProject && { id: 'unlink-outgoing', label: "Unlink Outgoing Project", icon: '🚫', isDestructive: true, action: () => onUnlinkProject(node.id) },
          ] : !incomingLink ? [
            onLinkToProject && { id: 'link-project', label: "Link to Project...", icon: '🔗', action: () => onLinkToProject(node.id) },
          ] : []),
          ...(incomingLink ? [
            { id: 'go-to-source', label: `From: ${incomingLink.sourceProjectName.substring(0, 12)}...`, icon: '↩️', title: `From: ${incomingLink.sourceProjectName} / ${incomingLink.sourceNodeName}`, action: () => handleNavigateToSourceNode(incomingLink.sourceProjectId, incomingLink.sourceNodeId) },
            { id: 'unlink-incoming-disabled', label: "Unlink (Incoming)", icon: '🚫', isDisabled: true, title: "Remove link from source project to unlink." },
          ] : [])
        ].filter(Boolean)
      },
      ...(hasChildren ? [
        {
          id: 'bulk-actions', label: "Actions on Children...", icon: '📦', hasSubmenu: true,
          submenu: [
            { id: 'bulk-lock', label: "Lock All Children", icon: '🔒', action: () => onLockAllChildren(node.id) },
            { id: 'bulk-unlock', label: "Unlock All Children", icon: '🔓', action: () => onUnlockAllChildren(node.id) },
            {
              id: 'bulk-set-importance', label: "Set Importance for All...", icon: '⚖️', hasSubmenu: true,
              submenu: NODE_IMPORTANCE_OPTIONS.map(opt => ({
                id: `bulk-importance-${opt.value}`, label: opt.label,
                action: () => onChangeImportanceOfAllChildren(node.id, opt.value),
              }))
            },
            { type: 'separator' },
            { id: 'bulk-delete', label: "Delete All Children...", icon: '🗑️', isDestructive: true, action: () => onDeleteAllChildren(node.id) },
          ]
        }
      ] : []),
      {
        id: 'copy-actions', label: "Copy Data...", icon: '📤', hasSubmenu: true,
        submenu: [
          { id: 'copy-name', label: getCopyLabel('name', copyFeedback, copyError), icon: '🔡', action: () => handleCopy('name') },
          { id: 'copy-id', label: getCopyLabel('id', copyFeedback, copyError), icon: '🆔', action: () => handleCopy('id') },
          { id: 'copy-path', label: getCopyLabel('path', copyFeedback, copyError), icon: '🛤️', action: () => handleCopy('path') },
          { id: 'copy-json', label: getCopyLabel('json', copyFeedback, copyError), icon: '📦', action: () => handleCopy('json'), title: "Copy this node and its children as JSON. Can be used to paste as a child elsewhere." },
        ]
      },
      { type: 'separator' },
      // Destructive Action
      ...(onDeleteNode ? [
        { id: 'delete-node', label: "Delete Node...", icon: '🗑️', isDestructive: true, action: () => onDeleteNode(node.id) }
      ] : [])
    ].filter(Boolean);
  }, [node, onEditName, onAddChild, onAddQuickChild, onToggleLock, onSetFocus, onLinkToProject, onGoToLinkedProject, onUnlinkProject, onDeleteNode, onGenerateInsights, handleCopy, incomingLink, handleNavigateToSourceNode, onChangeImportance, onLockAllChildren, onUnlockAllChildren, onChangeImportanceOfAllChildren, onDeleteAllChildren, copyFeedback, copyError, onPasteNode, canPaste, modalManager]);

  const focusableItems = useMemo(() => menuItems.filter(item => item.type !== 'separator' && !item.isDisabled), [menuItems]);
  const openSubmenuItems = useMemo(() => {
    if (!openSubmenuId) return [];
    const parentItem = menuItems.find(item => item.id === openSubmenuId);
    return parentItem?.submenu || [];
  }, [menuItems, openSubmenuId]);

  useEffect(() => {
    if (isOpen && position && menuRef.current) {
        const menuWidth = menuRef.current.offsetWidth || 220;
        const menuHeight = menuRef.current.offsetHeight || 200;
        const submenuWidth = 180; // Estimated width of submenu
        let finalX = position.x;
        let finalY = position.y;

        if (finalY + menuHeight > window.innerHeight - 10) finalY = window.innerHeight - menuHeight - 10;
        if (finalX + menuWidth > window.innerWidth - 10) finalX = window.innerWidth - menuWidth - 10;

        setMenuStyle({ top: `${Math.max(5, finalY)}px`, left: `${Math.max(5, finalX)}px` });

        if ((finalX + menuWidth + submenuWidth) > window.innerWidth - 10 && finalX > submenuWidth) {
            setSubmenuStyle({ right: '100%', left: 'auto', marginRight: '2px' });
        } else {
            setSubmenuStyle({ left: '100%', right: 'auto', marginLeft: '2px' });
        }
    }
  }, [isOpen, position, openSubmenuId]);

  useEffect(() => {
    if (!isOpen) {
        setOpenSubmenuId(null);
        setFocusedIndex(-1);
        setFocusedSubmenuIndex(-1);
        setCopyFeedback('');
        setCopyError('');
        if (submenuTimerRef.current) clearTimeout(submenuTimerRef.current);
        return;
    }
    
    setFocusedIndex(0); // Focus first item on open

    const handleClickOutside = (event) => { if (menuRef.current && !menuRef.current.contains(event.target)) onClose(); };
    const handleEscapeKey = (event) => { if (event.key === 'Escape') onClose(); };
    
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscapeKey);
    return () => { document.removeEventListener('mousedown', handleClickOutside); document.removeEventListener('keydown', handleEscapeKey); };
  }, [isOpen, onClose]);

  const handleKeyDown = useCallback((event) => {
    if (!isOpen || !node) return;
    
    if (openSubmenuId) {
        event.preventDefault();
        const subItems = openSubmenuItems.filter(item => !item.isDisabled);
        if (subItems.length === 0) return;

        switch (event.key) {
            case 'ArrowUp': setFocusedSubmenuIndex(prev => (prev - 1 + subItems.length) % subItems.length); break;
            case 'ArrowDown': setFocusedSubmenuIndex(prev => (prev + 1) % subItems.length); break;
            case 'Enter': case ' ':
                const subItem = subItems[focusedSubmenuIndex];
                if (subItem?.action) { subItem.action(); onClose(); }
                break;
            case 'Escape': case 'ArrowLeft': setOpenSubmenuId(null); setFocusedSubmenuIndex(-1); break;
        }
    } else {
        if (focusableItems.length === 0) return;
        event.preventDefault();
        switch (event.key) {
            case 'ArrowUp': setFocusedIndex(prev => (prev - 1 + focusableItems.length) % focusableItems.length); break;
            case 'ArrowDown': setFocusedIndex(prev => (prev + 1) % focusableItems.length); break;
            case 'ArrowRight':
            case 'Enter': case ' ':
                const mainItem = focusableItems[focusedIndex];
                if (mainItem?.hasSubmenu) {
                    setOpenSubmenuId(mainItem.id);
                    setFocusedSubmenuIndex(0);
                } else if (mainItem?.action) {
                    mainItem.action();
                    onClose();
                }
                break;
        }
    }
  }, [isOpen, node, openSubmenuId, focusedIndex, focusedSubmenuIndex, focusableItems, openSubmenuItems, onClose]);

  useEffect(() => {
    if (!isOpen || !menuRef.current) return;
    let elementToFocus;
    if (openSubmenuId) {
        const subItems = menuRef.current.querySelectorAll('.submenu button:not([disabled])');
        elementToFocus = subItems[focusedSubmenuIndex];
    } else {
        const mainItems = menuRef.current.querySelectorAll('.main-menu > li > button:not([disabled])');
        elementToFocus = mainItems[focusedIndex];
    }
    elementToFocus?.focus();
  }, [isOpen, openSubmenuId, focusedIndex, focusedSubmenuIndex]);
  
  if (!isOpen || !position || !node) return null;

  const importanceRune = (NODE_IMPORTANCE_OPTIONS.find(opt => opt.value === (node.importance || 'common')) || {}).rune || '•';

  const renderMenuItem = (item, index, isSubmenu = false) => {
    if (item.type === 'separator') return React.createElement("li", { key: `sep-${index}`, role: "separator" }, React.createElement("hr", null));
    
    const focusableList = isSubmenu ? openSubmenuItems.filter(i => !i.isDisabled) : focusableItems;
    const isFocused = isSubmenu ? focusedSubmenuIndex === index : focusedIndex === focusableItems.findIndex(fi => fi.id === item.id);
    const isCopied = item.id.startsWith('copy-') && copyFeedback === item.id.substring(5);
    const hasCopyError = item.id.startsWith('copy-') && copyError === item.id.substring(5);

    return React.createElement("li", { key: item.id, role: "none" },
      React.createElement("button", {
        role: item.isChecked !== undefined ? "menuitemradio" : "menuitem",
        className: `context-menu-item ${isFocused ? 'focused' : ''} ${item.isDestructive ? 'destructive' : ''}`,
        onClick: () => {
            if (item.hasSubmenu) {
                setOpenSubmenuId(item.id);
                setFocusedSubmenuIndex(0);
            } else if (item.action) {
                item.action();
                onClose();
            }
        },
        onMouseEnter: () => {
            if (submenuTimerRef.current) clearTimeout(submenuTimerRef.current);
            if (isSubmenu) {
                setFocusedSubmenuIndex(index);
            } else {
                setFocusedIndex(focusableItems.findIndex(fi => fi.id === item.id));
                if (item.hasSubmenu) {
                    setOpenSubmenuId(item.id);
                } else {
                    // This is handled by the main div's onMouseLeave timer now
                    // setOpenSubmenuId(null);
                }
            }
        },
        disabled: item.isDisabled,
        title: item.title || item.label,
        "aria-haspopup": !!item.hasSubmenu,
        "aria-expanded": item.hasSubmenu ? openSubmenuId === item.id : undefined,
        "aria-checked": item.isChecked,
      },
        React.createElement("span", { className: "context-menu-icon" }, isCopied ? '✅' : (hasCopyError ? '❌' : item.icon)),
        React.createElement("span", { className: "context-menu-label" }, item.label),
        item.hasSubmenu && React.createElement("span", { className: "context-menu-submenu-indicator" }, "›")
      )
    );
  };

  const handleMouseLeaveMenu = () => {
    submenuTimerRef.current = setTimeout(() => {
      setOpenSubmenuId(null);
    }, 200);
  };

  const handleMouseEnterMenu = () => {
    if (submenuTimerRef.current) {
      clearTimeout(submenuTimerRef.current);
    }
  };

  return (
    React.createElement("div", { ref: menuRef, className: "context-menu", style: menuStyle, role: "menu", "aria-orientation": "vertical", "aria-labelledby": "context-menu-node-name", onKeyDown: handleKeyDown, onMouseLeave: handleMouseLeaveMenu, onMouseEnter: handleMouseEnterMenu },
      React.createElement("div", { id: "context-menu-node-name", className: "context-menu-header" },
        React.createElement("span", { className: "context-menu-icon", "aria-hidden": "true" }, importanceRune),
        React.createElement("strong", { title: node.name, style: { flexGrow: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis' } }, node.name.length > 25 ? `${node.name.substring(0, 22)}...` : node.name),
        React.createElement("button", {
          onClick: onClose,
          className: "base-icon-button context-menu-close-btn",
          title: "Close Menu (Esc)",
          "aria-label": "Close context menu"
        }, "×")
      ),
      React.createElement("ul", { className: "main-menu" },
        menuItems.map((item) => renderMenuItem(item, -1, false))
      ),
      openSubmenuId && openSubmenuItems.length > 0 && (
        React.createElement("div", { className: "context-menu submenu", role: "menu", style: submenuStyle, onMouseEnter: handleMouseEnterMenu },
          React.createElement("ul", null,
            openSubmenuItems.map((item, index) => renderMenuItem(item, index, true))
          )
        )
      )
    )
  );
};

export default ContextMenu;