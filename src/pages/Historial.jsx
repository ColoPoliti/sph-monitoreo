import { useEffect, useMemo, useState } from 'react';
import LotesTable from '../components/LotesTable';
import { Chip, labelClass, subClass } from '../components/ui';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faChevronDown,
  faCircleInfo,
  faFilter,
  faListUl,
  faMagnifyingGlass,
} from '@fortawesome/free-solid-svg-icons';
import { CONFIG } from '../config/monitor';
import { getHistorial } from '../lib/api';
import { mostrarInfoLote } from '../lib/alertasCalidad';
import { hoyISO } from '../lib/format';
import { useAprobacionCalidad } from '../lib/useAprobacionCalidad';

const CARD = 'rounded-[14px] bg-white/70 dark:bg-slate-900/60 shadow-md dark:shadow-none px-4 py-[18px] sm:px-[22px]';
// Card de filtros: igual que CARD pero con esquinas rectas
const CARD_RECTA = CARD.replace('rounded-[14px]', 'rounded-none');

const inicial = () => ({
  sector: 'todos',
  plc: 'todos',
  desde: hoyISO(-6),
  hasta: hoyISO(0),
  horaD: '00:00',
  horaH: '23:59',
});

const INPUT =
  'min-h-11 w-full rounded-lg border border-gray-300 dark:border-slate-700 bg-gray-200 dark:bg-slate-950 px-3 py-1.5 text-[15px] font-medium text-gray-900 dark:text-white';
const CAMPO = 'flex min-w-[140px] flex-1 basis-[150px] flex-col gap-1.5';

export default function Historial() {
  const [form, setForm] = useState(inicial);
  // Acordeón de filtros: arranca abierto
  const [filtrosAbiertos, setFiltrosAbiertos] = useState(true);
  const [aplicado, setAplicado] = useState(inicial);
  const [filas, setFilas] = useState([]);
  const [aviso, setAviso] = useState({ texto: '', error: false });
  // Con sesión de administrador: switch para aprobar/rechazar e ícono de info en la tabla
  const { esAdmin, onAprobar } = useAprobacionCalidad(setFilas);

  const plcs = useMemo(() => {
    const lista = [];
    CONFIG.AREAS.forEach((a) =>
      a.plcs.forEach((p) => {
        if (!lista.includes(p)) lista.push(p);
      }),
    );
    return lista.sort();
  }, []);

  useEffect(() => {
    let cancelado = false;

    getHistorial(aplicado)
      .then((data) => {
        if (cancelado) return;
        setFilas(data);
        setAviso({
          texto: data.length
            ? ''
            : 'Ninguna elaboración cumple con los filtros elegidos.',
          error: false,
        });
      })
      .catch((e) => {
        if (cancelado) return;
        setFilas([]);
        setAviso({
          texto: 'No se pudo consultar la base de datos (' + e.message + ').',
          error: true,
        });
      });

    return () => {
      cancelado = true;
    };
  }, [aplicado]);

  const cambiar = (campo) => (e) =>
    setForm((f) => ({ ...f, [campo]: e.target.value }));

  const buscar = (nuevo) => {
    setFilas([]);
    setAviso({ texto: '', error: false });
    setAplicado(nuevo);
  };

  const filtrar = (e) => {
    e.preventDefault();
    buscar({ ...form });
  };

  const limpiar = () => {
    const limpio = { ...inicial(), desde: '', hasta: '' };
    setForm(limpio);
    buscar(limpio);
  };

  // Cada lote cuenta en un solo grupo según su estado actual, así los cuatro suman el total:
  // completas e incompletas son las que calidad todavía no revisó
  const cuantos = (estado) => filas.filter((r) => r.estado === estado).length;
  const aprobadas = cuantos('aprobado');
  const rechazadas = cuantos('rechazado');
  const completas = cuantos('completa');
  const incompletas = filas.length - completas - aprobadas - rechazadas;
  const buscando = !aviso.error && filas.length === 0 && !aviso.texto;

  // Resumen del pie de la tabla: cantidad por estado, con un círculo del color de su chip
  const conteos = [
    { texto: 'completas', n: completas, punto: 'bg-emerald-500 dark:bg-emerald-400' },
    { texto: 'incompletas', n: incompletas, punto: 'bg-amber-500 dark:bg-amber-400' },
    // Siempre visibles (con o sin sesión), aunque sean 0
    { texto: 'aprobadas por calidad', n: aprobadas, punto: 'bg-sky-500 dark:bg-sky-400' },
    { texto: 'rechazadas por calidad', n: rechazadas, punto: 'bg-red-500 dark:bg-red-400' },
  ];

  return (
    <div className="flex flex-col gap-4">
      <form
        onSubmit={filtrar}
        aria-label="Filtros"
        className={`${CARD_RECTA} flex flex-wrap items-end gap-x-[18px] gap-y-3.5`}
      >
        {/* Acordeón: el título abre o cierra los filtros; la flechita gira */}
        <button
          type="button"
          onClick={() => setFiltrosAbiertos((v) => !v)}
          aria-expanded={filtrosAbiertos}
          aria-controls="filtros-campos"
          className={`${labelClass} flex basis-full cursor-pointer items-center gap-2 text-left`}
        >
          <FontAwesomeIcon icon={faFilter} aria-hidden="true" />
          <span className="flex-1">Filtros</span>
          <FontAwesomeIcon
            icon={faChevronDown}
            className={`text-[14px] transition-transform duration-200 ${filtrosAbiertos ? 'rotate-180' : ''}`}
            aria-hidden="true"
          />
        </button>

        {filtrosAbiertos && (
          <div id="filtros-campos" className="contents">
            <label className={CAMPO}>
              <span className={labelClass}>Sector</span>
              <select id="fSector" className={INPUT} value={form.sector} onChange={cambiar('sector')}>
                <option value="todos">Todos</option>
                {CONFIG.AREAS.map((a) => (
                  <option key={a.key} value={a.key}>
                    {a.label}
                  </option>
                ))}
              </select>
            </label>

            <label className={CAMPO}>
              <span className={labelClass}>PLC</span>
              <select id="fPlc" className={INPUT} value={form.plc} onChange={cambiar('plc')}>
                <option value="todos">Todos</option>
                {plcs.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </label>

            <label className={CAMPO}>
              <span className={labelClass}>Día desde</span>
              <input
                id="fDesde"
                type="date"
                className={INPUT}
                value={form.desde}
                onChange={cambiar('desde')}
              />
            </label>

            <label className={CAMPO}>
              <span className={labelClass}>Día hasta</span>
              <input
                id="fHasta"
                type="date"
                className={INPUT}
                value={form.hasta}
                onChange={cambiar('hasta')}
              />
            </label>

            <label className={CAMPO}>
              <span className={labelClass}>Hora desde</span>
              <input
                id="fHoraD"
                type="time"
                className={INPUT}
                value={form.horaD}
                onChange={cambiar('horaD')}
              />
            </label>

            <label className={CAMPO}>
              <span className={labelClass}>Hora hasta</span>
              <input
                id="fHoraH"
                type="time"
                className={INPUT}
                value={form.horaH}
                onChange={cambiar('horaH')}
              />
            </label>

            <div className="flex flex-none items-end gap-2.5">
              <button
                type="submit"
                className="min-h-11 cursor-pointer rounded-lg border-0 bg-violet-700 dark:bg-violet-300 px-[26px] py-1.5 text-[15px] font-bold text-white dark:text-gray-900 transition-opacity hover:opacity-90"
              >
                Filtrar
              </button>
              <button
                type="button"
                onClick={limpiar}
                className="min-h-11 cursor-pointer rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-[18px] py-1.5 text-[15px] font-bold text-gray-900 dark:text-white transition-colors hover:bg-gray-100 dark:hover:bg-slate-700"
              >
                Limpiar
              </button>
            </div>

            {/* Nota de info al pie de la card (mismo estilo que las de la etiqueta digital) */}
            <p className="m-0 flex basis-full items-start gap-2 text-[15px] font-light text-gray-500 dark:text-slate-400">
              <FontAwesomeIcon
                icon={faCircleInfo}
                className="mt-[3px] flex-none text-violet-600 dark:text-violet-400"
                aria-hidden="true"
              />
              <span>
                Si la hora "desde" es mayor que la "hasta", la franja cruza la medianoche
                (por ejemplo 22:00 a 06:00).
              </span>
            </p>
          </div>
        )}
      </form>

      <section
        aria-label="Resultados"
        className={`${CARD} flex flex-col gap-2.5`}
      >
        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1.5">
          <span className={`${labelClass} flex items-center gap-2`}>
            <FontAwesomeIcon icon={faMagnifyingGlass} aria-hidden="true" />
            Elaboraciones encontradas
          </span>
          {buscando && <span className={subClass}>Buscando…</span>}
        </div>

        <LotesTable
          filas={filas}
          conSala
          minWidth={esAdmin ? 880 : 720}
          onAprobar={esAdmin ? onAprobar : undefined}
          onInfo={esAdmin ? mostrarInfoLote : undefined}
        />

        <span
          className={`text-sm font-medium ${
            aviso.error ? 'text-red-600 dark:text-red-400' : 'text-gray-500 dark:text-slate-400'
          }`}
        >
          {aviso.texto}
        </span>

        {/* Pie: total y cantidad por estado, cada uno con el color de su chip */}
        {filas.length > 0 && (
          <footer className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-gray-200 pt-3 text-[14px] font-medium text-gray-600 dark:border-slate-800 dark:text-slate-300">
            {/* Total en un chip neutro, como los demás badges */}
            <Chip tipo="neutro" icono={faListUl} mayus>
              {filas.length} {filas.length === 1 ? 'elaboración' : 'elaboraciones'}
            </Chip>
            {conteos.map((c) => (
              <span key={c.texto} className="inline-flex items-center gap-1.5">
                <span className={`h-2.5 w-2.5 flex-none rounded-full ${c.punto}`} aria-hidden="true" />
                <span className="font-bold tabular-nums text-gray-900 dark:text-white">{c.n}</span>
                {c.texto}
              </span>
            ))}
            {filas.length >= 500 && (
              <span className="text-gray-500 dark:text-slate-400">(se muestran las 500 más recientes)</span>
            )}
          </footer>
        )}
      </section>
    </div>
  );
}
