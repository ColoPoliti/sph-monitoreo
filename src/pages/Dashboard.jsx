import { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircleInfo, faTriangleExclamation } from '@fortawesome/free-solid-svg-icons';
import AnimatedCounter from '../components/AnimatedCounter';
import LotesTable from '../components/LotesTable';
import PesoChart from '../components/PesoChart';
import { Chip, ProgressPill, labelClass, subClass } from '../components/ui';
import { CONFIG } from '../config/monitor';
import { useMonitor } from '../context/MonitorContext';
import { getUltimas } from '../lib/api';
import { clamp, codigoMP, fmt, mmss, num } from '../lib/format';
import { enEspera, enLinea, nombreEtapa, unidadEtapa } from '../lib/rooms';

const CARD = 'rounded-[14px] bg-white/70 dark:bg-slate-900/60 shadow-md dark:shadow-none px-4 py-[18px] sm:px-[22px]';

export default function Dashboard() {
  const { selectedRoom: s, now, lotesVersion } = useMonitor();
  const [ultimas, setUltimas] = useState([]);
  const [avisoUlt, setAvisoUlt] = useState({ texto: '', error: false });

  const areaKey = s?.area.key;
  const plc = s?.plc;

  useEffect(() => {
    if (!areaKey || !plc) return;
    let cancelado = false;

    const cargar = async () => {
      try {
        const filas = await getUltimas({ area: areaKey, sala: plc, limit: 4 });
        if (cancelado) return;
        setUltimas(filas);
        setAvisoUlt({
          texto: filas.length
            ? ''
            : 'Todavía no hay elaboraciones registradas para este PLC.',
          error: false,
        });
      } catch (e) {
        if (cancelado) return;
        setUltimas([]);
        setAvisoUlt({
          texto: 'No se pudo consultar la base de datos (' + e.message + ').',
          error: true,
        });
      }
    };

    cargar();
    const id = setInterval(cargar, 60000);
    return () => {
      cancelado = true;
      clearInterval(id);
    };
  }, [areaKey, plc, lotesVersion]);

  if (!s) {
    return <p className="text-gray-500 dark:text-slate-400">Cargando salas…</p>;
  }

  const r = s.receta;
  const on = enLinea(s, now);
  const espera = enEspera(s);
  const activo = on && !espera;

  let etapaTxt = 'Sin datos';
  let estadoTxt = 'Sin conexión con el PLC';
  if (on) {
    if (espera) {
      etapaTxt = 'En espera';
      estadoTxt = 'En espera';
    } else if (s.etapa >= 6) {
      etapaTxt = 'Finalizado';
      estadoTxt = 'Finalizado';
    } else {
      etapaTxt = nombreEtapa(s, s.etapa);
      estadoTxt =
        s.etapa === 5 ? 'Etiqueta y agitado' : s.sp > 0 ? 'Dosificando' : 'Preparando';
    }
  }

  const unidad = activo && s.etapa <= 5 ? unidadEtapa(s, s.etapa) : 'kg';

  const segs = Array.from({ length: 6 }, (_, i) => {
    if (s.terminado) return 100;
    if (activo && i < s.etapa) return 100;
    if (activo && i === s.etapa) {
      return s.etapa === 5 ? 100 : s.sp > 0 ? clamp((s.peso / s.sp) * 100, 0, 100) : 0;
    }
    return 0;
  });

  const valv =
    activo && CONFIG.VALVULA_COMO_PORCENTAJE ? clamp(s.estado, 0, 100) : 0;
  const carg =
    activo && s.sp > 0
      ? clamp((s.peso / s.sp) * 100, 0, 100)
      : s.terminado
        ? 100
        : 0;

  const cur = activo ? s.etapa : -1;
  const trabajando = activo && s.etapa < 6; // preparando, dosificando o etiqueta y agitado

  return (
    <div className="flex flex-col gap-4">
      {/* Encabezado del producto */}
      {/* Mobile y tablet (< lg): producto y código de barras apilados con una línea divisoria. Desde lg: lado a lado */}
      <section className={`${CARD} flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-center lg:justify-between lg:gap-x-6`}>
        <div className="flex min-w-0 flex-col gap-1.5">
          <h1 className="m-0 sm:text-4xl font-extrabold leading-[1.15] [overflow-wrap:anywhere] text-xl">
            {r ? String(r.producto?.nombre || '').toUpperCase() : 'SIN LOTE'}
          </h1>
          <span className={subClass}>
            {r
              ? `SKU ${r.producto?.sku || '-'}  ·  Tolva ${r.tolva ?? '-'}`
              : 'SKU -  ·  Tolva -'}
          </span>
        </div>
        <div className="flex flex-col gap-1.5 border-t border-gray-200 pt-3 dark:border-slate-800 lg:items-end lg:border-0 lg:pt-0">
          <span className={labelClass}>Código de barras</span>
          <span className="text-2xl font-bold tabular-nums text-violet-700 dark:text-violet-300 sm:text-[28px]">
            {r ? r.codigo_barra : '-'}
          </span>
        </div>
      </section>

      <div className="flex flex-wrap items-stretch gap-4">
        {/* Etapa y peso */}
        <section
          aria-label="Etapa y peso"
          className={`${CARD} flex min-w-0 flex-1 basis-[520px] flex-wrap gap-x-6 gap-y-4`}
        >
          <div className="flex min-w-0 flex-1 basis-[280px] flex-col gap-2">
            <span className={labelClass}>Etapa</span>
            <span
              className={`text-lg font-bold leading-[1.1] sm:text-[40px] ${
                on ? '' : 'text-slate-400 dark:text-slate-600' // "Sin datos" (PLC sin conexión)
              }`}
            >
              {etapaTxt}
            </span>
            <span className={`${subClass} min-h-[22px]`}>
              {activo && s.etapa <= 5
                ? `Etapa ${s.etapa + 1} de ${s.area.etapas.length}  ·  ${mmss((now - s.etapaIni) / 1000)}`
                : ''}
            </span>
            <span className={`${labelClass} mt-1.5`}>Peso de la balanza</span>
            <span className="text-5xl font-bold leading-[1.05] tabular-nums sm:text-[76px]">
              <AnimatedCounter value={on ? s.peso : 0} /> {unidad}
            </span>
            <span className="text-[22px] font-medium text-gray-500 dark:text-slate-400">
              {on && s.sp > 0 ? (
                <>
                  SP <AnimatedCounter value={s.sp} /> {unidad}
                </>
              ) : (
                'SP -'
              )}
            </span>
            {/* Estado: trabajando = punto violeta + texto (claro: oscuro, oscuro: blanco) con pulse sutil;
                desconectado = punto rojo con pulse; en espera/finalizado = punto gris quieto */}
            <span
              className={`mt-2.5 flex items-center gap-2 text-sm font-bold text-gray-900 dark:text-white ${
                trabajando ? 'animate-pulse motion-reduce:animate-none' : ''
              }`}
            >
              <span
                className={`h-2.5 w-2.5 flex-none rounded-full ${
                  !on
                    ? 'animate-pulse bg-red-500 motion-reduce:animate-none'
                    : trabajando
                      ? 'bg-violet-600 dark:bg-violet-400'
                      : 'bg-gray-400 dark:bg-slate-500'
                }`}
                aria-hidden="true"
              />
              {estadoTxt}
            </span>

            <div className="mt-0.5 flex gap-1" aria-hidden="true">
              {segs.map((p, i) => (
                <span
                  key={i}
                  className="h-[5px] flex-1 overflow-hidden rounded-[3px] bg-gray-200 dark:bg-slate-800"
                >
                  <span
                    className={`block h-full rounded-[3px] ${
                      p >= 100 ? 'bg-teal-600 dark:bg-teal-400' : 'bg-violet-600 dark:bg-violet-500'
                    }`}
                    style={{ width: `${p}%` }}
                  />
                </span>
              ))}
            </div>
          </div>

          <div className="flex flex-none gap-4">
            <div className="flex flex-col items-center gap-2">
              <span className={labelClass}>Válvula</span>
              <div className="relative h-48 w-14 overflow-hidden rounded-lg bg-gray-200 dark:bg-slate-800 sm:h-[256px]">
                <div
                  className="absolute inset-x-0 bottom-0 rounded-md bg-violet-600 dark:bg-violet-500"
                  style={{ height: `${valv}%` }}
                />
              </div>
              <span className="text-xl font-bold"><AnimatedCounter value={valv} decimals={0} /> %</span>
            </div>

            <div className="flex flex-col items-center gap-2">
              <span className={labelClass}>Peso cargado</span>
              <div className="relative h-48 w-14 overflow-hidden rounded-lg bg-gray-200 dark:bg-slate-800 sm:h-[256px]">
                <div
                  className="absolute inset-x-0 bottom-0 rounded-md bg-teal-600 dark:bg-teal-400"
                  style={{ height: `${carg}%` }}
                />
              </div>
              <span className="text-xl font-bold"><AnimatedCounter value={carg} decimals={0} /> %</span>
            </div>
          </div>
        </section>

        {/* Receta */}
        <section
          aria-label="Receta"
          className={`${CARD} flex min-w-0 flex-[1.15] basis-[560px] flex-col gap-2.5`}
        >
          <span className={labelClass}>Receta</span>

          {/* La tabla solo se muestra cuando hay receta */}
          {r && (
            <div className="overflow-x-auto">
              <table className="w-full" style={{ minWidth: 560 }}>
                <caption className="sr-only">Receta de la elaboración en curso</caption>
                <thead>
                  <tr>
                    <th scope="col" className="px-1.5 py-2 text-[12px] font-bold uppercase tracking-[0.8px] text-gray-500 dark:text-slate-400">Estado</th>
                    <th scope="col" className="px-1.5 py-2 text-left text-[12px] font-bold uppercase tracking-[0.8px] text-gray-500 dark:text-slate-400">Insumo</th>
                    <th scope="col" className="px-1.5 py-2 text-[12px] font-bold uppercase tracking-[0.8px] text-gray-500 dark:text-slate-400">SP</th>
                    <th scope="col" className="px-1.5 py-2 text-[12px] font-bold uppercase tracking-[0.8px] text-gray-500 dark:text-slate-400">Cargado</th>
                    <th scope="col" className="px-1.5 py-2 text-[12px] font-bold uppercase tracking-[0.8px] text-gray-500 dark:text-slate-400">Falta</th>
                    <th scope="col" className="px-1.5 py-2 text-[12px] font-bold uppercase tracking-[0.8px] text-gray-500 dark:text-slate-400">Avance</th>
                  </tr>
                </thead>
                <tbody>
                  {r
                    ? r.insumos.map((ins) => {
                        const u = unidadEtapa(s, ins.etapa);
                        const spRaw = num(ins.sp);
                        const sp =
                          spRaw === null ? null : u === 'ml' ? spRaw * 1000 : spRaw;
                        const listo = s.terminado || (cur >= 0 && ins.etapa < cur);
                        const curso = !s.terminado && cur >= 0 && ins.etapa === cur;
                        const cargado = listo
                          ? s.maxEtapa[ins.etapa] === undefined
                            ? null
                            : s.maxEtapa[ins.etapa]
                          : curso
                            ? s.peso
                            : 0;
                        const falta =
                          cargado === null || sp === null ? null : Math.max(0, sp - cargado);
                        const avance =
                          cargado === null
                            ? listo
                              ? 100
                              : 0
                            : sp > 0
                              ? clamp((cargado / sp) * 100, 0, 100)
                              : 0;

                        return (
                          <tr key={ins.etapa}>
                            {/* Pendiente: warning · Listo (finalizado): verde · En curso: índigo con borde */}
                            <td className="whitespace-nowrap px-1.5 py-2">
                              <Chip tipo={listo ? 'ok' : curso ? 'curso' : 'inc'}>
                                {listo ? 'Listo' : curso ? 'En curso' : 'Pendiente'}
                              </Chip>
                            </td>
                            <td className="px-1.5 py-2 text-[15px] font-medium">
                              {String(ins.nombre || '').toUpperCase()}
                              <br />
                              <span className="text-[13px] text-gray-500 dark:text-slate-400">
                                {codigoMP(ins.codigo_mp)}
                              </span>
                            </td>
                            <td className="whitespace-nowrap px-1.5 py-2 text-right text-[15px] font-medium tabular-nums">
                              {sp === null ? '—' : `${fmt(sp)} ${u}`}
                            </td>
                            <td className="whitespace-nowrap px-1.5 py-2 text-right text-[15px] font-bold tabular-nums">
                              {cargado === null ? (
                                '—'
                              ) : (
                                <>
                                  <AnimatedCounter value={cargado} /> {u}
                                </>
                              )}
                            </td>
                            <td className="whitespace-nowrap px-1.5 py-2 text-right text-[15px] font-medium tabular-nums">
                              {falta === null ? (
                                '—'
                              ) : (
                                <>
                                  <AnimatedCounter value={falta} /> {u}
                                </>
                              )}
                            </td>
                            <td className="px-1.5 py-2">
                              <ProgressPill valor={avance} listo={listo} />
                            </td>
                          </tr>
                        );
                      })
                    : null}
                </tbody>
              </table>
            </div>
          )}

          {/* Sin receta: aviso con ícono, centrado en alto y ancho de la card */}
          {!r && (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 py-8 text-center text-[15px] font-medium text-gray-500 dark:text-slate-400">
              <FontAwesomeIcon icon={faTriangleExclamation} className="text-3xl" aria-hidden="true" />
              <span>Sin receta: todavía no se consultó ningún código de barras.</span>
            </div>
          )}
        </section>
      </div>

      {/* Gráfico */}
      <section
        aria-label="Peso en el tiempo"
        className={`${CARD} flex flex-col gap-2`}
      >
        <span className={labelClass}>Peso en el tiempo</span>
        <PesoChart room={s} now={now} />
      </section>

      {/* Últimas elaboraciones */}
      <section
        aria-label="Últimas elaboraciones"
        className={`${CARD} flex flex-col gap-2.5`}
      >
        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1.5">
          <span className={labelClass}>Últimas elaboraciones</span>
          <p className="m-0 flex items-start gap-2 text-[15px] font-light text-gray-500 dark:text-slate-400">
            <FontAwesomeIcon
              icon={faCircleInfo}
              className="mt-[3px] flex-none text-violet-600 dark:text-violet-400"
              aria-hidden="true"
            />
            <span>
              {s.area.label} {s.plc} · click en un lote para ver su etiqueta digital
            </span>
          </p>
        </div>
        {/* La tabla solo se muestra cuando hay elaboraciones */}
        {ultimas.length > 0 && <LotesTable filas={ultimas} minWidth={600} />}

        {/* Sin datos (o error al consultar): aviso con ícono, centrado en la card */}
        {ultimas.length === 0 && avisoUlt.texto && (
          <div
            className={`flex flex-1 flex-col items-center justify-center gap-3 py-8 text-center text-[15px] font-medium ${
              avisoUlt.error ? 'text-red-600 dark:text-red-400' : 'text-gray-500 dark:text-slate-400'
            }`}
          >
            <FontAwesomeIcon icon={faTriangleExclamation} className="text-3xl" aria-hidden="true" />
            <span>{avisoUlt.texto}</span>
          </div>
        )}
      </section>
    </div>
  );
}
