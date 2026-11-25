import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// Inter incluida en el proyecto (funciona sin internet y trae las variantes de .codigo)
import 'inter-ui/inter-variable-latin.css'
import './index.css'
import { cargarEntorno } from './lib/entorno'
import { ThemeProvider } from './context/ThemeContext'

// Primero config.env (broker, API) y recién después la app,
// porque src/config/monitor.js lee esos valores al importarse.
cargarEntorno()
  .then(() => import('./App.jsx'))
  .then(({ default: App }) => {
    createRoot(document.getElementById('root')).render(
      <StrictMode>
        <ThemeProvider>
          <App />
        </ThemeProvider>
      </StrictMode>,
    )
  })
