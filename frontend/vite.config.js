import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load environment variables from .env file
  const env = loadEnv(mode, process.cwd(), '')

  // Use your backend URL or fallback to localhost
  const backendUrl = env.VITE_BACKEND_URL || 'http://localhost:8000'
  console.log('Backend URL:', backendUrl)

  return {
    plugins: [react()],
    server: {
      proxy: {
        '/api': {
          target: `${backendUrl}`,
          changeOrigin: true,
        },
        '/cities': {
          target: `${backendUrl}/api`,
          changeOrigin: true,
        },
        '/sites': {
          target: `${backendUrl}/api`,
          changeOrigin: true,
        },
      },
    },
  }
})
