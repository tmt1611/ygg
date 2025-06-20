
import React from 'react';

const ContextualHelpTooltip = ({
  helpText,
  position = 'top'
}) => {
  return (
    React.createElement("span", { className: "tooltip-container contextual-help-icon",
          role: "tooltip",
          "aria-label": `Help: ${helpText}`,
          tabIndex: 0
          },
      React.createElement("svg", {
        viewBox: "0 0 16 16",
        fill: "currentColor",
        style: { width: '1em', height: '1em' },
        "aria-hidden": "true"
      },
        React.createElement("path", {
          fillRule: "evenodd",
          d: "M8 15A7 7 0 108 1a7 7 0 000 14zm0 1A8 8 0 108 0a8 8 0 000 16z"
        }),
        React.createElement("path", {
          d: "M5.255 5.786a.237.237 0 00.241.247h.825c.138 0 .248-.113.266-.25.09-.656.54-1.134 1.342-1.134.686 0 1.314.343 1.314 1.168 0 .635-.374.927-.965 1.371-.673.489-1.206 1.06-1.168 1.987l.003.217a.25.25 0 00.25.246h.811a.25.25 0 00.25-.25v-.105c0-.718.273-.927 1.01-1.486.609-.463 1.244-.977 1.244-2.056 0-1.511-1.276-2.241-2.673-2.241-1.267 0-2.655.59-2.75 2.286zm1.557 5.763c0 .533.425.927 1.01.927.609 0 1.028-.394 1.028-.927 0-.552-.42-.94-1.029-.94-.584 0-1.009.388-1.009.94z"
        })
      ),
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
