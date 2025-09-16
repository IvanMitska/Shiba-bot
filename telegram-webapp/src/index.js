import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles/index.css';
import App from './App';

// Debug logging
console.log('index.js loaded');
console.log('Root element:', document.getElementById('root'));

// Wait for DOM to be ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}

function initApp() {
  console.log('Initializing React app...');
  const rootElement = document.getElementById('root');

  if (!rootElement) {
    console.error('Root element not found!');
    document.body.innerHTML = '<div style="color: white; padding: 20px; background: red;">Error: Root element not found</div>';
    return;
  }

  try {
    const root = ReactDOM.createRoot(rootElement);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
    console.log('React app rendered successfully');
  } catch (error) {
    console.error('Error rendering app:', error);
    document.body.innerHTML = `<div style="color: white; padding: 20px; background: red;">Error: ${error.message}</div>`;
  }
}