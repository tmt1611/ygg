import React, { useEffect, useRef, useState, useCallback } from 'react';

const ViewContextMenu = ({ isOpen, config, onClose }) => {
    const menuRef = useRef(null);
    const [menuStyle, setMenuStyle] = useState({});
    const [focusedIndex, setFocusedIndex] = useState(-1);

    const menuItems = React.useMemo(() => {
        if (!config || !config.actions) return [];
        const { actions } = config;
        const items = [
            { id: 'reset-zoom', label: 'Reset View', icon: '🎯', action: actions.onResetZoom, title: "Reset zoom and pan to default" },
        ];

        if (actions.onAddChildToRoot) {
            items.push({ type: 'separator' });
            items.push({ id: 'add-child-to-root', label: 'Add Node to Root', icon: '➕', action: actions.onAddChildToRoot, title: "Add a new top-level node to the project" });
        }

        return items;
    }, [config]);

    const focusableItems = React.useMemo(() => menuItems.filter(item => item.type !== 'separator'), [menuItems]);

    useEffect(() => {
        if (isOpen && config.position && menuRef.current) {
            const menuWidth = menuRef.current.offsetWidth || 180;
            const menuHeight = menuRef.current.offsetHeight || 100;
            let finalX = config.position.x;
            let finalY = config.position.y;

            if (finalY + menuHeight > window.innerHeight - 10) finalY = window.innerHeight - menuHeight - 10;
            if (finalX + menuWidth > window.innerWidth - 10) finalX = window.innerWidth - menuWidth - 10;

            setMenuStyle({ top: `${Math.max(5, finalY)}px`, left: `${Math.max(5, finalX)}px` });
        }
    }, [isOpen, config]);

    useEffect(() => {
        if (!isOpen) {
            setFocusedIndex(-1);
            return;
        }
        setFocusedIndex(0);
        const handleClickOutside = (event) => { if (menuRef.current && !menuRef.current.contains(event.target)) onClose(); };
        const handleEscapeKey = (event) => { if (event.key === 'Escape') onClose(); };
        
        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleEscapeKey);
        return () => { document.removeEventListener('mousedown', handleClickOutside); document.removeEventListener('keydown', handleEscapeKey); };
    }, [isOpen, onClose]);

    const handleKeyDown = useCallback((event) => {
        if (!isOpen || focusableItems.length === 0) return;
        event.preventDefault();
        switch (event.key) {
            case 'ArrowUp':
                setFocusedIndex(prev => (prev - 1 + focusableItems.length) % focusableItems.length);
                break;
            case 'ArrowDown':
                setFocusedIndex(prev => (prev + 1) % focusableItems.length);
                break;
            case 'Enter':
            case ' ':
                const item = focusableItems[focusedIndex];
                if (item?.action) {
                    item.action();
                    onClose();
                }
                break;
        }
    }, [isOpen, focusableItems, focusedIndex, onClose]);

    useEffect(() => {
        if (!isOpen || !menuRef.current || focusedIndex < 0) return;
        const items = menuRef.current.querySelectorAll('button[role="menuitem"]');
        items[focusedIndex]?.focus();
    }, [isOpen, focusedIndex]);

    if (!isOpen || !config) return null;

    return (
        React.createElement("div", { ref: menuRef, className: "context-menu", style: menuStyle, role: "menu", "aria-orientation": "vertical", onKeyDown: handleKeyDown },
            React.createElement("div", { className: "context-menu-header" },
                React.createElement("strong", null, "View Options"),
                React.createElement("button", { onClick: onClose, className: "base-icon-button context-menu-close-btn", title: "Close Menu (Esc)", "aria-label": "Close context menu" }, "×")
            ),
            React.createElement("ul", null,
                menuItems.map((item, index) => {
                    if (item.type === 'separator') {
                        return React.createElement("li", { key: `sep-${index}`, role: "separator" }, React.createElement("hr", null));
                    }
                    const isFocused = focusedIndex === focusableItems.findIndex(fi => fi.id === item.id);
                    return (
                        React.createElement("li", { key: item.id, role: "none" },
                            React.createElement("button", {
                                role: "menuitem",
                                className: `context-menu-item ${isFocused ? 'focused' : ''}`,
                                onClick: () => { if (item.action) { item.action(); onClose(); } },
                                onMouseEnter: () => setFocusedIndex(focusableItems.findIndex(fi => fi.id === item.id)),
                                title: item.title || item.label,
                            },
                                React.createElement("span", { className: "context-menu-icon" }, item.icon),
                                React.createElement("span", { className: "context-menu-label" }, item.label)
                            )
                        )
                    );
                })
            )
        )
    );
};

export default ViewContextMenu;