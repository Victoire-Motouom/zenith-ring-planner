import { createRoot } from 'react-dom/client';
import { StrictMode } from 'react';
import App from './App';
import { initDevTools } from './utils/devtools';
import './index.css';

// Initialize development tools
initDevTools();

// Render the app
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
