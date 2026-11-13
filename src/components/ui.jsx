import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import AnimatedCounter from './AnimatedCounter';
// Colores, textos e íconos de los chips: en lib/estados.js (también los usan los modales de calidad)
import { CHIP_ESTADO, CHIP_VARIANTS, estadoChip, etapaChip } from '../lib/estados';

// grande: para datos destacados (ej.: fechas de la etiqueta digital)
// icono (opcional): ícono de FontAwesome antes del texto. mayus: texto en mayúsculas (chips de estado)
// animado: pulso suave, el mismo del "Dosificando" del monitor (se apaga con reducción de movimiento)
// iconoGira: el ícono gira lentamente (ej.: engranaje de "En curso")
export function Chip({
  tipo = 'ok',
  grande = false,
  icono,
  mayus = false,
  animado = false,
  iconoGira = false,
  children,
}) {
  // grande: alto total (31px) dentro del renglón de un texto de 22px, para no desalinear
  const tam = grande ? 'px-2 text-[18px] font-bold leading-[29px] align-middle' :'px-2.5 py-[3px] text-[13px] font-semibold';
  return (
    <span
      className={`inline-block rounded-md border border-current ${tam} ${CHIP_VARIANTS[tipo]} ${
        mayus ? CHIP_ESTADO : ''
      } ${animado ? 'animate-pulse motion-reduce:animate-none' : ''}`}
    >
      {icono && (
        <FontAwesomeIcon
          icon={icono}
          className={`mr-1.5 ${iconoGira ? 'animate-[spin_3s_linear_infinite] motion-reduce:animate-none' : ''}`}
          aria-hidden="true"
        />
      )}
      {children}
    </span>
  );
}

// Switch de aprobación por calidad: encendido (verde) = lote aprobado.
// conTexto: al lado dice "Aprobado" (verde) o "Aprobar" (gris) — se usa en la etiqueta digital;
// en la tabla de lotes va sin texto.
export function SwitchAprobar({ lote, onAprobar, deshabilitado = false, conTexto = false }) {
  const aprobado = lote.estado === 'aprobado';
  return (
    <span className="inline-flex items-center gap-2">
      <button
        type="button"
        role="switch"
        aria-checked={aprobado}
        onClick={() => onAprobar(lote, !aprobado)}
        disabled={deshabilitado}
        aria-label={`Aprobar el lote #${lote.id} ${lote.nombre_producto}`}
        title={deshabilitado ? 'Solo el administrador puede aprobar' : undefined}
        className={`relative inline-flex h-6 w-11 flex-none cursor-pointer items-center rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
          aprobado ? 'bg-teal-600 dark:bg-teal-400' : 'bg-gray-300 dark:bg-slate-700'
        }`}
      >
        <span
          className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${
            aprobado ? 'translate-x-[22px]' : 'translate-x-0.5'
          }`}
        />
      </button>
      {conTexto && (
        <span
          aria-hidden="true"
          className={`w-[68px] text-left text-[13px] font-bold ${
            aprobado ? 'text-teal-600 dark:text-teal-400' : 'text-gray-500 dark:text-slate-400'
          }`}
        >
          {aprobado ? 'Aprobado' : 'Aprobar'}
        </span>
      )}
    </span>
  );
}

// Estado del lote: completa / incompleta / aprobado / rechazado (con ícono y en mayúsculas)
export function ChipEstado({ estado }) {
  const { tipo, texto, icono } = estadoChip(estado);
  return (
    <Chip tipo={tipo} icono={icono} mayus>
      {texto}
    </Chip>
  );
}

// Estado de un insumo de la receta en curso: listo / en curso / pendiente (con ícono y en mayúsculas)
export function ChipEtapa({ listo, curso }) {
  const { tipo, texto, icono, animado, iconoGira } = etapaChip({ listo, curso });
  return (
    <Chip tipo={tipo} icono={icono} mayus animado={animado} iconoGira={iconoGira}>
      {texto}
    </Chip>
  );
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
