import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { NODE_IMPORTANCE_OPTIONS } from '../constants.js';

const ContextMenu = ({
  isOpen, position, node, onClose, onToggleLock, onChangeImportance, onEditName, onAddChild,
  onSetFocus, onDeleteNode, onLinkToProject, onGoToLinkedProject, onUnlinkProject, onGenerateInsights, onSwitchToAiOps,
  projects, activeProjectId, currentProjectRootId, findLinkSource, handleNavigateToSourceNode,
  linkSourceInfoFromView,
}) => {
  const menuRef = useRef(null);
  const [openSubmenuId, setOpenSubmenuId] = useState(null);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [focusedSubmenuIndex, setFocusedSubmenuIndex] = useState(-1);
  const [menuStyle, setMenuStyle] = useState({});
  const [submenuStyle, setSubmenuStyle] = useState({});
  const [copyFeedback, setCopyFeedback] = useState('');
  const [copyError, setCopyError] = useState('');

  const handleCopy = useCallback((type) => {
    if (!node) return;
    let textToCopy = '';
    switch (type) {
        case 'id': textToCopy = node.id; break;
        case 'name': textToCopy = node.name; break;
        case 'json':
            const cleanNodeForExport = (nodeToClean) => {
                const { _parentId, _changeStatus, _modificationDetails, _oldParentId, ...rest } = nodeToClean;
                const cleanedNode = { ...rest };
                if (cleanedNode.children) cleanedNode.children = cleanedNode.children.map(cleanNodeForExport);
                return cleanedNode;
            };
            textToCopy = JSON.stringify(cleanNodeForExport(node), null, 2);
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
  }, [node]);

  const isCurrentNodeRoot = node?.id === currentProjectRootId;
  const incomingLink = useMemo(() => {
    if (isCurrentNodeRoot && activeProjectId && node) {
        return linkSourceInfoFromView || findLinkSource(activeProjectId, projects);
    }
    return null;
  }, [isCurrentNodeRoot, activeProjectId, projects, findLinkSource, node, linkSourceInfoFromView]);

  const menuItems = useMemo(() => {
    if (!node) return [];

    const importanceSubmenu = NODE_IMPORTANCE_OPTIONS.map(opt => ({
        id: `importance-${opt.value}`,
        label: opt.label,
        action: () => onChangeImportance(node.id, opt.value),
        isChecked: (node.importance || 'common') === opt.value,
    }));

    const aiSubmenu = [
        { id: 'ai-insights', label: "Node Insights", icon: '💡', action: () => { onGenerateInsights(node); } },
        { id: 'ai-modify', label: "Modify with AI...", icon: '🤖', action: () => { onSwitchToAiOps(node); } },
    ];
    
    const copySubmenu = [
        { id: 'copy-name', label: "Copy Name", icon: '📋', action: () => handleCopy('name') },
        { id: 'copy-id', label: "Copy ID", icon: '🆔', action: () => handleCopy('id') },
        { id: 'copy-json', label: "Copy as JSON", icon: '📦', action: () => handleCopy('json') }
    ];

    const items = [
        { id: 'edit', label: "Edit Details...", icon: '✏️', action: () => onEditName(node) },
        { id: 'add-child', label: "Add Child Node...", icon: '➕', action: () => onAddChild(node) },
        { id: 'set-focus', label: "Set as Focus Node", icon: '🎯', action: () => onSetFocus(node.id), condition: !!onSetFocus },
        { type: 'separator' },
        { id: 'toggle-lock', label: node.isLocked ? 'Unlock Node' : 'Lock Node', icon: node.isLocked ? '🔓' : '🔒', action: () => onToggleLock(node.id) },
        { id: 'change-importance', label: "Change Importance", icon: '⚖️', hasSubmenu: true, submenu: importanceSubmenu },
        { type: 'separator' },
        { id: 'ai-actions', label: "AI Actions...", icon: '🤖', hasSubmenu: true, submenu: aiSubmenu },
    ];

    const linkSubmenu = [];
    if (node.linkedProjectId) {
        if (onGoToLinkedProject) linkSubmenu.push({ id: 'go-to-link', label: `Go to: ${node.linkedProjectName || '...'}`, icon: '↪️', title: `Go to project: ${node.linkedProjectName || 'Linked Project'}`, action: () => onGoToLinkedProject(node.linkedProjectId) });
        if (onUnlinkProject) linkSubmenu.push({ id: 'unlink-outgoing', label: "Unlink Outgoing Project", icon: '🚫', isDestructive: true, action: () => onUnlinkProject(node.id) });
    } else if (!incomingLink) {
        if (onLinkToProject) linkSubmenu.push({ id: 'link-project', label: "Link to Project...", icon: '🔗', action: () => onLinkToProject(node.id) });
    }
    if (incomingLink) {
        linkSubmenu.push({ id: 'go-to-source', label: `From: ${incomingLink.sourceProjectName.substring(0, 12)}...`, icon: '↩️', title: `From: ${incomingLink.sourceProjectName} / ${incomingLink.sourceNodeName}`, action: () => handleNavigateToSourceNode(incomingLink.sourceProjectId, incomingLink.sourceNodeId) });
        linkSubmenu.push({ id: 'unlink-incoming-disabled', label: "Unlink (Incoming)", icon: '🚫', isDisabled: true, title: "Remove link from source project to unlink." });
    }
    if (linkSubmenu.length > 0) {
        items.push({ id: 'link-actions', label: "Project Linking...", icon: '🔗', hasSubmenu: true, submenu: linkSubmenu });
    }

    items.push({ id: 'copy-actions', label: "Copy...", icon: '📋', hasSubmenu: true, submenu: copySubmenu });

    if (onDeleteNode) {
        items.push({ type: 'separator' });
        items.push({ id: 'delete-node', label: "Delete Node...", icon: '🗑️', isDestructive: true, action: () => onDeleteNode(node.id) });
    }

    return items.filter(item => item.condition !== false);
  }, [node, onEditName, onAddChild, onToggleLock, onSetFocus, onLinkToProject, onGoToLinkedProject, onUnlinkProject, onDeleteNode, onGenerateInsights, onSwitchToAiOps, handleCopy, incomingLink, handleNavigateToSourceNode, onChangeImportance]);

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
            if (isSubmenu) {
                setFocusedSubmenuIndex(index);
            } else {
                setFocusedIndex(focusableItems.findIndex(fi => fi.id === item.id));
                if (item.hasSubmenu) setOpenSubmenuId(item.id);
                else setOpenSubmenuId(null);
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

  return (
    React.createElement("div", { ref: menuRef, className: "context-menu", style: menuStyle, role: "menu", "aria-orientation": "vertical", "aria-labelledby": "context-menu-node-name", onKeyDown: handleKeyDown, onMouseLeave: () => setOpenSubmenuId(null) },
      React.createElement("div", { id: "context-menu-node-name", className: "context-menu-header" },
        React.createElement("span", { style: { flexGrow: 1 } }, "Node: ", React.createElement("strong", null, node.name.length > 25 ? `${node.name.substring(0, 22)}...` : node.name)),
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
        React.createElement("div", { className: "context-menu submenu", role: "menu", style: submenuStyle },
          React.createElement("ul", null,
            openSubmenuItems.map((item, index) => renderMenuItem(item, index, true))
          )
        )
      )
    )
  );
};

export default ContextMenu;