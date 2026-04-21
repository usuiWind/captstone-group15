import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // In dev, proxy /api calls to the Next.js backend on :3000.
      // This makes both apps share the same origin so NextAuth cookies work.
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        configure: (proxy) => {
          proxy.on('proxyRes', (proxyRes) => {
            const location = proxyRes.headers['location']
            if (location?.startsWith('http://localhost:3000')) {
              proxyRes.headers['location'] = location.replace(
                'http://localhost:3000',
                'http://localhost:5173'
              )
            }
          })
        },
      },
    },
  },
})
