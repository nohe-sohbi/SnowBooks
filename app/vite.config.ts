import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  // GitHub Pages serves the demo build from a project subpath.
  base: mode === 'demo' ? '/SnowBooks/' : '/',
  plugins: [react()],
  css: {
    postcss: './postcss.config.js',
  },
  resolve: {
    alias: [
      { find: '@', replacement: '/src' }
    ],
  },
  worker: {
    format: 'es'
  },
  server: {
    allowedHosts: ['snowbooks.sohbi.dev'],
    headers: {
      'Cross-Origin-Embedder-Policy': 'require-corp',
      'Cross-Origin-Opener-Policy': 'same-origin',
    },
    proxy: {
      '/api': {
        target: 'http://backend:3001',
        changeOrigin: true,
      },
      '/socket.io': {
        target: 'http://backend:3001',
        ws: true,
        changeOrigin: true,
      },
      '/files': {
        target: 'http://backend:3001',
        changeOrigin: true,
      },
    },
  },
}))
