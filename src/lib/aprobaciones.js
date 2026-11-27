// Decisión de Calidad sobre cada lote (aprobado o rechazado con comentario), guardada en la base.
// El servidor pone usuario y fecha desde la sesión y controla qué cambios de estado se permiten (409 si no).
// lotes.php ya devuelve estado, estado_original y calidad: no hay nada que aplicar en el navegador.

import { pedir } from './api';
import { sinSesion } from './auth';

// Si la sesión venció (401), la pantalla vuelve a "sin sesión"; el error sigue para mostrar su texto
export async function conSesion(promesa) {
  try {
    return await promesa;
  } catch (e) {
    if (e.status === 401) sinSesion();
    throw e;
  }
}

/**
 * POST /api/calidad.php. decision: 'aprobado' | 'rechazado'.
 * El comentario solo se guarda en el rechazo (vacío = sin comentario).
 * Devuelve el objeto "calidad" de la respuesta: { decision, comentario, usuario, fecha }.
 */
export async function registrarDecision(id, { decision, comentario = '' }) {
  const cuerpo = { id: Number(id), decision };
  if (decision === 'rechazado') cuerpo.comentario = (comentario || '').trim();
  const data = await conSesion(pedir('/calidad.php', { method: 'POST', cuerpo }));
  return data.calidad;
}

/** DELETE /api/calidad.php?id=N: quita la aprobación o el rechazo (vuelve a sin revisar). */
export async function quitarDecision(id) {
  await conSesion(pedir('/calidad.php?id=' + encodeURIComponent(id), { method: 'DELETE' }));
}

export const aprobarLote = (id) => registrarDecision(id, { decision: 'aprobado' });
export const quitarAprobacion = quitarDecision;

/** Fila con la decisión aplicada (calidad = respuesta de la API, o null al quitarla). */
export function conDecision(lote, calidad) {
  const original = lote.estado_original ?? lote.estado;
  return calidad
    ? { ...lote, estado: calidad.decision, estado_original: original, calidad }
    : { ...lote, estado: original, estado_original: original, calidad: null };
}
