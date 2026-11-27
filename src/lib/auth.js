// Sesión de la vista de aprobación de lotes por Calidad, contra la API (base MariaDB).
// Dos perfiles: "admin" (aprueba, rechaza y quita) y "usuario" (solo consulta).
//
// La sesión viaja en una cookie HttpOnly (SPHSESION) que pone el servidor: el JS no la ve.
// Acá solo se guarda en memoria lo que devuelve la API para dibujar la pantalla;
// la fuente es /api/sesion.php (se consulta al abrir o recargar la página).
// Vence a las 8 h sin uso y al cerrar el navegador: si una llamada devuelve 401 -> sin sesión.

import { useSyncExternalStore } from 'react';
import { pedir } from './api';

export const ROLES = {
  superadmin: 'Superadministrador',
  admin: 'Administrador',
  usuario: 'Usuario',
};

// Aprueban, rechazan y quitan decisiones de Calidad: el administrador y el superadministrador
export const puedeAprobar = (rol) => rol === 'admin' || rol === 'superadmin';
// Solo el superadministrador crea, ve y da de baja usuarios (pantalla /usuarios)
export const esSuperadmin = (rol) => rol === 'superadmin';

const SIN_SESION = { usuario: null, nombre: null, rol: null };
let actual = SIN_SESION;

// ---- Aviso de cambios de sesión, para que la pantalla se actualice sin refrescar ----
const oyentes = new Set();
const suscribir = (cb) => {
  oyentes.add(cb);
  return () => oyentes.delete(cb);
};

function fijar(datos) {
  actual = datos?.usuario
    ? { usuario: datos.usuario, nombre: datos.nombre || null, rol: datos.rol || null }
    : SIN_SESION;
  oyentes.forEach((cb) => cb());
}

/** Vuelve a "sin sesión" (por ejemplo, cuando una llamada devuelve 401). */
export const sinSesion = () => fijar(null);

/**
 * POST /api/login.php. Devuelve true si entró; si no, lanza un Error con el texto
 * de la API ("Usuario o contraseña incorrectos", "Demasiados intentos fallidos...").
 */
export async function iniciarSesion(usuario, clave) {
  const data = await pedir('/login.php', { method: 'POST', cuerpo: { usuario: usuario.trim(), clave } });
  fijar(data);
  return true;
}

/** GET /api/sesion.php: ¿sigue logueado y con qué rol? (401 = sin sesión) */
export async function verificarSesion() {
  try {
    fijar(await pedir('/sesion.php'));
  } catch {
    fijar(null);
  }
}

/** POST /api/logout.php. La pantalla pasa a "sin sesión" en el momento. */
export async function cerrarSesion() {
  fijar(null);
  try {
    await pedir('/logout.php', { method: 'POST', cuerpo: {} });
  } catch {
    /* igual queda sin sesión en esta pantalla */
  }
}

/**
 * Sesión actual reactiva: el componente se vuelve a dibujar al iniciar o cerrar sesión.
 * Devuelve { usuario, nombre, rol } o todo en null.
 */
export function useSesion() {
  return useSyncExternalStore(suscribir, () => actual);
}

export const usuarioActual = () => actual.usuario;
export const rolActual = () => actual.rol;

// Al cargar la app (este módulo se importa después de leer config.env), se consulta la sesión
verificarSesion();
