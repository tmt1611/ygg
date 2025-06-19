import React from 'react';

const ContextualHelpTooltip = ({
  helpText,
  position = 'top'
}) => {
  return (
    React.createElement("span", { className: "tooltip-container contextual-help-icon",
          "aria-label": `Help: ${helpText}`,
          tabIndex: 0
          },
      "?",
      React.createElement("span", { className: `tooltip-text position-${position}`,
            role: "tooltip"
      },
        helpText
      )
    )
  );
};

export default ContextualHelpTooltip;