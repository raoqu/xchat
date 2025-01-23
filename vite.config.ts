import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/v1': {
        target: 'http://127.0.0.1:1234',
        changeOrigin: true,
      },
      '/speak': {
        target: 'http://127.0.0.1:5001',
        changeOrigin: true,
      },
      '/play': {
        target: 'http://127.0.0.1:5001',
        changeOrigin: true,
      },
    },
  },
})
