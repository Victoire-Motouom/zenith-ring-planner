// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ command, mode }) => {
  const base = mode === 'production' ? '/zenith-ring-planner/' : '/';
  
  return {
    base,
    plugins: [react()],
    define: {
      'process.env.NODE_ENV': JSON.stringify(mode)
    }
  };
});
