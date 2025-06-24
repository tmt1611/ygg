import React from 'react';

const ContextualHelpTooltip = ({
  helpText,
  position = 'top'
}) => {
  // Using a button for better accessibility and semantics.
  // The tooltip appears on hover or focus, which is standard.
  return (
    React.createElement("button", { type: "button", className: "tooltip-container contextual-help-icon",
          "aria-label": `Help: ${helpText}`
          },
      "?",
      React.createElement("span", { className: `tooltip-text position-${position}`,
            role: "tooltip",
            "aria-hidden": "true" // Hide from screen readers as the button's aria-label has the info.
      },
        helpText
      )
    )
  );
};

export default ContextualHelpTooltip;