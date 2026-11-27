import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// Web app instalable (PWA). El service worker guarda la app (HTML, JS, CSS, fuentes, imágenes)
// para abrirla rápido; los datos (/api), el broker (/mqtt) y config.env siempre van al servidor.
// registerType 'prompt': la versión nueva NO se aplica sola; la app avisa y el usuario toca "Actualizar"
// (ver src/components/ActualizacionPWA.jsx).
const pwa = VitePWA({
  registerType: 'prompt',
  injectRegister: false, // se registra desde React (virtual:pwa-register/react)
  includeManifestIcons: false, // los íconos ya entran por globPatterns (evita duplicados en la precarga)
  manifest: {
    name: 'Monitor de salas · SPH',
    short_name: 'SPH Monitor',
    description: 'Monitoreo en vivo de salas y aprobación de lotes por Calidad',
    lang: 'es',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#020617', // slate-950, el fondo del tema oscuro
    theme_color: '#020617',
    icons: [
      { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
      { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
      { src: 'pwa-maskable-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  },
  workbox: {
    globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
    // Rutas de la app (/historial, /lotes/13) abren index.html; la API, el broker y la config no
    navigateFallback: '/index.html',
    navigateFallbackDenylist: [/^\/api\//, /^\/mqtt$/, /^\/config\.env$/],
    cleanupOutdatedCaches: true,
  },
})

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
    plugins: [react(), pwa],
    server: { proxy },
    preview: { proxy },
  }
})
