import React, { useCallback } from 'react';

/**
 * A small, circular help icon button that displays a tooltip on hover/focus.
 * It's designed to provide contextual information without cluttering the UI.
 *
 * This component is memoized for performance and uses a <button> element for
 * accessibility, making it focusable and interactive for all users.
 *
 * @param {object} props - The component props.
 * @param {string} props.helpText - The text content to display inside the tooltip.
 * @param {'top' | 'right' | 'bottom'} [props.position='top'] - The position of the tooltip relative to the icon.
 */
const ContextualHelpTooltip = React.memo(({ helpText, position = 'top' }) => {
  // A click handler that prevents default browser actions (like form submission)
  // or propagation to parent clickable elements. This ensures the help icon
  // acts independently.
  const handleClick = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  return (
    React.createElement("button", {
      type: "button",
      "aria-label": `Help: ${helpText}`,
      className: "tooltip-container contextual-help-icon",
      onClick: handleClick
    },
      "?", // The visual representation of the help icon.
      React.createElement("span", {
        className: `tooltip-text position-${position}`,
        role: "tooltip",
        "aria-hidden": "true" // The tooltip content is for visual users; screen readers use the aria-label.
      },
        helpText
      )
    )
  );
});

export default ContextualHelpTooltip;