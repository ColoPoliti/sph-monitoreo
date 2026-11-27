import { CONFIG } from '../config/monitor';
import { DEMO } from './demo';
import { esRutaDemo, respuestaDemo } from './demoApi';

/**
 * Pedido a la API PHP (bajo /api, mismo sitio que la web: la cookie de sesión viaja sola).
 * Devuelve el JSON. Si el código no es 2xx lanza un Error con el texto "error" de la API
 * (o un texto entendible según el código HTTP, ver mensajeHttp) y la propiedad status (0 = sin conexión), para que la pantalla lo muestre tal cual.
 * cuerpo: objeto que se manda como JSON (con Content-Type: application/json, sin él la API responde 415).
 */
// Texto entendible cuando la API no manda su propio "error" (proxy caído, servidor apagado, etc.)
function mensajeHttp(status) {
  if (status === 502 || status === 503 || status === 504) return 'El servidor no responde en este momento';
  if (status === 404) return 'El servicio no está disponible en el servidor';
  if (status === 401) return 'La sesión venció, volvé a ingresar';
  if (status === 403) return 'No tenés permiso para esta acción';
  if (status === 429) return 'Demasiados intentos, esperá unos minutos';
  if (status >= 500) return 'Error interno del servidor';
  return 'Error inesperado del servidor (código ' + status + ')';
}

export async function pedir(path, { method = 'GET', cuerpo } = {}) {
  // Modo demo (?demo): login y usuarios simulados, sin servidor (ver lib/demoApi.js)
  if (DEMO && esRutaDemo(path)) return respuestaDemo(path, method, cuerpo);

  const opciones = { method, cache: 'no-store' };
  if (cuerpo !== undefined) {
    opciones.headers = { 'Content-Type': 'application/json' };
    opciones.body = JSON.stringify(cuerpo);
  }
  let r;
  try {
    r = await fetch(CONFIG.API_BASE + path, opciones);
  } catch {
    // Sin red o sin respuesta del servidor (fetch no llega a recibir nada)
    const err = new Error('Sin conexión con el servidor');
    err.status = 0;
    throw err;
  }
  let data = null;
  try {
    data = await r.json();
  } catch {
    /* respuesta sin JSON */
  }
  if (!r.ok) {
    const err = new Error(data?.error || mensajeHttp(r.status));
    err.status = r.status;
    throw err;
  }
  return data;
}

// lotes.php ya trae estado (decisión de Calidad o completa/incompleta), estado_original y calidad
const api = (path) => pedir(path);

export function getUltimas({ area, sala, limit = 4 }) {
  const params = new URLSearchParams({ area, sala, limit: String(limit) });
  return api('/lotes.php?' + params);
}

export function getHistorial(filtro) {
  const p = new URLSearchParams();
  if (filtro.sector && filtro.sector !== 'todos') p.set('area', filtro.sector);
  if (filtro.plc && filtro.plc !== 'todos') p.set('sala', filtro.plc);
  if (filtro.desde) p.set('desde', filtro.desde);
  if (filtro.hasta) p.set('hasta', filtro.hasta);
  if (filtro.horaD && filtro.horaH && !(filtro.horaD === '00:00' && filtro.horaH === '23:59')) {
    p.set('horaD', filtro.horaD);
    p.set('horaH', filtro.horaH);
  }
  // Filtro opcional de la API: aprobado | rechazado | sin_revisar
  if (filtro.estado && filtro.estado !== 'todos') p.set('estado', filtro.estado);
  p.set('limit', '500');
  return api('/lotes.php?' + p);
}

export function getLote(id) {
  return api('/lotes.php?id=' + encodeURIComponent(id));
}
