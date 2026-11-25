import { CONFIG } from '../config/monitor';

/**
 * Pedido a la API PHP (bajo /api, mismo sitio que la web: la cookie de sesión viaja sola).
 * Devuelve el JSON. Si el código no es 2xx lanza un Error con el texto "error" de la API
 * (o "HTTP nnn") y la propiedad status, para que la pantalla lo muestre tal cual.
 * cuerpo: objeto que se manda como JSON (con Content-Type: application/json, sin él la API responde 415).
 */
export async function pedir(path, { method = 'GET', cuerpo } = {}) {
  const opciones = { method, cache: 'no-store' };
  if (cuerpo !== undefined) {
    opciones.headers = { 'Content-Type': 'application/json' };
    opciones.body = JSON.stringify(cuerpo);
  }
  const r = await fetch(CONFIG.API_BASE + path, opciones);
  let data = null;
  try {
    data = await r.json();
  } catch {
    /* respuesta sin JSON */
  }
  if (!r.ok) {
    const err = new Error(data?.error || 'HTTP ' + r.status);
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
