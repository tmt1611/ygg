import React from 'react';

const ContextualHelpTooltip = ({
  helpText,
  position = 'top'
}) => {
  // Using a span with tabindex for focusability without button semantics.
  return (
    React.createElement("span", {
      tabIndex: "0",
      role: "img", // It's a visual symbol with a label
      "aria-label": `Help: ${helpText}`,
      className: "tooltip-container contextual-help-icon"
    },
      "?",
      React.createElement("span", {
        className: `tooltip-text position-${position}`,
        role: "tooltip",
        "aria-hidden": "true"
      },
        helpText
      )
    )
  );
};

export default ContextualHelpTooltip;