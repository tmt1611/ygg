import React from 'react';

const ContextualHelpTooltip = ({
  helpText,
  position = 'top'
}) => {
  // Using a button for better accessibility and semantics.
  return (
    React.createElement("button", {
      type: "button",
      "aria-label": `Help: ${helpText}`,
      className: "tooltip-container contextual-help-icon",
      onClick: (e) => e.preventDefault() // Prevent any form submission if it's inside a form
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
};

export default ContextualHelpTooltip;