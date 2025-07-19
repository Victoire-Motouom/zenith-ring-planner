import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import tsconfigPaths from "vite-tsconfig-paths";
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const isProduction = mode === 'production';
  const base = isProduction ? '/zenith-ring-planner/' : '/';
  
  return {
    base,
    server: {
      host: "::",
      port: 8080,
    },
    preview: {
      port: 8080,
      strictPort: true,
    },
    plugins: [
      react(),
      tsconfigPaths(),
      VitePWA({
        srcDir: 'public',
        filename: 'sw.js',
        strategies: 'injectManifest',
        registerType: 'autoUpdate',
        devOptions: {
          enabled: true,
          type: 'module',
          navigateFallback: base
        },
        includeAssets: ['favicon.ico', 'logo.png', 'manifest.json'],
        manifest: {
          name: 'Zenith Planner - Master Your Path',
          short_name: 'Zenith Planner',
          description: 'A mindful approach to budgeting and daily planning',
          start_url: base,
          scope: base,
          display: 'standalone',
          background_color: '#f8fafc',
          theme_color: '#1e3a8a',
          icons: [
            {
              src: `${base}logo.png`,
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any maskable'
            },
            {
              src: `${base}logo.png`,
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any maskable'
            }
          ]
        },
        injectRegister: 'auto',
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,json}'],
          navigateFallback: `${base}index.html`,
          cleanupOutdatedCaches: true,
          clientsClaim: true,
          skipWaiting: true
        }
      })
    ],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    define: {
      'process.env': {},
      'import.meta.env.VITE_BASE_URL': JSON.stringify(process.env.VITE_BASE_URL || base)
    },
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
      sourcemap: false,
      rollupOptions: {
        output: {
          manualChunks: {
            react: ['react', 'react-dom', 'react-router-dom'],
            vendor: ['date-fns', 'dexie', 'dexie-react-hooks'],
          },
        },
      },
    },
  };
});
