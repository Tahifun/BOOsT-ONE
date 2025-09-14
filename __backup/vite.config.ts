import { logger } from '@/lib/logger';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  // Backend-Ziel: bevorzugt VITE_API_URL, sonst VITE_BACKEND_URL, sonst localhost:4001
  const apiTarget =
    env.VITE_API_URL ||
    env.VITE_BACKEND_URL ||
    'http://127.0.0.1:4001';

  return {
    plugins: [react()],

    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        '@components': path.resolve(__dirname, './src/components'),
        '@pages': path.resolve(__dirname, './src/pages'),
        '@contexts': path.resolve(__dirname, './src/contexts'),
        '@hooks': path.resolve(__dirname, './src/hooks'),
        '@services': path.resolve(__dirname, './src/services'),
        '@utils': path.resolve(__dirname, './src/utils'),
        '@types': path.resolve(__dirname, './src/types'),
      },
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
            proxy.on('error', (err) => logger.debug('[proxy:/api] error', err));
            proxy.on('proxyReq', (_proxyReq, req) =>
              logger.debug('[proxy:/api] →', req.method, req.url)
            );
          },
        },

        // 2) Swagger/Dokumentation
        '/docs': {
          target: apiTarget,
          changeOrigin: true,
        },

        // 3) Kurzpfad: /session → /api/session
        '/session': {
          target: apiTarget,
          changeOrigin: true,
          secure: false,
          rewrite: (p) => p.replace(/^\/session/, '/api/session'),
          configure: (proxy) => {
            proxy.on('proxyReq', (_proxyReq, req) =>
              logger.debug('[proxy:/session→/api/session] →', req.method, req.url)
            );
          },
        },

        // 4) 🔐 Auth-Endpunkte ohne /api-Präfix → /api/auth/*
        '/auth': {
          target: apiTarget,
          changeOrigin: true,
          secure: false,
          rewrite: (p) => p.replace(/^\/auth/, '/api/auth'),
          configure: (proxy) => {
            proxy.on('proxyReq', (_proxyReq, req) =>
              logger.debug('[proxy:/auth→/api/auth] →', req.method, req.url)
            );
          },
        },

        // 5) Optional: /subscription → /api/subscription (falls das Frontend das so aufruft)
        '/subscription': {
          target: apiTarget,
          changeOrigin: true,
          secure: false,
          rewrite: (p) => p.replace(/^\/subscription/, '/api/subscription'),
          configure: (proxy) => {
            proxy.on('proxyReq', (_proxyReq, req) =>
              logger.debug('[proxy:/subscription→/api/subscription] →', req.method, req.url)
            );
          },
        },
      },
    },

    build: {
      sourcemap: mode !== 'production',
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom', 'react-router-dom'],
            ui: ['framer-motion', 'lucide-react'],
            charts: ['recharts', 'd3'],
            three: ['three'],
          },
        },
      },
    },

    optimizeDeps: {
      include: ['react', 'react-dom', 'react-router-dom'],
    },
  };
});
