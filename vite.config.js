import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/lens/',
  plugins: [react()],
  server: {
    proxy: {
      '/api/anthropic': {
        target: 'https://api.anthropic.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/anthropic/, ''),
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq, req) => {
            const apiKey = req.headers['x-api-key-forward']
            if (apiKey) {
              proxyReq.setHeader('x-api-key', apiKey)
              proxyReq.removeHeader('x-api-key-forward')
            }
            proxyReq.setHeader('anthropic-version', '2023-06-01')
            proxyReq.setHeader('anthropic-dangerous-direct-browser-access', 'true')
          })
        }
      }
    }
  }
})
