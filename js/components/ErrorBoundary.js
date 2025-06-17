
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
    console.error("Uncaught error:", error, errorInfo);
    this.setState({ error, errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        React.createElement("div", { style: { 
            minHeight: '100vh', 
            background: 'var(--app-bg, #F0F2F5)', 
            color: 'var(--text-primary, #1E1E3F)', 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center', 
            padding: '20px', 
            boxSizing: 'border-box',
            fontFamily: 'var(--font-family-sans, sans-serif)'
        }},
          React.createElement("div", { style: { 
              background: 'var(--panel-bg, #FFFFFF)', 
              padding: '30px 40px', 
              borderRadius: 'calc(var(--border-radius, 4px) * 2)', 
              border: '1px solid var(--error-color, #DC3545)', 
              textAlign: 'center', 
              maxWidth: '650px', 
              boxShadow: 'var(--box-shadow-md, 0 4px 6px rgba(0,0,0,0.1))' 
          }},
            React.createElement("h1", { style: { 
                fontSize: '2em', 
                fontWeight: 'bold', 
                color: 'var(--error-color, #DC3545)', 
                marginBottom: '20px' 
            }},
              "Oops! Something went wrong."
            ),
            React.createElement("p", { style: { 
                fontSize: '1.05em', 
                color: 'var(--text-secondary, #4A4A6A)', 
                marginBottom: '30px', 
                lineHeight: '1.6' 
            }},
              "We encountered an unexpected issue. Please try refreshing the page. If the problem persists, you can check the console for more details or report this issue."
            ),
            React.createElement("button", {
              onClick: () => window.location.reload(),
              className: "primary", 
              style: { padding: '10px 20px', fontSize: '1.05em' }
            },
              "Refresh Page"
            ),
            process.env.NODE_ENV === 'development' && this.state.error && (
              React.createElement("details", { style: { 
                  marginTop: '25px', 
                  textAlign: 'left', 
                  fontSize: '0.85em', 
                  background: 'var(--panel-alt-bg, #F8F9FA)', 
                  padding: '12px', 
                  borderRadius: 'var(--border-radius, 4px)', 
                  border: '1px solid var(--border-color, #D1D5DB)', 
                  maxHeight: '250px', 
                  overflowY: 'auto' 
              }},
                React.createElement("summary", { style: { cursor: 'pointer', fontWeight: 500, color: 'var(--text-primary, #1E1E3F)' }}, "Error Details (Development)"),
                React.createElement("pre", { style: { marginTop: '10px', whiteSpace: 'pre-wrap', lineHeight: '1.4', color: 'var(--text-secondary, #4A4A6A)' }},
                  this.state.error.toString(),
                  this.state.errorInfo && this.state.errorInfo.componentStack
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
