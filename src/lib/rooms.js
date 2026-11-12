import { CONFIG } from '../config/monitor';

// El PLC publica etapa 0 con todo en cero cuando está parado, o etapa 7 (en espera).
export const esEspera = (etapa, sp, estado) =>
  etapa === null || etapa === 7 || (etapa === 0 && sp === 0 && estado === 0);

export const enEspera = (s) => !s || esEspera(s.etapa, s.sp, s.estado);

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
