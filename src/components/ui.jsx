import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import AnimatedCounter from '../components/AnimatedCounter';
// Colores, textos e íconos de los chips: en lib/estados.js (también los usan los modales de calidad)
import { CHIP_CHICO, CHIP_ESTADO, CHIP_VARIANTS, estadoChip, etapaChip } from '../lib/estados';

// grande: para datos destacados (ej.: fechas de la etiqueta digital)
// icono (opcional): ícono de FontAwesome antes del texto. mayus: texto en mayúsculas (chips de estado)
// animado: pulso suave, el mismo del "Dosificando" del monitor (se apaga con reducción de movimiento)
// iconoGira: el ícono gira lentamente (ej.: engranaje de "En curso")
export function Chip({
  tipo = 'ok',
  grande = false,
  chico = false,
  chicoNotebook = false,
  icono,
  mayus = false,
  animado = false,
  iconoGira = false,
  children,
}) {
  // grande: alto total (31px) dentro del renglón de un texto de 22px, para no desalinear
  // chico: fechas de inicio/fin y estado del lote
  const tam = grande
    ? 'px-2 text-[18px] font-bold leading-[29px] align-middle'
    : chico
      ? CHIP_CHICO
      : chicoNotebook
        ? // chicoNotebook: tamaño chico solo en notebook (lg a 2xl); en celular, tablet y monitor grande, el normal
          'px-2.5 py-[3px] text-[14px] font-semibold lg:px-2 lg:py-px lg:text-[12px] 2xl:px-2.5 2xl:py-[3px] 2xl:text-[14px]'
        : 'px-2.5 py-[3px] text-[14px] font-semibold';
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
          className={`w-[76px] text-left text-[14px] font-bold ${
            aprobado ? 'text-teal-600 dark:text-teal-400' : 'text-gray-600 dark:text-slate-300'
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
    <Chip tipo={tipo} icono={icono} mayus chico>
      {texto}
    </Chip>
  );
}

// Estado de un insumo de la receta en curso: listo / en curso / pendiente (con ícono y en mayúsculas)
export function ChipEtapa({ listo, curso }) {
  const { tipo, texto, icono, animado, iconoGira } = etapaChip({ listo, curso });
  return (
    <Chip tipo={tipo} icono={icono} mayus animado={animado} iconoGira={iconoGira} chicoNotebook>
      {texto}
    </Chip>
  );
}

export function ProgressPill({ valor, listo }) {
  const ancho = Math.max(0, Math.min(100, valor || 0));
  return (
    // En notebook (lg a 2xl) más angosta, para que la receta entre sin scroll
    <div className="relative flex h-[22px] w-[104px] items-center justify-center overflow-hidden rounded-[5px] bg-gray-200 dark:bg-slate-800 lg:w-[72px] 2xl:w-[104px]">
      <div
        className={`absolute inset-y-0 left-0 rounded opacity-[.35] dark:opacity-[.55] ${
          listo ? 'bg-teal-600 dark:bg-teal-400' : 'bg-violet-600 dark:bg-violet-500'
        }`}
        style={{ width: `${ancho}%` }}
      />
      <span className="relative text-[14px] font-bold lg:text-[12px] 2xl:text-[14px]"><AnimatedCounter value={ancho} decimals={0} /> %</span>
    </div>
  );
}

export const labelClass =
  'text-[13px] font-extrabold uppercase tracking-[1.6px] text-gray-600 dark:text-slate-300';
export const subClass = 'text-[15px] font-medium text-gray-600 dark:text-slate-300';
