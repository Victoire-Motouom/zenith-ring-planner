// Base URL for routing
export const BASE_URL = import.meta.env.VITE_BASE_URL || '/';

// Check if we're in development mode
const isDev = import.meta.env.DEV;

// Ensure the base URL starts and ends with a slash
export const getBaseUrl = () => {
  // In development, always use '/'
  if (isDev) return '/';
  
  let base = BASE_URL;
  if (!base.startsWith('/')) base = `/${base}`;
  if (!base.endsWith('/')) base = `${base}/`;
  return base;
};

// For React Router basename
export const ROUTER_BASE = isDev ? '' : getBaseUrl().replace(/^\//, '').replace(/\/$/, '');
