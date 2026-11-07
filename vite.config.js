import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Proxy hacia la API PHP de lotes.
// Evita el bloqueo CORS del navegador en desarrollo (la API no envía CORS).
// En producción se puede sobrescribir con VITE_API_BASE.
const apiProxy = {
  '/api': {
    target: 'https://api.marcospoliti.ar',
    changeOrigin: true,
    secure: true,
    rewrite: (path) => path.replace(/^\/api/, ''),
  },
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: { proxy: apiProxy },
  preview: { proxy: apiProxy },
})
