
import React from 'react';

const ErrorMessage = ({ message }) => {
  if (!message) return null;
  return (
    React.createElement("div", { 
      style: {
        backgroundColor: 'var(--error-bg)', 
        border: '1px solid var(--error-color)', 
        borderLeft: '5px solid var(--error-color)', 
        color: 'var(--error-color)', 
        padding: '12px 15px',
        margin: '1em 0',
        borderRadius: 'var(--border-radius)',
      },
      role: "alert",
      className: "error-message-animated" 
    },
      React.createElement("div", { style: { display: 'flex', alignItems: 'center' }},
        React.createElement("span", { style: { fontSize: '1.3em', marginRight: '0.6em' }, "aria-hidden": "true" }, "⚠️"),
        React.createElement("strong", { style: { fontSize: '1.05em' }}, "An Error Occurred")
      ),
      React.createElement("p", { style: { marginTop: '0.6em', fontSize: '0.95em', marginLeft: '2.2em', color: 'var(--text-primary)' }}, message)
    )
  );
};

export default ErrorMessage;
