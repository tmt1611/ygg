import React, { Component } from 'react';
import { APP_STORAGE_KEYS } from '../constants.js';

const HARD_RESET_CONFIRMATION_MESSAGE = `☢️ DANGER: HARD RESET ☢️

Are you absolutely sure you want to proceed?

This will DELETE ALL your saved projects and settings from this browser's local storage.

This action is irreversible and should only be used if the application is completely broken and will not load.

Press 'OK' to permanently delete all data and reload. Press 'Cancel' to go back.`;

/**
 * A React error boundary that catches JavaScript errors anywhere in its child component tree,
 * logs those errors, and displays a fallback UI instead of the component tree that crashed.
 * This prevents a UI crash in one part of the app from breaking the entire application.
 */
class ErrorBoundary extends Component {
  state = {
    hasError: false,
    error: null,
    errorInfo: null,
    copyFeedback: ''
  };

  /**
   * A class property to hold the timeout ID for the copy feedback message.
   * This avoids using this.state for non-render data and allows for easy cleanup.
   * @private
   */
  _copyTimeout = null;

  /**
   * This lifecycle method is triggered when a descendant component throws an error.
   * It returns a new state object to trigger a re-render with the fallback UI.
   * @param {Error} error - The error that was thrown.
   * @returns {{ hasError: boolean }} A state update.
   */
  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  /**
   * This lifecycle method is called after an error has been thrown by a descendant component.
   * It receives the error and an object with a componentStack key.
   * This is a good place for logging errors.
   * @param {Error} error - The error that was thrown.
   * @param {object} errorInfo - An object with a `componentStack` property.
   */
  componentDidCatch(error, errorInfo) {
    console.error("Yggdrasil Uncaught Error:", error, errorInfo);
    this.setState({ error, errorInfo });
  }
  
  /**
   * Clears any pending timeouts when the component unmounts. This is crucial
   * to prevent memory leaks and to avoid calling `setState` on an unmounted component.
   */
  componentWillUnmount() {
    if (this._copyTimeout) {
      clearTimeout(this._copyTimeout);
    }
  }

  /**
   * Copies a detailed error report to the user's clipboard.
   * The report includes error details, stack traces, and environment information.
   */
  handleCopyError = () => {
    const { error, errorInfo } = this.state;
    if (!error) return;

    const errorText = `
--- YGGDRASIL ERROR REPORT ---
Date: ${new Date().toISOString()}
User Agent: ${navigator.userAgent}
Error: ${error?.toString()}

Stack Trace:
${error?.stack || 'Not available'}

Component Stack:
${errorInfo?.componentStack || 'Not available'}
------------------------------
    `;
    navigator.clipboard.writeText(errorText.trim())
      .then(() => {
        this.setState({ copyFeedback: 'Copied to clipboard!' });
        this._copyTimeout = setTimeout(() => this.setState({ copyFeedback: '' }), 2500);
      })
      .catch(err => {
        this.setState({ copyFeedback: 'Failed to copy.' });
        console.error('Failed to copy error report:', err);
      });
  };

  /**
   * Prompts the user for confirmation and then clears all application data
   * from localStorage and sessionStorage, then reloads the page. This is a
   * last-resort recovery option for the user.
   */
  handleHardReset = () => {
    if (window.confirm(HARD_RESET_CONFIRMATION_MESSAGE)) {
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
    }
  };
  
  /**
   * Renders the fallback UI when an error has been caught.
   * @private
   */
  _renderErrorScreen = () => {
    const { error, errorInfo, copyFeedback } = this.state;
    const copyButtonClass = copyFeedback.startsWith('Copied') ? "success" : "secondary";
    
    return (
      React.createElement("div", { className: "error-boundary-container" },
        React.createElement("div", { className: "error-boundary-content" },
          React.createElement("div", { className: "error-boundary-icon" }, "⚡️"),
          React.createElement("h1", { className: "error-boundary-title" }, "A Branch has Broken"),
          React.createElement("p", { className: "error-boundary-message" }, "Yggdrasil encountered an unexpected error and cannot continue."),
          React.createElement("p", { className: "error-boundary-subtext" }, "An unexpected error has occurred. Reloading may fix it. If the error persists, it might be due to corrupted local data. You can try a hard reset, but this will clear all your saved projects and settings."),
          
          React.createElement("div", { className: "error-boundary-actions" },
            React.createElement("button", { onClick: () => window.location.reload(), className: "primary" }, "Reload Application"),
            React.createElement("button", { onClick: this.handleHardReset, className: "danger" }, "Clear Data & Reload"),
            error && React.createElement("button", { onClick: this.handleCopyError, className: copyButtonClass }, copyFeedback || "Copy Error Details")
          ),
          
          error && (
            React.createElement("details", { className: "error-boundary-details" },
              React.createElement("summary", null, "Technical Details"),
              React.createElement("pre", null,
                error?.toString(),
                "\n\n--- COMPONENT STACK ---\n",
                errorInfo?.componentStack
              )
            )
          )
        )
      )
    );
  }

  render() {
    if (this.state.hasError) {
      return this._renderErrorScreen();
    }
    return this.props.children;
  }
}

export default ErrorBoundary;