import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import tsconfigPaths from "vite-tsconfig-paths";
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const isProduction = mode === 'production';
  const base = isProduction ? '/zenith-ring-planner/' : '/';
  
  // Set the base URL for the app
  process.env.VITE_BASE_URL = base;
  
  // Ensure the base URL is set for both dev and production
  process.env.BASE_URL = base;
  
  return {
    base,
    server: {
      host: "::",
      port: 8080,
      strictPort: true,
      // Handle SPA fallback for development
      proxy: {
        '/zenith-ring-planner': {
          target: 'http://localhost:8080',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/zenith-ring-planner/, '')
        }
      }
    },
    preview: {
      port: 8080,
      strictPort: true,
      headers: {
        'Cache-Control': 'public, max-age=0',
      },
      // Handle SPA fallback for preview
      proxy: {
        '/zenith-ring-planner': {
          target: 'http://localhost:8080',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/zenith-ring-planner/, '')
        }
      }
    },

    plugins: [
      react(),
      tsconfigPaths(),
      VitePWA({
        registerType: 'autoUpdate',
        devOptions: {
          enabled: true,
          type: 'module',
          navigateFallback: 'index.html',
          suppressWarnings: true
        },
        includeAssets: ['favicon.ico', 'logo.png'],
        manifest: {
          name: 'Zenith Planner - Master Your Path',
          short_name: 'Zenith Planner',
          description: 'A mindful approach to budgeting and daily planning inspired by Miyamoto Musashi\'s Five Rings',
          start_url: base,
          scope: base,
          display: 'standalone',
          background_color: '#f8fafc',
          theme_color: '#1e3a8a',
          orientation: 'portrait-primary',
          prefer_related_applications: false,
          icons: [
            {
              src: `${base}logo.png`,
              sizes: '72x72',
              type: 'image/png',
              purpose: 'any'
            },
            {
              src: `${base}logo.png`,
              sizes: '96x96',
              type: 'image/png',
              purpose: 'any'
            },
            {
              src: `${base}logo.png`,
              sizes: '128x128',
              type: 'image/png',
              purpose: 'any'
            },
            {
              src: `${base}logo.png`,
              sizes: '144x144',
              type: 'image/png',
              purpose: 'any'
            },
            {
              src: `${base}logo.png`,
              sizes: '152x152',
              type: 'image/png',
              purpose: 'any'
            },
            {
              src: `${base}logo.png`,
              sizes: '180x180',
              type: 'image/png',
              purpose: 'any'
            },
            {
              src: `${base}logo.png`,
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any'
            },
            {
              src: `${base}logo.png`,
              sizes: '384x384',
              type: 'image/png',
              purpose: 'any'
            },
            {
              src: `${base}logo.png`,
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any'
            }
          ],
          categories: ['productivity', 'finance', 'lifestyle'],
          lang: 'en-US'
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,json}'],
          navigateFallback: 'index.html',
          cleanupOutdatedCaches: true,
          clientsClaim: true,
          skipWaiting: true,
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
                },
                cacheableResponse: {
                  statuses: [0, 200]
                }
              }
            },
            {
              urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-webfonts',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
                },
                cacheableResponse: {
                  statuses: [0, 200]
                }
              }
            },
            {
              urlPattern: /^https?:\/\/unpkg\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'unpkg-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
                },
                cacheableResponse: {
                  statuses: [0, 200]
                }
              }
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
      sourcemap: true,
      rollupOptions: {
        output: {
          manualChunks: {
            react: ['react', 'react-dom', 'react-router-dom'],
            vendor: ['dexie', 'dexie-react-hooks', 'date-fns'],
          },
        },
      },
      chunkSizeWarningLimit: 1000,
      emptyOutDir: true,
    },
  };
});
