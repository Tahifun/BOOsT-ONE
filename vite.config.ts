import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  // Backend-Ziel: bevorzugt VITE_API_URL, sonst VITE_BACKEND_URL, sonst Localhost
  const apiTarget =
    env.VITE_API_URL ||
    env.VITE_BACKEND_URL ||
    'http://127.0.0.1:4001';

  return {
    plugins: [react()],

    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
        '@components': fileURLToPath(new URL('./src/components', import.meta.url)),
        '@pages': fileURLToPath(new URL('./src/pages', import.meta.url)),
        '@contexts': fileURLToPath(new URL('./src/contexts', import.meta.url)),
        '@hooks': fileURLToPath(new URL('./src/hooks', import.meta.url)),
        '@services': fileURLToPath(new URL('./src/services', import.meta.url)),
        '@utils': fileURLToPath(new URL('./src/utils', import.meta.url)),
        '@types': fileURLToPath(new URL('./src/types', import.meta.url))
      }
    },

    server: {
      port: 5173,
      strictPort: true,
      host: true,
      proxy: {
        // 1) Normale API-Routen
        '/api': {
          target: apiTarget,
          changeOrigin: true,
          secure: false,
          ws: true,
          configure: (proxy) => {
            proxy.on('error', (err) => console.debug('[proxy:/api] error', err));
            proxy.on('proxyReq', (_proxyReq, req) =>
              console.debug('[proxy:/api] →', req.method, req.url)
            );
          }
        },

        // 2) Swagger/Dokumentation
        '/docs': {
          target: apiTarget,
          changeOrigin: true
        },

        // 3) Kurzpfad: /session → /api/session
        '/session': {
          target: apiTarget,
          changeOrigin: true,
          secure: false,
          rewrite: (p) => p.replace(/^\/session/, '/api/session'),
          configure: (proxy) => {
            proxy.on('proxyReq', (_proxyReq, req) =>
              console.debug('[proxy:/session→/api/session] →', req.method, req.url)
            );
          }
        },

        // 4) 🔐 Auth-Endpunkte ohne /api-Präfix → /api/auth/*
        '/auth': {
          target: apiTarget,
          changeOrigin: true,
          secure: false,
          rewrite: (p) => p.replace(/^\/auth/, '/api/auth'),
          configure: (proxy) => {
            proxy.on('proxyReq', (_proxyReq, req) =>
              console.debug('[proxy:/auth→/api/auth] →', req.method, req.url)
            );
          }
        },

        // 5) Optional: /subscription → /api/subscription
        '/subscription': {
          target: apiTarget,
          changeOrigin: true,
          secure: false,
          rewrite: (p) => p.replace(/^\/subscription/, '/api/subscription'),
          configure: (proxy) => {
            proxy.on('proxyReq', (_proxyReq, req) =>
              console.debug('[proxy:/subscription→/api/subscription] →', req.method, req.url)
            );
          }
        }
      }
    },

    build: {
      sourcemap: mode !== 'production',
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom', 'react-router-dom'],
            ui: ['framer-motion', 'lucide-react'],
            charts: ['recharts', 'd3'],
            three: ['three']
          }
        }
      }
    },

    optimizeDeps: {
      include: ['react', 'react-dom', 'react-router-dom']
    }
  };
});
