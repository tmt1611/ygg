console.log('Yggdrasil v3.0: Script initiated.');

import React from 'react';
import * as ReactDOM from 'react-dom/client';
import App from './components/App.js';
import ErrorBoundary from './components/ErrorBoundary.js';

/**
 * Displays a full-screen, self-contained error message.
 * This is used for fatal errors that prevent the React app from rendering.
 * @param {string} title The main title of the error message.
 * @param {string} message A user-friendly explanation of the error.
 * @param {string} [errorDetails] Optional technical details about the error.
 */
const displayFatalError = (title, message, errorDetails) => {
  document.body.innerHTML = ''; // Clear the page to remove any broken UI
  const errorDiv = document.createElement('div');
  // Use inline styles for a self-contained error display that doesn't rely on external CSS
  Object.assign(errorDiv.style, {
    position: 'fixed',
    inset: '0',
    padding: '40px 20px',
    backgroundColor: '#1a0000',
    color: '#ffc0c0',
    fontFamily: 'monospace, sans-serif',
    zIndex: '9999',
    overflow: 'auto',
  });

  let errorHtml = `
    <div style="max-width: 800px; margin: auto; border: 1px solid #ff5050; padding: 20px 30px; background-color: #330000; border-radius: 8px;">
      <h1 style="color: #ff8080; margin-top: 0;">${title}</h1>
      <p style="font-size: 1.1em; line-height: 1.5;">${message}</p>`;

  if (errorDetails) {
    errorHtml += `
      <hr style="border-color: #ff5050; margin: 20px 0;">
      <pre style="white-space: pre-wrap; word-break: break-all; background-color: #1a0000; padding: 10px; border-radius: 4px;"><strong>Error:</strong> ${errorDetails}</pre>`;
  }
  errorHtml += `</div>`;
  
  errorDiv.innerHTML = errorHtml;
  document.body.prepend(errorDiv);
};

const rootElement = document.getElementById('root');

if (!rootElement) {
  const errorMessage = 'The application could not start because the main HTML element (id="root") is missing. Please ensure the index.html file is not corrupted.';
  console.error(`CRITICAL: Root element not found. ${errorMessage}`);
  displayFatalError('Critical Error: Root Element Missing', errorMessage);
} else {
  console.log('Root element found. Creating React root...');
  try {
    const root = ReactDOM.createRoot(rootElement);
    console.log('Rendering App component within ErrorBoundary...');
    root.render(
      React.createElement(React.StrictMode, null,
        React.createElement(ErrorBoundary, null,
          React.createElement(App, null)
        )
      )
    );
    console.log('Yggdrasil has taken root. App rendering initiated.');
  } catch (e) {
    const errorMessage = 'An unexpected error prevented the application from rendering correctly. Please see the browser console for technical details. You can try reloading the page.';
    console.error('FATAL: An unhandled error occurred during the initial React render:', e);
    displayFatalError('Fatal Error: Application Failed to Render', errorMessage, e.message);
  }
}