import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircleInfo } from '@fortawesome/free-solid-svg-icons';
import { Chip, ChipEstado, labelClass, subClass } from '../components/ui';
import { CONFIG, areaDe } from '../config/monitor';
import { getLote } from '../lib/api';
import { fechaCorta, fmt, mmss, num, signo } from '../lib/format';

const CARD = 'rounded-[14px] bg-white/70 dark:bg-slate-900/60 shadow-md dark:shadow-none px-4 py-[18px] sm:px-[22px]';
const TH =
  'px-1.5 py-2 text-[12px] font-bold uppercase tracking-[0.8px] text-gray-500 dark:text-slate-400';
const TD = 'px-1.5 py-2 align-middle text-[15px] font-medium';

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

  const cargando = estado.id !== id || estado.cargando;
  const data = estado.id === id ? estado.data : null;
  const error = estado.id === id ? estado.error : '';

  const volver = () => {
    if (window.history.length > 1) navigate(-1);
    else navigate('/');
  };

  const lote = data?.lote;
  const area = lote ? areaDe(lote.area) : null;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
        <button
          type="button"
          onClick={volver}
          className="min-h-11 cursor-pointer rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-[18px] py-1.5 text-[15px] font-bold text-gray-900 dark:text-white transition-colors hover:bg-gray-100 dark:hover:bg-slate-700"
        >
          ← Volver
        </button>
        <span className={labelClass}>Etiqueta digital</span>
      </div>

      {cargando && <p className={subClass}>Cargando…</p>}

      {!cargando && error && (
        <p className="text-sm font-medium text-red-600 dark:text-red-400">{error}</p>
      )}

      {!cargando && data && lote && (
        <div className="flex flex-col gap-4">
          {/* Mobile y tablet (< lg): producto y código de barras apilados con una línea divisoria. Desde lg: lado a lado */}
          <section className={`${CARD} flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-center lg:justify-between lg:gap-x-6`}>
            <div className="flex min-w-0 flex-col gap-1.5">
              <h1 className="m-0 text-2xl font-extrabold leading-[1.15] [overflow-wrap:anywhere] sm:text-[28px]">
                {lote.nombre_producto}
              </h1>
              <span className={subClass}>
                {area ? area.label : lote.area} {lote.sala} · Lote #{lote.id} ·
                Tolva {lote.tolva === null ? '-' : lote.tolva}
              </span>
            </div>
            <div className="flex flex-col items-start gap-1.5 border-t border-gray-200 pt-3 dark:border-slate-800 lg:items-end lg:border-0 lg:pt-0">
              <span className={labelClass}>Código de barras</span>
              <span className="text-2xl font-bold tabular-nums text-violet-700 dark:text-violet-300 sm:text-[28px]">
                {lote.codigo_barra}
              </span>
              <ChipEstado estado={lote.estado} />
            </div>
          </section>

          {/* Mobile y tablet (< lg): datos apilados con una línea entre cada uno. Desde lg: en fila */}
          <section className={`${CARD} flex flex-col divide-y divide-gray-200 dark:divide-slate-800 lg:flex-row lg:flex-wrap lg:gap-x-12 lg:gap-y-4 lg:divide-y-0`}>
            <div className="flex flex-col gap-1 py-3 first:pt-0 last:pb-0 lg:py-0">
              <span className={labelClass}>Inicio</span>
              <span className="text-[22px] font-bold tabular-nums">
                {fechaCorta(lote.inicio)}
              </span>
            </div>
            <div className="flex flex-col gap-1 py-3 first:pt-0 last:pb-0 lg:py-0">
              <span className={labelClass}>Fin</span>
              <span className="text-[22px] font-bold tabular-nums">
                {fechaCorta(lote.fin)}
              </span>
            </div>
            <div className="flex flex-col gap-1 py-3 first:pt-0 last:pb-0 lg:py-0">
              <span className={labelClass}>Tiempo total</span>
              <span className="text-[22px] font-bold tabular-nums">
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

          <section
            aria-label="Receta y elaboración"
            className={`${CARD} flex flex-col gap-2.5`}
          >
            <span className={labelClass}>Receta y elaboración</span>

            <div className="overflow-x-auto">
              <table className="w-full" style={{ minWidth: 640 }}>
                <caption className="sr-only">Detalle de insumos del lote</caption>
                <thead>
                  <tr>
                    <th scope="col" className={`${TH} text-left`}>Insumo</th>
                    <th scope="col" className={TH}>SP</th>
                    <th scope="col" className={TH}>Cargado</th>
                    <th scope="col" className={TH}>Diferencia</th>
                    <th scope="col" className={TH}>Dif. %</th>
                    <th scope="col" className={TH}>Duración</th>
                    <th scope="col" className={TH}>Tolerancia</th>
                  </tr>
                </thead>
                <tbody>
                  {(data.etapas || []).map((e) => {
                    const sp = num(e.sp);
                    const cargado = num(e.cargado);
                    const dif = num(e.diferencia);
                    const pct = num(e.diferencia_pct);
                    const u = e.unidad || 'kg';
                    const fuera = pct !== null && Math.abs(pct) > CONFIG.TOLERANCIA_PCT;

                    return (
                      <tr key={e.orden ?? e.etapa} className="border-t border-gray-200 dark:border-slate-800">
                        <td className={TD}>
                          {e.insumo || e.etapa_clave}
                          {e.codigo_mp && (
                            <>
                              <br />
                              <span className="text-[13px] text-gray-500 dark:text-slate-400">
                                MP {e.codigo_mp}
                              </span>
                            </>
                          )}
                        </td>
                        <td className={`${TD} whitespace-nowrap text-right tabular-nums`}>
                          {sp === null ? '—' : `${fmt(sp)} ${u}`}
                        </td>
                        <td className={`${TD} whitespace-nowrap text-right font-bold tabular-nums`}>
                          {cargado === null ? '—' : `${fmt(cargado)} ${u}`}
                        </td>
                        <td className={`${TD} whitespace-nowrap text-right tabular-nums`}>
                          {dif === null ? '—' : `${signo(dif)} ${u}`}
                        </td>
                        <td className={`${TD} whitespace-nowrap text-right tabular-nums`}>
                          {pct === null ? '—' : `${signo(pct)} %`}
                        </td>
                        <td className={`${TD} whitespace-nowrap text-right tabular-nums`}>
                          {mmss(e.duracion_s)}
                        </td>
                        <td className={`${TD} text-center`}>
                          {sp === null || pct === null ? (
                            '—'
                          ) : (
                            <Chip tipo={fuera ? 'mal' : 'ok'}>
                              {fuera ? 'Fuera' : 'OK'}
                            </Chip>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <p className="m-0 flex items-start gap-2 text-[15px] font-light text-gray-500 dark:text-slate-400">
              <FontAwesomeIcon
                icon={faCircleInfo}
                className="mt-[3px] flex-none text-violet-600 dark:text-violet-400"
                aria-hidden="true"
              />
              <span>
                Dif. = cargado − SP. "Fuera" marca los insumos con una diferencia mayor
                a {String(CONFIG.TOLERANCIA_PCT).replace('.', ',')} %. Colorante en ml; el
                resto en kg.
              </span>
            </p>
          </section>
        </div>
      )}
    </div>
  );
}
