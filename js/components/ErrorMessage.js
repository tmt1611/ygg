import React, { useState } from 'react';

const ErrorMessage = ({ error, onClose, mode = 'toast' }) => {
  const [copyFeedback, setCopyFeedback] = useState('');

  if (!error || !error.message) return null;

  const handleCopy = () => {
    const errorDetails = `Error: ${error.message}\n\nDetails:\n${error.details}`;
    navigator.clipboard.writeText(errorDetails).then(() => {
      setCopyFeedback('Copied!');
      setTimeout(() => setCopyFeedback(''), 2000);
    }).catch(err => {
      setCopyFeedback('Failed');
      console.error('Failed to copy error details:', err);
    });
  };
  
  const formattedMessage = error.message.startsWith("Error:") ? error.message.substring(6).trim() : error.message;

  const className = mode === 'inline' ? 'error-message-inline' : 'error-toast';

  return (
    React.createElement("div", { 
      className: className,
      role: "alert",
    },
      React.createElement("span", { className: "error-icon", "aria-hidden": "true" }, "⚠️"),
      React.createElement("div", { style: { flexGrow: 1, wordBreak: 'break-word', paddingRight: '10px' } }, 
        React.createElement("strong", null, "Error:"), " ",
        formattedMessage
      ),
      error.details && React.createElement("button", {
        onClick: handleCopy,
        className: "base-icon-button error-message-copy-btn",
        "aria-label": "Copy error details",
        title: "Copy Details"
      }, copyFeedback || '📋'),
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