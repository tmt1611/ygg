
import React, { Component } from 'react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: undefined,
      errorInfo: undefined
    };
  }

  static getDerivedStateFromError(_) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Yggdrasil Uncaught Error:", error, errorInfo);
    this.setState({ error, errorInfo });
  }

  render() {
    if (this.state.hasError) {
      const isDev = typeof process !== 'undefined' && process.env.NODE_ENV === 'development';
      return (
        React.createElement("div", { style: { 
            height: '100vh', 
            background: 'var(--app-bg, #121212)', 
            color: 'var(--text-primary, #E0E0E0)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            padding: '20px', 
            fontFamily: 'var(--font-family-sans, sans-serif)',
            textAlign: 'center'
        }},
          React.createElement("div", { style: { 
              background: 'var(--panel-bg, #1E1E1E)', 
              padding: '30px 40px', 
              borderRadius: 'var(--border-radius-lg, 6px)', 
              borderTop: '4px solid var(--error-color, #EF5350)', 
              maxWidth: '700px', 
              boxShadow: 'var(--box-shadow-lg, 0 8px 12px -3px rgba(0,0,0,0.1))' 
          }},
            React.createElement("h1", { style: { 
                fontFamily: 'var(--font-family-serif-display, serif)',
                fontSize: '2.5em', 
                color: 'var(--error-color, #EF5350)', 
                marginBottom: '15px' 
            }},
              "A Branch has Broken"
            ),
            React.createElement("p", { style: { 
                fontSize: '1.1em', 
                color: 'var(--text-secondary, #B0B0B0)', 
                marginBottom: '10px', 
                lineHeight: '1.6' 
            }},
              "Yggdrasil encountered an unexpected error and cannot continue."
            ),
            React.createElement("p", { style: { 
                fontSize: '1.0em', 
                color: 'var(--text-tertiary, #888888)', 
                marginBottom: '30px'
            }},
              "Reloading the application may fix the issue. Your work should be auto-saved up to the last successful action."
            ),
            React.createElement("button", {
              onClick: () => window.location.reload(),
              className: "danger", 
              style: { padding: '12px 25px', fontSize: '1.1em', fontWeight: 600 }
            },
              "Reload Application"
            ),
            isDev && this.state.error && (
              React.createElement("details", { style: { 
                  marginTop: '30px', 
                  textAlign: 'left', 
                  fontSize: '0.85em', 
                  background: 'var(--panel-alt-bg, #282828)', 
                  padding: '15px', 
                  borderRadius: 'var(--border-radius, 4px)', 
                  border: '1px solid var(--border-color, #383838)', 
                  maxHeight: '250px', 
                  overflowY: 'auto' 
              }},
                React.createElement("summary", { style: { cursor: 'pointer', fontWeight: 600, color: 'var(--text-primary, #E0E0E0)' }}, "Error Details (Development)"),
                React.createElement("pre", { style: { marginTop: '10px', whiteSpace: 'pre-wrap', wordBreak: 'break-all', lineHeight: '1.5', color: 'var(--text-secondary, #B0B0B0)' }},
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
