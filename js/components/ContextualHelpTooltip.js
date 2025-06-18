
import React from 'react';

const ContextualHelpTooltip = ({ 
  helpText, 
  position = 'top' 
}) => {
  return (
    React.createElement("span", { className: "tooltip-container contextual-help-icon", 
          role: "tooltip", 
          "aria-label": "Help", 
          tabIndex: 0,
          style: { position: 'relative' } 
          },
      "?",
      React.createElement("span", { className: `tooltip-text position-${position}`,
            role: "status",
            "aria-live": "polite"
      },
        helpText
      )
    )
  );
};

export default ContextualHelpTooltip;
