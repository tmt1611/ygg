import React, { useCallback } from 'react';

// Using a button for better accessibility and semantics.
const ContextualHelpTooltip = React.memo(({ helpText, position = 'top' }) => {
  // useCallback is used here to prevent creating a new function on every render,
  // which would break the optimization of React.memo.
  const handleClick = useCallback((e) => {
    e.preventDefault(); // Prevent any form submission if it's inside a form.
    e.stopPropagation(); // Prevent triggering clicks on parent elements.
  }, []);

  return (
    React.createElement("button", {
      type: "button",
      "aria-label": `Help: ${helpText}`,
      className: "tooltip-container contextual-help-icon",
      onClick: handleClick
    },
      "?",
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