// Sesión de la vista de aprobación de lotes por Calidad.
// Dos perfiles: "admin" (aprueba y rechaza) y "usuario" (solo consulta).
//
// PROVISORIO: las credenciales se validan acá, en el navegador. Cuando se defina
// dónde se guardan usuario y contraseña (ej.: un login.php contra la base),
// reemplazar SOLO el cuerpo de validarCredenciales por esa consulta
// (debe devolver el perfil: 'admin' | 'usuario', o null si no coincide).
// Mientras tanto se toman de .env.local y, si no están definidas:
//   administrador -> admin / admin        (VITE_ADMIN_USER / VITE_ADMIN_PASS)
//   usuario común -> usuario / usuario    (VITE_USER_USER / VITE_USER_PASS)

import { useSyncExternalStore } from 'react';

const CLAVE_SESION = 'sph-admin';

export const ROLES = {
  admin: 'Administrador',
  usuario: 'Usuario',
};

export async function validarCredenciales(usuario, clave) {
  const u = usuario.trim();
  const env = import.meta.env;
  const cuentas = [
    { usuario: env.VITE_ADMIN_USER || 'admin', clave: env.VITE_ADMIN_PASS || 'admin', rol: 'admin' },
    { usuario: env.VITE_USER_USER || 'usuario', clave: env.VITE_USER_PASS || 'usuario', rol: 'usuario' },
  ];
  return cuentas.find((c) => c.usuario === u && c.clave === clave)?.rol || null;
}

export async function iniciarSesion(usuario, clave) {
  const rol = await validarCredenciales(usuario, clave);
  if (rol) {
    try {
      sessionStorage.setItem(CLAVE_SESION, JSON.stringify({ usuario: usuario.trim(), rol }));
    } catch {
      /* sin storage: la sesión dura lo que la página */
    }
    avisarCambio();
  }
  return Boolean(rol);
}

// ---- Aviso de cambios de sesión, para que la pantalla se actualice sin refrescar ----
const EVENTO = 'sph-sesion';
const avisarCambio = () => window.dispatchEvent(new Event(EVENTO));

const suscribir = (cb) => {
  window.addEventListener(EVENTO, cb);
  return () => window.removeEventListener(EVENTO, cb);
};

const leerCruda = () => {
  try {
    return sessionStorage.getItem(CLAVE_SESION);
  } catch {
    return null;
  }
};

/**
 * Sesión actual reactiva: el componente se vuelve a dibujar al iniciar o cerrar sesión.
 * Devuelve { usuario, rol } o { usuario: null, rol: null }.
 */
export function useSesion() {
  useSyncExternalStore(suscribir, leerCruda);
  return { usuario: usuarioActual(), rol: rolActual() };
}

const sesion = () => {
  try {
    return JSON.parse(sessionStorage.getItem(CLAVE_SESION) || 'null');
  } catch {
    return null;
  }
};

export const usuarioActual = () => sesion()?.usuario || null;

// Sesiones viejas sin perfil se toman como admin (eran las únicas que existían)
export const rolActual = () => (sesion() ? sesion().rol || 'admin' : null);

export function cerrarSesion() {
  try {
    sessionStorage.removeItem(CLAVE_SESION);
  } catch {
    /* nada */
  }
  avisarCambio();
}
