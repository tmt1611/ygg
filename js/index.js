
console.log('index.js: script started'); // Log to confirm script start

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.js';
import ErrorBoundary from './components/ErrorBoundary.js';

const rootElement = document.getElementById('root');

if (!rootElement) {
  console.error("Could not find root element with ID 'root'. Critical error.");
  const errorDiv = document.createElement('div');
  errorDiv.innerHTML = '<h1 style="color:red; text-align:center; margin-top: 50px;">Root element not found. React app cannot render.</h1>';
  document.body.prepend(errorDiv);
} else {
  console.log('index.js: Root element found. Creating React root...');
  try {
    const root = ReactDOM.createRoot(rootElement);
    console.log('index.js: Rendering App component within ErrorBoundary...');
    root.render(
      React.createElement(React.StrictMode, null,
        React.createElement(ErrorBoundary, null,
          React.createElement(App, null)
        )
      )
    );
    console.log('index.js: App component rendering initiated.');
  } catch (e) {
    console.error('Error during React rendering in index.js:', e);
    const errorDiv = document.createElement('div');
    errorDiv.innerHTML = `
      <div style="color:red; background:white; padding:20px; border: 2px solid red; text-align:left;">
        <h1>React Rendering Error</h1>
        <p>Could not render the main App component.</p>
        <pre><strong>Error:</strong> ${e.message}</pre>
        <pre><strong>Stack:</strong> ${e.stack}</pre>
      </div>`;
    rootElement.innerHTML = ''; 
    rootElement.appendChild(errorDiv);
  }
}
