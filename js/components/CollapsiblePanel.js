import React, { useCallback } from 'react';

/**
 * A reusable collapsible panel component with variants for different UI areas.
 * It handles its own collapsed/expanded state display and provides accessibility attributes.
 *
 * @param {object} props - The component props.
 * @param {string} props.panelId - A unique ID for the panel, used for accessibility and state management.
 * @param {string} props.title - The title displayed in the panel header.
 * @param {React.ReactNode} [props.icon] - An emoji or icon string to display before the title.
 * @param {boolean} props.isCollapsed - Whether the panel is currently collapsed.
 * @param {function(string): void} props.onToggle - Callback function invoked with the panelId when the header is clicked.
 * @param {React.ReactNode} [props.children] - The content to be displayed inside the panel when it is expanded.
 * @param {React.ReactNode} [props.headerActions] - Custom action elements (e.g., buttons) to display in the header.
 * @param {'workspace' | 'sidebar'} [props.variant='workspace'] - The visual variant of the panel.
 */
const CollapsiblePanel = ({
  panelId,
  title,
  icon,
  isCollapsed,
  onToggle,
  children,
  headerActions,
  variant = 'workspace'
}) => {

  // Memoize the toggle handler to prevent re-creation on re-renders.
  const handleToggle = useCallback(() => {
    onToggle(panelId);
  }, [onToggle, panelId]);

  // Memoize the keydown handler for accessibility (Enter/Space to toggle).
  const handleHeaderKeyDown = useCallback((event) => {
    // Allow panel to be toggled with Enter/Space when the header itself is focused.
    if (event.key === 'Enter' || event.key === ' ') {
      // Check if the event target is the header itself, not an interactive child.
      if (event.target === event.currentTarget) {
        event.preventDefault();
        handleToggle();
      }
    }
  }, [handleToggle]);

  // Memoize the click handler for the actions container to stop event propagation.
  const handleActionsClick = useCallback((e) => {
    e.stopPropagation(); // Prevent actions from toggling the panel
  }, []);

  const panelClasses = `panel panel-variant-${variant} ${isCollapsed ? 'collapsed' : ''}`;

  return (
    React.createElement("div", { className: panelClasses },
      React.createElement("div", {
        className: "collapsible-panel-header",
        onClick: handleToggle,
        onKeyDown: handleHeaderKeyDown,
        role: "button",
        "aria-expanded": !isCollapsed,
        "aria-controls": `${panelId}-content`,
        tabIndex: 0,
        title: `${isCollapsed ? 'Expand' : 'Collapse'} ${title}`
      },
        icon && React.createElement("span", { className: "panel-header-icon", "aria-hidden": "true" }, icon),
        React.createElement("h3", null, title),
        React.createElement("div", {
          className: "panel-header-actions",
          onClick: handleActionsClick
        },
            headerActions
        ),
        React.createElement("button", {
          className: `panel-toggle-button ${isCollapsed ? 'collapsed' : ''}`,
          "aria-label": `${isCollapsed ? 'Expand' : 'Collapse'} ${title}`,
          // This button is decorative; the header is the main interactive element.
          tabIndex: -1,
          "aria-hidden": "true"
        },
          "❯"
        )
      ),
      // Optimization: Conditionally render children only when the panel is expanded.
      // This avoids rendering potentially complex component trees that are not visible.
      !isCollapsed && React.createElement("div", {
        id: `${panelId}-content`,
        className: `panel-content-wrapper` // The .collapsed class is not needed here for display purposes
      },
        children
      )
    )
  );
};

// Memoize the component to prevent unnecessary re-renders if props don't change.
export default React.memo(CollapsiblePanel);