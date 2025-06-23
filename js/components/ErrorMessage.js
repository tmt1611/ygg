import React from 'react';

const ErrorMessage = ({ message, onClose }) => {
  if (!message) return null;
  
  const formattedMessage = message.startsWith("Error:") ? message.substring(6).trim() : message;

  return (
    React.createElement("div", { 
      className: "error-message-inline",
      role: "alert",
    },
      React.createElement("span", { className: "error-icon", "aria-hidden": "true" }, "⚠️"),
      React.createElement("div", { style: { flexGrow: 1 } }, 
        React.createElement("strong", null, "Error:"), " ",
        formattedMessage
      ),
      onClose && React.createElement("button", {
        onClick: onClose,
        className: "base-icon-button error-message-close-btn",
        "aria-label": "Dismiss error message",
        title: "Dismiss"
      }, "×")
    )
  );
};

export default ErrorMessage;