import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles/index.css';
import App from './App';

// Global error handler
window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
  const errorDiv = document.createElement('div');
  errorDiv.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; background: red; color: white; padding: 20px; z-index: 9999';
  errorDiv.innerHTML = `Error: ${event.error?.message || 'Unknown error'}<br>Stack: ${event.error?.stack || 'No stack'}`;
  document.body.appendChild(errorDiv);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
  const errorDiv = document.createElement('div');
  errorDiv.style.cssText = 'position: fixed; top: 50px; left: 0; right: 0; background: orange; color: black; padding: 20px; z-index: 9999';
  errorDiv.innerHTML = `Promise rejection: ${event.reason}`;
  document.body.appendChild(errorDiv);
});

// Debug logging
console.log('index.js loaded');
console.log('Root element:', document.getElementById('root'));

// Simple render without waiting
try {
  const rootElement = document.getElementById('root');
  if (rootElement) {
    const root = ReactDOM.createRoot(rootElement);
    root.render(<App />);
    console.log('App rendered');
  } else {
    throw new Error('Root element not found');
  }
} catch (error) {
  console.error('Failed to render:', error);
  document.body.innerHTML = `
    <div style="background: black; color: white; padding: 20px; min-height: 100vh;">
      <h1 style="color: #FF8C00;">Error Loading App</h1>
      <pre style="background: #222; padding: 10px; overflow: auto;">
${error.message}
${error.stack}
      </pre>
    </div>
  `;
}