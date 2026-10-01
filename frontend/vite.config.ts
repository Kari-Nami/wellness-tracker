import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { normalizeBasePath } from './src/config/basePath.ts';
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const basePath = normalizeBasePath(env.VITE_PUBLIC_BASE_PATH ?? '/');
  return {
    base: `${basePath}/`,
    plugins: [react(), tailwindcss()],
    define: {
      'import.meta.env.VITE_API_MODE': JSON.stringify(
        env.VITE_API_MODE ?? (mode === 'demo' ? 'mock' : 'real'),
      ),
    },
    server: {
      port: 5173,
      strictPort: true,
      proxy: {
        [`${basePath}/api`]: {
          target: env.BACKEND_PROXY_TARGET ?? 'http://127.0.0.1:3000',
          changeOrigin: false,
          rewrite: (path) => (basePath ? path.slice(basePath.length) : path),
        },
      },
    },
  };
});
