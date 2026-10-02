import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  // When VITE_API_BASE_URL is empty, browser calls same-origin /api → proxy (avoids CORS).
  // Local default: http://localhost:8000. Override with VITE_DEV_PROXY_TARGET if needed.
  const proxyTarget = env.VITE_DEV_PROXY_TARGET || 'http://localhost:8000'
  const proxySecure = proxyTarget.startsWith('https')

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      host: 'localhost',
      port: 5174,
      proxy: {
        '/api': {
          target: proxyTarget,
          changeOrigin: true,
          secure: proxySecure,
        },
        '/hubs': {
          target: proxyTarget,
          changeOrigin: true,
          secure: proxySecure,
          ws: true,
        },
      },
    },
  }
})
