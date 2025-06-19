import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { NODE_IMPORTANCE_OPTIONS } from '../constants.js';

const ContextMenu = ({
  isOpen, position, node, onClose, onToggleLock, onChangeImportance, onEditName, onAddChild,
  onSetFocus, onDeleteNode, onLinkToProject, onGoToLinkedProject, onUnlinkProject, onGenerateInsights, onSwitchToAiOps,
  projects, activeProjectId, currentProjectRootId, findLinkSource, handleNavigateToSourceNode,
  linkSourceInfoFromView,
}) => {
  const menuRef = useRef(null);
  const [isImportanceSubMenuOpen, setIsImportanceSubMenuOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(0);
  const [focusedImportanceIndex, setFocusedImportanceIndex] = useState(0);
  const [menuStyle, setMenuStyle] = useState({});
  const [submenuStyle, setSubmenuStyle] = useState({});
  const [copyFeedback, setCopyFeedback] = useState('');

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
        setTimeout(() => setCopyFeedback(''), 1500);
    }).catch(err => console.error(`Failed to copy ${type}:`, err));
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
    
    const items = [
        { id: 'edit', label: "Edit Details...", icon: '✏️', action: () => onEditName(node) },
        { id: 'add-child', label: "Add Child Node...", icon: '➕', action: () => onAddChild(node) },
        { type: 'separator' },
        { id: 'ai-insights', label: "AI Insights", icon: '💡', action: () => { onGenerateInsights(node); } },
        { id: 'ai-modify', label: "AI Modify...", icon: '🤖', action: () => { onSwitchToAiOps(node); } },
        { type: 'separator' },
        { id: 'toggle-lock', label: node.isLocked ? 'Unlock Node' : 'Lock Node', icon: node.isLocked ? '🔓' : '🔒', action: () => onToggleLock(node.id) },
        {
            id: 'change-importance', label: "Change Importance", icon: '⚖️',
            action: () => {
                setIsImportanceSubMenuOpen(true);
                setFocusedImportanceIndex(NODE_IMPORTANCE_OPTIONS.findIndex(opt => opt.value === (node.importance || 'common')));
            },
            hasSubmenu: true
        },
    ];

    if (onSetFocus) items.push({ id: 'set-focus', label: "Set as Focus Node", icon: '🎯', action: () => onSetFocus(node.id) });

    if (node.linkedProjectId) {
        if (onGoToLinkedProject) items.push({ id: 'go-to-link', label: `Go to: ${node.linkedProjectName || '...'}`, icon: '↪️', title: `Go to project: ${node.linkedProjectName || 'Linked Project'}`, action: () => onGoToLinkedProject(node.linkedProjectId) });
        if (onUnlinkProject) items.push({ id: 'unlink-outgoing', label: "Unlink Outgoing Project", icon: '🚫', isDestructive: true, action: () => onUnlinkProject(node.id) });
    } else if (!incomingLink) {
        if (onLinkToProject) items.push({ id: 'link-project', label: "Link to Project...", icon: '🔗', action: () => onLinkToProject(node.id) });
    }

    if (incomingLink) {
        items.push({ id: 'go-to-source', label: `From: ${incomingLink.sourceProjectName.substring(0, 12)}...`, icon: '↩️', title: `From: ${incomingLink.sourceProjectName} / ${incomingLink.sourceNodeName}`, action: () => handleNavigateToSourceNode(incomingLink.sourceProjectId, incomingLink.sourceNodeId) });
        items.push({ id: 'unlink-incoming-disabled', label: "Unlink (Incoming)", icon: '🚫', isDisabled: true, title: "Remove link from source project to unlink." });
    }

    items.push(
        { type: 'separator' },
        { id: 'copy-name', label: copyFeedback === 'name' ? 'Copied!' : "Copy Name", icon: '📋', action: () => handleCopy('name') },
        { id: 'copy-id', label: copyFeedback === 'id' ? 'Copied!' : "Copy ID", icon: '🆔', action: () => handleCopy('id') },
        { id: 'copy-json', label: copyFeedback === 'json' ? 'Copied!' : "Copy as JSON", icon: '📦', action: () => handleCopy('json') }
    );

    if (onDeleteNode) {
        items.push({ type: 'separator' });
        items.push({ id: 'delete-node', label: "Delete Node...", icon: '🗑️', isDestructive: true, action: () => onDeleteNode(node.id) });
    }

    return items;
  }, [node, onEditName, onAddChild, onToggleLock, onSetFocus, onLinkToProject, onGoToLinkedProject, onUnlinkProject, onDeleteNode, onGenerateInsights, onSwitchToAiOps, handleCopy, copyFeedback, incomingLink, handleNavigateToSourceNode]);

  const focusableItems = useMemo(() => menuItems.filter(item => item.type !== 'separator' && !item.isDisabled), [menuItems]);

  useEffect(() => {
    if (isOpen && position && menuRef.current) {
        const menuWidth = menuRef.current.offsetWidth || 220;
        const menuHeight = menuRef.current.offsetHeight || 200;
        const submenuWidth = 120; // Estimated width of submenu
        let finalX = position.x;
        let finalY = position.y;

        // Adjust Y position
        if (finalY + menuHeight > window.innerHeight - 10) {
            finalY = window.innerHeight - menuHeight - 10;
        }

        // Adjust X position
        if (finalX + menuWidth > window.innerWidth - 10) {
            finalX = window.innerWidth - menuWidth - 10;
        }

        setMenuStyle({ top: `${Math.max(5, finalY)}px`, left: `${Math.max(5, finalX)}px` });

        // Decide submenu position based on final menu position
        if ((finalX + menuWidth + submenuWidth) > window.innerWidth - 10 && finalX > submenuWidth) {
            // Not enough space on the right, but enough on the left to flip
            setSubmenuStyle({ right: '100%', left: 'auto', marginRight: '2px' });
        } else {
            // Default to the right
            setSubmenuStyle({ left: '100%', right: 'auto', marginLeft: '2px' });
        }
    }
  }, [isOpen, position, isImportanceSubMenuOpen]);

  useEffect(() => {
    if (!isOpen) {
        setIsImportanceSubMenuOpen(false);
        setFocusedIndex(0);
        setCopyFeedback('');
        return;
    }
    const menuItemsToFocus = menuRef.current?.querySelectorAll('button[role="menuitem"]:not([disabled])');
    if (menuItemsToFocus?.[focusedIndex]) {
        menuItemsToFocus[focusedIndex].focus();
    }
    const handleClickOutside = (event) => { if (menuRef.current && !menuRef.current.contains(event.target)) onClose(); };
    const handleEscapeKey = (event) => { if (event.key === 'Escape') onClose(); };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscapeKey);
    return () => { document.removeEventListener('mousedown', handleClickOutside); document.removeEventListener('keydown', handleEscapeKey); };
  }, [isOpen, onClose, focusedIndex]);

  const handleKeyDown = useCallback((event) => {
    if (!isOpen || !node) return;
    event.preventDefault();
    
    if (isImportanceSubMenuOpen) {
        switch (event.key) {
            case 'ArrowUp': setFocusedImportanceIndex(prev => Math.max(0, prev - 1)); break;
            case 'ArrowDown': setFocusedImportanceIndex(prev => Math.min(NODE_IMPORTANCE_OPTIONS.length - 1, prev + 1)); break;
            case 'Enter': case ' ': onChangeImportance(node.id, NODE_IMPORTANCE_OPTIONS[focusedImportanceIndex].value); onClose(); break;
            case 'Escape': case 'ArrowLeft': setIsImportanceSubMenuOpen(false); break;
        }
    } else {
        switch (event.key) {
            case 'ArrowUp': setFocusedIndex(prev => Math.max(0, prev - 1)); break;
            case 'ArrowDown': setFocusedIndex(prev => Math.min(focusableItems.length - 1, prev + 1)); break;
            case 'Enter': case ' ': case 'ArrowRight':
                const currentItem = focusableItems[focusedIndex];
                if (currentItem?.action) {
                    if (currentItem.hasSubmenu) currentItem.action();
                    else { currentItem.action(); onClose(); }
                }
                break;
        }
    }
  }, [isOpen, node, isImportanceSubMenuOpen, focusedIndex, focusedImportanceIndex, focusableItems, onClose, onChangeImportance]);

  useEffect(() => {
    if (!isOpen || !menuRef.current) return;
    const focusableElements = isImportanceSubMenuOpen
        ? menuRef.current.querySelectorAll('.submenu button')
        : menuRef.current.querySelectorAll('.main-menu button:not([disabled])');
    const indexToFocus = isImportanceSubMenuOpen ? focusedImportanceIndex : focusedIndex;
    if (focusableElements?.[indexToFocus]) {
        focusableElements[indexToFocus].focus();
    }
  }, [isOpen, isImportanceSubMenuOpen, focusedIndex, focusedImportanceIndex]);
  
  if (!isOpen || !position || !node) return null;

  return (
    React.createElement("div", { ref: menuRef, className: "context-menu", style: menuStyle, role: "menu", "aria-orientation": "vertical", "aria-labelledby": "context-menu-node-name", onKeyDown: handleKeyDown },
      React.createElement("div", { id: "context-menu-node-name", className: "context-menu-header" },
        "Node: ", React.createElement("strong", null, node.name.length > 25 ? `${node.name.substring(0, 22)}...` : node.name)
      ),
      React.createElement("ul", { className: "main-menu" },
        menuItems.map((item, index) => {
          if (item.type === 'separator') return React.createElement("li", { key: `sep-${index}`, role: "separator" }, React.createElement("hr", null));
          const isFocused = !isImportanceSubMenuOpen && focusableItems[focusedIndex]?.id === item.id;
          return React.createElement("li", { key: item.id, role: "none" },
            React.createElement("button", {
              role: "menuitem",
              className: `context-menu-item ${isFocused ? 'focused' : ''} ${item.isDestructive ? 'destructive' : ''}`,
              onClick: item.action,
              disabled: item.isDisabled,
              title: item.title || item.label,
              "aria-haspopup": item.hasSubmenu,
              "aria-expanded": item.hasSubmenu ? isImportanceSubMenuOpen : undefined,
            },
              React.createElement("span", { className: "context-menu-icon" }, item.icon),
              React.createElement("span", { className: "context-menu-label" }, item.label),
              item.hasSubmenu && React.createElement("span", { className: "context-menu-submenu-indicator" }, "›")
            )
          );
        })
      ),
      isImportanceSubMenuOpen && (
        React.createElement("div", { className: "context-menu submenu", role: "menu", style: submenuStyle },
          NODE_IMPORTANCE_OPTIONS.map((opt, index) => (
            React.createElement("button", {
              key: opt.value,
              role: "menuitemradio",
              className: `context-menu-item ${focusedImportanceIndex === index ? 'focused' : ''}`,
              "aria-checked": node.importance === opt.value,
              onClick: () => { onChangeImportance(node.id, opt.value); onClose(); },
            }, opt.label)
          ))
        )
      )
    )
  );
};

export default ContextMenu;