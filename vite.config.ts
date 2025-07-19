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
        registerType: 'autoUpdate',
        devOptions: {
          enabled: true
        },
        includeAssets: ['logo.png', 'favicon.ico'],
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
          navigateFallback: `${base}index.html`,
        },
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
              src: 'logo.png',
              sizes: '192x192',
              type: 'image/png'
            },
            {
              src: 'logo.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any maskable'
            }
          ]
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
