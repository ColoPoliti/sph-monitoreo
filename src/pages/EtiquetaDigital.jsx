import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircleInfo, faClock, faFilePdf, faFlask } from '@fortawesome/free-solid-svg-icons';
import DataTable from '../components/DataTable';
import { Chip, ChipEstado, SwitchAprobar, labelClass, subClass } from '../components/ui';
import { CONFIG, areaDe } from '../config/monitor';
import { getLote } from '../lib/api';
import { descargarRecetaPdf } from '../lib/recetaPdf';
import { useAprobacionCalidad } from '../lib/useAprobacionCalidad';
import { useRefresco } from '../lib/useRefresco';
import { codigoMP, fechaCorta, fmt, mmss, num, signo } from '../lib/format';

const CARD = 'rounded-md bg-white dark:bg-slate-900/60 shadow-md dark:shadow-none px-4 py-[18px] sm:px-[22px]';

// Detalle de insumos del lote: valores de cada etapa, con su unidad
const unidad = (e) => e.unidad || 'kg';
const fueraDeTolerancia = (e) => {
  const pct = num(e.diferencia_pct);
  return pct !== null && Math.abs(pct) > CONFIG.TOLERANCIA_PCT;
};
const conUnidad = (v, e, formato = fmt) => (num(v) === null ? '—' : `${formato(num(v))} ${unidad(e)}`);

const COLUMNAS_ETAPAS = [
  {
    id: 'insumo',
    titulo: 'Insumo',
    valor: (e) => e.insumo || e.etapa_clave,
    celda: (e) => (
      <>
        {e.insumo || e.etapa_clave}
        {e.codigo_mp && (
          <>
            <br />
            <span className="codigo text-[14px] text-gray-600 dark:text-slate-300">{codigoMP(e.codigo_mp)}</span>
          </>
        )}
      </>
    ),
  },
  { id: 'sp', titulo: 'SP', alinear: 'right', valor: (e) => num(e.sp), celda: (e) => conUnidad(e.sp, e), clase: 'whitespace-nowrap tabular-nums' },
  { id: 'cargado', titulo: 'Cargado', alinear: 'right', valor: (e) => num(e.cargado), celda: (e) => conUnidad(e.cargado, e), clase: 'whitespace-nowrap font-bold tabular-nums' },
  { id: 'diferencia', titulo: 'Diferencia', alinear: 'right', valor: (e) => num(e.diferencia), celda: (e) => conUnidad(e.diferencia, e, signo), clase: 'whitespace-nowrap tabular-nums' },
  {
    id: 'pct',
    titulo: 'Dif. %',
    alinear: 'right',
    valor: (e) => num(e.diferencia_pct),
    celda: (e) => (num(e.diferencia_pct) === null ? '—' : `${signo(num(e.diferencia_pct))} %`),
    clase: 'whitespace-nowrap tabular-nums',
  },
  { id: 'duracion', titulo: 'Duración', alinear: 'right', valor: (e) => num(e.duracion_s), celda: (e) => mmss(e.duracion_s), clase: 'whitespace-nowrap tabular-nums' },
  {
    id: 'tolerancia',
    titulo: 'Tolerancia',
    alinear: 'center',
    valor: (e) => (num(e.sp) === null || num(e.diferencia_pct) === null ? null : fueraDeTolerancia(e) ? 'Fuera' : 'OK'),
    celda: (e) =>
      num(e.sp) === null || num(e.diferencia_pct) === null ? (
        '—'
      ) : (
        <Chip tipo={fueraDeTolerancia(e) ? 'mal' : 'ok'}>{fueraDeTolerancia(e) ? 'Fuera' : 'OK'}</Chip>
      ),
  },
];

export default function EtiquetaDigital() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [estado, setEstado] = useState({
    id: null,
    data: null,
    error: '',
    cargando: true,
  });

  useEffect(() => {
    let cancelado = false;

    getLote(id)
      .then((d) => {
        if (!cancelado) setEstado({ id, data: d, error: '', cargando: false });
      })
      .catch((e) => {
        if (!cancelado) {
          setEstado({
            id,
            data: null,
            error: 'No se pudo cargar el lote (' + e.message + ').',
            cargando: false,
          });
        }
      });

    return () => {
      cancelado = true;
    };
  }, [id]);

  // Refresco en segundo plano: si Calidad cambia el lote desde otra PC, se ve sin apretar F5.
  // Si falla, queda como estaba; si mientras tanto se abrió otro lote, se descarta.
  useRefresco(() => {
    const pedido = id;
    getLote(pedido)
      .then((d) => {
        setEstado((e) => (e.id === pedido && !e.cargando && e.data ? { ...e, data: d } : e));
      })
      .catch(() => {
        /* queda como estaba */
      });
  });

  const cargando = estado.id !== id || estado.cargando;
  const data = estado.id === id ? estado.data : null;
  const error = estado.id === id ? estado.error : '';

  const volver = () => {
    if (window.history.length > 1) navigate(-1);
    else navigate('/');
  };

  const lote = data?.lote;
  const area = lote ? areaDe(lote.area) : null;

  // Con sesión de administrador: switch de aprobación al lado del PDF.
  // El hook trabaja con una lista de filas; acá la "lista" es solo este lote.
  const { esAdmin, onAprobar } = useAprobacionCalidad((fn) =>
    setEstado((e) => (e.data?.lote ? { ...e, data: { ...e.data, lote: fn([e.data.lote])[0] } } : e)),
  );

  const [generandoPdf, setGenerandoPdf] = useState(false);
  const descargarPdf = async () => {
    setGenerandoPdf(true);
    try {
      await descargarRecetaPdf(lote, data.etapas || []);
    } finally {
      setGenerandoPdf(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
        <button
          type="button"
          onClick={volver}
          className="min-h-11 cursor-pointer rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-[18px] py-1.5 text-[15px] font-bold text-gray-900 dark:text-white transition-colors hover:bg-gray-100 dark:hover:bg-slate-700"
        >
          ← Volver
        </button>
      </div>

      {cargando && <p className={subClass}>Cargando…</p>}

      {!cargando && error && (
        <p className="text-sm font-medium text-red-600 dark:text-red-400">{error}</p>
      )}

      {!cargando && data && lote && (
        <div className="flex flex-col gap-6">
          {/* Small y medium (< lg): producto arriba, línea divisoria y código de barras debajo. Desktop (lg): lado a lado */}
          <section className={`${CARD} flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between lg:gap-x-6`}>
            <div className="flex min-w-0 flex-col gap-1.5 lg:flex-1">
              <h1 className="m-0 text-2xl font-extrabold leading-[1.15] [overflow-wrap:anywhere] sm:text-[28px]">
                {lote.nombre_producto}
              </h1>
              <span className={subClass}>
                {area ? area.label : lote.area} {lote.sala} · Lote #{lote.id} ·
                Tolva {lote.tolva === null ? '-' : lote.tolva}
              </span>
            </div>
            <div className="flex flex-col items-start gap-1.5 border-t border-gray-200 pt-3 dark:border-slate-800 lg:flex-none lg:items-end lg:border-0 lg:pt-0">
              <span className={labelClass}>Código de barras</span>
              <span className="codigo text-2xl font-bold tabular-nums text-violet-700 dark:text-violet-300 sm:text-[28px]">
                {lote.codigo_barra}
              </span>
              <ChipEstado estado={lote.estado} />
            </div>
          </section>

          {/* Card de datos (inicio, fin, tiempo, origen) y, al lado, card de acciones (switch y PDF).
              Mobile y tablet (< lg): una debajo de la otra */}
          <div className="flex flex-col gap-6 lg:flex-row">
            {/* Mobile y tablet (< lg): datos apilados con una línea entre cada uno. Desde lg: en fila */}
            <section className={`${CARD} flex flex-col divide-y divide-gray-200 dark:divide-slate-800 lg:flex-1 lg:flex-row lg:flex-wrap lg:items-center lg:gap-x-12 lg:gap-y-4 lg:divide-y-0`}>
              <div className="flex flex-col gap-1 py-3 first:pt-0 last:pb-0 lg:py-0">
                <span className={labelClass}>Inicio</span>
                <span className="text-[22px] font-bold tabular-nums">
                  {lote.inicio ? (
                    <Chip tipo="inicio" chico>{fechaCorta(lote.inicio)}</Chip>
                  ) : (
                    '—'
                  )}
                </span>
              </div>
              <div className="flex flex-col gap-1 py-3 first:pt-0 last:pb-0 lg:py-0">
                <span className={labelClass}>Fin</span>
                <span className="text-[22px] font-bold tabular-nums">
                  {lote.fin ? <Chip tipo="fin" chico>{fechaCorta(lote.fin)}</Chip> : '—'}
                </span>
              </div>
              <div className="flex flex-col gap-1 py-3 first:pt-0 last:pb-0 lg:py-0">
                <span className={labelClass}>Tiempo total</span>
                <span className="text-[22px] font-bold tabular-nums">
                  <FontAwesomeIcon icon={faClock} className="mr-2 text-[18px] text-gray-400 dark:text-slate-400" />
                  {mmss(lote.tiempo_total_s)}
                </span>
              </div>
              <div className="flex flex-col gap-1 py-3 first:pt-0 last:pb-0 lg:py-0">
                <span className={labelClass}>Origen de los valores</span>
                <span className="text-[22px] font-bold">
                  {lote.fuente === 'plc' ? 'Etiqueta del PLC' : 'Telemetría'}
                </span>
              </div>
            </section>

            {/* Acciones: switch de aprobación (solo admin) y descarga de la receta en PDF */}
            <section
              aria-label="Acciones del lote"
              className={`${CARD} flex flex-wrap items-center justify-center gap-x-5 gap-y-3 lg:flex-none`}
            >
              {esAdmin && <SwitchAprobar lote={lote} onAprobar={onAprobar} conTexto />}
              {/* Botón sólido con el rojo de Acrobat (PDF), con la forma de los demás botones de la app */}
              <button
                type="button"
                onClick={descargarPdf}
                disabled={generandoPdf}
                className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-lg bg-[#b30b00] px-[18px] py-1.5 text-[15px] font-bold text-white shadow-sm transition-colors hover:bg-[#d4120a] disabled:cursor-wait disabled:opacity-60"
              >
                <FontAwesomeIcon icon={faFilePdf} aria-hidden="true" />
                {generandoPdf ? 'Generando…' : 'Descargar receta PDF'}
              </button>
            </section>
          </div>

          <section
            aria-label="Receta y elaboración"
            className={`${CARD} flex flex-col gap-2.5`}
          >
            <span className={`${labelClass} flex items-center gap-2`}>
              <FontAwesomeIcon icon={faFlask} aria-hidden="true" />
              Receta y elaboración
            </span>

            <DataTable
              titulo="Detalle de insumos del lote"
              columnas={COLUMNAS_ETAPAS}
              filas={data.etapas || []}
              clave={(e) => e.orden ?? e.etapa}
              minWidth={640}
              compacta
            />

            <p className="m-0 flex items-start gap-2 text-[15px] font-normal text-gray-600 dark:text-slate-300">
              <FontAwesomeIcon
                icon={faCircleInfo}
                className="mt-[3px] flex-none text-violet-600 dark:text-violet-400"
                aria-hidden="true"
              />
              <span>
                Diferencia = cargado - SP.
              </span>
            </p>
            <p className="m-0 flex items-start gap-2 text-[15px] font-normal text-gray-600 dark:text-slate-300">
              <FontAwesomeIcon
                icon={faCircleInfo}
                className="mt-[3px] flex-none text-violet-600 dark:text-violet-400"
                aria-hidden="true"
              />
              <span>
                "Fuera" marca los insumos con una diferencia mayor
                a {String(CONFIG.TOLERANCIA_PCT).replace('.', ',')} %. 
              </span>
            </p>
             <p className="m-0 flex items-start gap-2 text-[15px] font-normal text-gray-600 dark:text-slate-300">
              <FontAwesomeIcon
                icon={faCircleInfo}
                className="mt-[3px] flex-none text-violet-600 dark:text-violet-400"
                aria-hidden="true"
              />
              <span>Colorante en ml; el resto en kg.
              </span>
            </p>
          </section>
        </div>
      )}
    </div>
  );
}
