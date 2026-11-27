// Instalación de la web app (PWA).
// Chrome/Edge (Android y escritorio) avisan con "beforeinstallprompt" que se puede instalar:
// se guarda ese evento para mostrar nuestro botón "Instalar app" y abrir el diálogo del navegador.
// Este módulo se importa al principio de main.jsx, porque el evento puede llegar antes que React.
// iPhone/iPad no tienen ese evento: ahí el botón muestra cómo hacerlo desde "Compartir".

import { useSyncExternalStore } from 'react';

let pedido = null; // evento beforeinstallprompt guardado
const oyentes = new Set();
const avisar = () => oyentes.forEach((cb) => cb());

// ¿Ya está abierta como app instalada (sin barra del navegador)?
const instalada = () =>
  window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;

// iPhone/iPad (también iPad con "sitio de escritorio", que se presenta como Mac con pantalla táctil)
const esIOS = () =>
  /iphone|ipad|ipod/i.test(navigator.userAgent) ||
  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault(); // sin el cartel automático del navegador: usamos nuestro botón
    pedido = e;
    avisar();
  });
  window.addEventListener('appinstalled', () => {
    pedido = null;
    avisar();
  });
}

const suscribir = (cb) => {
  oyentes.add(cb);
  return () => oyentes.delete(cb);
};

/**
 * Qué mostrar: 'nativo' (botón que abre el diálogo del navegador), 'ios' (instrucciones)
 * o null (ya instalada, o el navegador no permite instalar).
 */
function modo() {
  if (instalada()) return null;
  if (pedido) return 'nativo';
  if (esIOS()) return 'ios';
  return null;
}

export function useInstalarApp() {
  return useSyncExternalStore(suscribir, modo);
}

/** Abre el diálogo de instalación del navegador. Devuelve true si el usuario aceptó. */
export async function instalarApp() {
  if (!pedido) return false;
  const e = pedido;
  pedido = null; // el evento se puede usar una sola vez
  avisar();
  await e.prompt();
  const { outcome } = await e.userChoice;
  return outcome === 'accepted';
}
