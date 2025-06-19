import React from 'react';

const ErrorMessage = ({ message }) => {
  if (!message) return null;
  
  const formattedMessage = message.startsWith("Error:") ? message.substring(6).trim() : message;

  return (
    React.createElement("div", { 
      className: "error-message-inline",
      role: "alert",
    },
      React.createElement("span", { className: "error-icon", "aria-hidden": "true" }, "⚠️"),
      React.createElement("div", null, 
        React.createElement("strong", null, "Error:"), " ",
        formattedMessage
      )
    )
  );
};

export default ErrorMessage;