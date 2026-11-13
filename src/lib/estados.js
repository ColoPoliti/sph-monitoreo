// Colores de los chips (badges) y estados de los lotes, compartidos por
// components/ui.jsx (Chip / ChipEstado) y los modales de SweetAlert (lib/alertasCalidad.js).
import {
  faCheck,
  faCircleCheck,
  faCircleXmark,
  faListCheck,
  faGear,
  faHourglassHalf,
  faTriangleExclamation,
} from '@fortawesome/free-solid-svg-icons';

export const CHIP_VARIANTS = {
  ok: 'bg-emerald-500/15 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-300',
  inc: 'bg-amber-500/15 text-amber-700 dark:bg-amber-400/15 dark:text-amber-300',
  mal: 'bg-red-500/15 text-red-700 dark:bg-red-400/15 dark:text-red-300',
  curso: 'bg-indigo-500/15 text-indigo-700 dark:bg-indigo-400/15 dark:text-indigo-300',
  neutro: 'bg-gray-500/10 text-gray-700 dark:bg-slate-400/15 dark:text-slate-300',
  calidad: 'bg-sky-500/15 text-sky-700 dark:bg-sky-400/15 dark:text-sky-300',
  // Fondos plenos para las fechas de los lotes, con los colores del gráfico:
  // inicio = verde de la línea de peso, fin = violeta de la línea de SP
  inicio: 'bg-teal-600 text-white !border-teal-600 dark:bg-teal-400 dark:text-gray-900 dark:!border-teal-400',
  fin: 'bg-violet-600 text-white !border-violet-600 dark:bg-violet-400 dark:text-gray-900 dark:!border-violet-400',
};

// Clases base de un chip de tamaño normal
export const CHIP_BASE = 'inline-block rounded-md border border-current px-2.5 py-[3px] text-[13px] font-semibold';

// Chips de estado: en mayúsculas
export const CHIP_ESTADO = 'uppercase tracking-[0.4px]';

// Estado del lote -> { tipo de chip, texto, ícono }
export function estadoChip(estado) {
  if (estado === 'aprobado') return { tipo: 'calidad', texto: 'Aprobado por calidad', icono: faCircleCheck };
  if (estado === 'rechazado') return { tipo: 'mal', texto: 'Rechazado por calidad', icono: faCircleXmark };
  if (estado === 'completa') return { tipo: 'ok', texto: 'Completa', icono: faListCheck };
  return { tipo: 'inc', texto: 'Incompleta', icono: faTriangleExclamation };
}

// Estado de cada insumo de la receta en curso (monitor de sala)
export function etapaChip({ listo, curso }) {
  if (listo) return { tipo: 'ok', texto: 'Listo', icono: faCheck };
  if (curso) return { tipo: 'curso', texto: 'En curso', icono: faGear, animado: true, iconoGira: true };
  return { tipo: 'inc', texto: 'Pendiente', icono: faHourglassHalf };
}
