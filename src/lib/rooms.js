import { CONFIG } from '../config/monitor';

// El PLC publica etapa 0 con todo en cero cuando está parado.
export const enEspera = (s) =>
  !s || s.etapa === null || s.etapa === 7 || (s.etapa === 0 && s.sp === 0 && s.estado === 0);

export const enLinea = (s, now = Date.now()) =>
  !!s && s.lastRx > 0 && now - s.lastRx <= CONFIG.SEGUNDOS_SIN_CONEXION * 1000;

export const nombreEtapa = (s, e) => s?.area?.etapas?.[e] || 'Etapa ' + e;

export const unidadEtapa = (s, e) => (s?.area?.unidades && s.area.unidades[e]) || 'kg';

export function subSala(s, now = Date.now()) {
  if (!enLinea(s, now)) return 'Sin conexión';
  if (enEspera(s)) return 'En espera';
  if (s.etapa >= 6) return 'Finalizado';
  if (s.etapa === 5) return nombreEtapa(s, 5);
  return 'Dosificando · ' + nombreEtapa(s, s.etapa);
}
