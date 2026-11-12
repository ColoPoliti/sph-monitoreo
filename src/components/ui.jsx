import AnimatedCounter from './AnimatedCounter';

const CHIP_VARIANTS = {
  ok: 'bg-emerald-500/15 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-300',
  inc: 'bg-amber-500/15 text-amber-700 dark:bg-amber-400/15 dark:text-amber-300',
  mal: 'bg-red-500/15 text-red-700 dark:bg-red-400/15 dark:text-red-300',
  curso: 'bg-indigo-500/15 text-indigo-700 dark:bg-indigo-400/15 dark:text-indigo-300',
  neutro: 'bg-gray-500/10 text-gray-700 dark:bg-slate-400/15 dark:text-slate-300',
  // Fondos plenos para las fechas de los lotes, con los colores del gráfico:
  // inicio = verde de la línea de peso, fin = violeta de la línea de SP
  inicio: 'bg-teal-600 text-white !border-teal-600 dark:bg-teal-400 dark:text-gray-900 dark:!border-teal-400',
  fin: 'bg-violet-600 text-white !border-violet-600 dark:bg-violet-400 dark:text-gray-900 dark:!border-violet-400',
};

// grande: para datos destacados (ej.: fechas de la etiqueta digital)
export function Chip({ tipo = 'ok', grande = false, children }) {
  // grande: alto total (31px) dentro del renglón de un texto de 22px, para no desalinear
  const tam = grande ? 'px-2 text-[18px] font-bold leading-[29px] align-middle' :'px-2.5 py-[3px] text-[13px] font-semibold';
  return (
    <span
      className={`inline-block rounded-md border border-current ${tam} ${CHIP_VARIANTS[tipo]}`}
    >
      {children}
    </span>
  );
}

export function ChipEstado({ estado }) {
  const ok = estado === 'completa';
  return <Chip tipo={ok ? 'ok' : 'inc'}>{ok ? 'Completa' : 'Incompleta'}</Chip>;
}

export function ProgressPill({ valor, listo }) {
  const ancho = Math.max(0, Math.min(100, valor || 0));
  return (
    <div className="relative flex h-[22px] w-[104px] items-center justify-center overflow-hidden rounded-[5px] bg-gray-200 dark:bg-slate-800">
      <div
        className={`absolute inset-y-0 left-0 rounded opacity-[.35] dark:opacity-[.55] ${
          listo ? 'bg-teal-600 dark:bg-teal-400' : 'bg-violet-600 dark:bg-violet-500'
        }`}
        style={{ width: `${ancho}%` }}
      />
      <span className="relative text-[13px] font-bold"><AnimatedCounter value={ancho} decimals={0} /> %</span>
    </div>
  );
}

export const labelClass =
  'text-[12px] font-extrabold uppercase tracking-[1.6px] text-gray-500 dark:text-slate-400';
export const subClass = 'text-[15px] font-medium text-gray-500 dark:text-slate-400';
