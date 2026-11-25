import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Destino del proxy /api en desarrollo (npm run dev / preview). Se cambia con
  // API_DESTINO en .env.local. En producción el proxy lo hace el servidor web (Nginx/Apache).
  // MQTT_DESTINO: broker (WebSocket) al que se redirige /mqtt en desarrollo.
  const {
    API_DESTINO = 'http://10.200.1.243:8080',
    MQTT_DESTINO = 'ws://10.200.1.243:9001',
  } = loadEnv(mode, process.cwd(), '')

  // Proxy hacia la API PHP de lotes y el broker MQTT.
  // En /api evita el bloqueo CORS del navegador en desarrollo (la API no envía CORS).
  const proxy = {
    '^/mqtt$': {
      target: MQTT_DESTINO,
      ws: true,
      changeOrigin: true,
      secure: false,
    },
    '/api': {
      target: API_DESTINO,
      changeOrigin: true,
      secure: false,
      rewrite: (path) => path.replace(/^\/api/, ''),
    },
  }

  return {
    plugins: [react()],
    server: { proxy },
    preview: { proxy },
  }
})
