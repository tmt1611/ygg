
console.log('Yggdrasil v3.0: Script initiated.');

import React from 'react';
import * as ReactDOM from 'react-dom/client';
import App from './App.js';
import ErrorBoundary from './components/ErrorBoundary.js';

const rootElement = document.getElementById('root');

if (!rootElement) {
  console.error("CRITICAL: Root element with ID 'root' not found in document. Yggdrasil cannot grow.");
  // Attempt to create a visible error message for the user.
  const errorDiv = document.createElement('div');
  errorDiv.setAttribute('style', 'position:fixed; top:0; left:0; width:100%; padding:20px; background: #ffdddd; color: #d8000c; text-align:center; font-family:sans-serif; z-index:9999;');
  errorDiv.innerHTML = '<h1>Critical Error</h1><p>The application could not start because a critical HTML element is missing. Please ensure the HTML is not corrupted.</p>';
  document.body.prepend(errorDiv);
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
    console.error('FATAL: An unhandled error occurred during the initial React render:', e);
    // Display a more user-friendly error message if the render itself fails.
    const errorDiv = document.createElement('div');
    errorDiv.setAttribute('style', 'position:fixed; top:0; left:0; width:100%; padding:20px; background: #ffdddd; color: #d8000c; text-align:left; font-family:sans-serif; z-index:9999;');
    errorDiv.innerHTML = `
      <div style="max-width: 800px; margin: auto;">
        <h1>Application failed to start</h1>
        <p>An unexpected error prevented the application from rendering correctly. Please see the browser console for technical details.</p>
        <p>You can try reloading the page. If the issue persists, the application files may be corrupted or there might be an incompatibility with your browser.</p>
        <hr>
        <pre><strong>Error:</strong> ${e.message}</pre>
      </div>`;
    // Clear the root element to avoid showing a broken partial render.
    while (rootElement.firstChild) {
      rootElement.removeChild(rootElement.firstChild);
    }
    rootElement.appendChild(errorDiv);
  }
}
