import { CONFIG } from '../config/monitor';

async function api(path) {
  const r = await fetch(CONFIG.API_BASE + path, { cache: 'no-store' });
  if (!r.ok) throw new Error('HTTP ' + r.status);
  return r.json();
}

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
  p.set('limit', '500');
  return api('/lotes.php?' + p);
}

export function getLote(id) {
  return api('/lotes.php?id=' + encodeURIComponent(id));
}
