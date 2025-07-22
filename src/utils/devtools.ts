/**
 * Development utilities for the application
 */

declare global {
  interface Window {
    __REACT_DEVTOOLS_GLOBAL_HOOK__?: any;
  }
}

/**
 * Checks if React DevTools is installed and logs a message if it's not
 */
export const checkForDevTools = () => {
  if (process.env.NODE_ENV === 'development' && !window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
    console.log(
      '%c✨ Download React DevTools for a better development experience: https://reactjs.org/link/react-devtools',
      'font-size: 14px; color: #61dafb; font-weight: bold;'
    );
  }
};

/**
 * Initialize development tools
 */
export const initDevTools = () => {
  checkForDevTools();
  
  // Add any other development-only initialization here
  if (process.env.NODE_ENV === 'development') {
    console.log('%c🚀 Development mode is active', 'color: #4CAF50; font-weight: bold');
  }
};
