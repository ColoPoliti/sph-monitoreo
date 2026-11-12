// Utilidades de formato compartidas por las vistas del monitor.

export const clamp = (n, a, b) => Math.max(a, Math.min(b, n));

export const fmt = (n, d = 1) => (Number.isFinite(n) ? n.toFixed(d) : '—');

export const signo = (n, d = 1) => (n > 0 ? '+' : '') + fmt(n, d);

export const num = (v) =>
  v === null || v === undefined || v === '' ? null : Number(v);

// segundos -> mm:ss
export const mmss = (s) => {
  if (s === null || s === undefined || !Number.isFinite(Number(s))) return '—';
  const t = Math.round(Number(s));
  return String(Math.floor(t / 60)).padStart(2, '0') + ':' + String(t % 60).padStart(2, '0');
};

// '2026-11-06 14:02:11' -> '06/11 14:02'
export const fechaCorta = (ts) => {
  const m = /^(\d{4})-(\d{2})-(\d{2}) (\d{2}:\d{2})/.exec(ts || '');
  return m ? m[3] + '/' + m[2] + ' ' + m[4] : '—';
};

export const hoyISO = (offsetDias = 0) =>
  new Date(Date.now() + offsetDias * 864e5).toLocaleDateString('sv-SE');

// Código de materia prima con un solo prefijo "MP": 'MP-101', 'MP 101' o '101' -> 'MP 101'
export const codigoMP = (c) => {
  const limpio = String(c ?? '').trim().replace(/^(MP[\s-]*)+/i, '');
  return 'MP ' + (limpio || '-');
};
