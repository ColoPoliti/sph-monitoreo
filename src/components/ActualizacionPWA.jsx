import { useEffect } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { toastVersionNueva } from '../lib/alertasCalidad';

// Cada cuánto se pregunta al servidor si hay una versión nueva (además de al volver a la pestaña)
const REVISAR_CADA_MS = 15 * 60 * 1000; // 15 minutos

/**
 * Registra el service worker de la web app y avisa cuando el servidor tiene una versión nueva.
 * El aviso sale SOLO si cambió la versión en el servidor (otro build subido): un toast arriba con
 * "Actualizar". Al tocarlo se activa la versión nueva y la página se recarga. No dibuja nada.
 */
export default function ActualizacionPWA() {
  const {
    needRefresh: [hayVersionNueva],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_url, registro) {
      if (!registro) return;
      const revisar = () => {
        if (document.visibilityState === 'hidden' || !navigator.onLine) return;
        registro.update().catch(() => {
          /* sin conexión: se vuelve a intentar más tarde */
        });
      };
      setInterval(revisar, REVISAR_CADA_MS);
      document.addEventListener('visibilitychange', revisar);
    },
  });

  useEffect(() => {
    if (!hayVersionNueva) return;
    toastVersionNueva().then((actualizar) => {
      if (!actualizar) return;
      updateServiceWorker(true); // activa la versión nueva y recarga
      // Respaldo: en la primera visita la página todavía no la controla el service worker
      // y la recarga automática no llega; si en 3 s no recargó, se recarga igual.
      setTimeout(() => window.location.reload(), 3000);
    });
  }, [hayVersionNueva, updateServiceWorker]);

  return null;
}
