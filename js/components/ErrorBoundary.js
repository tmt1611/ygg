import React, { Component } from 'react';
import { APP_STORAGE_KEYS } from '../constants.js';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      copyFeedback: ''
    };
  }

  static getDerivedStateFromError(_) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Yggdrasil Uncaught Error:", error, errorInfo);
    this.setState({ error, errorInfo });
  }

  handleCopyError = () => {
    const { error, errorInfo } = this.state;
    if (!error) return;

    const errorText = `
--- YGGDRASIL ERROR REPORT ---
Date: ${new Date().toISOString()}
Error: ${error.toString()}
Stack Trace:
${error.stack}
Component Stack:
${errorInfo?.componentStack || 'Not available'}
------------------------------
    `;
    navigator.clipboard.writeText(errorText.trim())
      .then(() => {
        this.setState({ copyFeedback: 'Copied to clipboard!' });
        setTimeout(() => this.setState({ copyFeedback: '' }), 2500);
      })
      .catch(err => {
        this.setState({ copyFeedback: 'Failed to copy.' });
        console.error('Failed to copy error report:', err);
      });
  };

  handleHardReset = () => {
    try {
      console.warn("Yggdrasil: Performing hard reset. Clearing all application data from localStorage.");
      Object.values(APP_STORAGE_KEYS).forEach(key => {
        localStorage.removeItem(key);
      });
      sessionStorage.clear();
      console.log("Yggdrasil: localStorage and sessionStorage cleared.");
    } catch (e) {
      console.error("Yggdrasil: Failed to clear application storage.", e);
    } finally {
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      const copyButtonClass = this.state.copyFeedback.startsWith('Copied') ? "success" : "secondary";
      return (
        React.createElement("div", { className: "error-boundary-container" },
          React.createElement("div", { className: "error-boundary-content" },
            React.createElement("div", { className: "error-boundary-icon" }, "⚡️"),
            React.createElement("h1", { className: "error-boundary-title" },
              "A Branch has Broken"
            ),
            React.createElement("p", { className: "error-boundary-message" },
              "Yggdrasil encountered an unexpected error and cannot continue."
            ),
            React.createElement("p", { className: "error-boundary-subtext" },
              "An unexpected error has occurred. Reloading may fix it. If the error persists, it might be due to corrupted local data. You can try a hard reset, but this will clear all your saved projects and settings."
            ),
            React.createElement("div", { className: "error-boundary-actions" },
              React.createElement("button", {
                onClick: () => window.location.reload(),
                className: "primary"
              },
                "Reload Application"
              ),
              React.createElement("button", {
                onClick: this.handleHardReset,
                className: "danger"
              },
                "Clear Data & Reload"
              ),
              this.state.error && React.createElement("button", {
                onClick: this.handleCopyError,
                className: copyButtonClass
              },
                this.state.copyFeedback || "Copy Error Details"
              )
            ),
            this.state.error && (
              React.createElement("details", { className: "error-boundary-details" },
                React.createElement("summary", null, "Technical Details"),
                React.createElement("pre", null,
                  this.state.error.toString(),
                  this.state.errorInfo?.componentStack
                )
              )
            )
          )
        )
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;