import { useEffect, useMemo, useState } from 'react';
import LotesTable from '../components/LotesTable';
import { labelClass, subClass } from '../components/ui';
import { CONFIG } from '../config/monitor';
import { getHistorial } from '../lib/api';
import { hoyISO } from '../lib/format';

const CARD = 'rounded-[14px] bg-white/70 dark:bg-slate-900/60 shadow-md dark:shadow-none px-4 py-[18px] sm:px-[22px]';

const inicial = () => ({
  sector: 'todos',
  plc: 'todos',
  desde: hoyISO(-6),
  hasta: hoyISO(0),
  horaD: '00:00',
  horaH: '23:59',
});

const INPUT =
  'min-h-11 w-full rounded-lg border border-gray-300 dark:border-slate-700 bg-gray-200 dark:bg-slate-800 px-3 py-1.5 text-[15px] font-medium text-gray-900 dark:text-white';
const CAMPO = 'flex min-w-[140px] flex-1 basis-[150px] flex-col gap-1.5';

export default function Historial() {
  const [form, setForm] = useState(inicial);
  const [aplicado, setAplicado] = useState(inicial);
  const [filas, setFilas] = useState([]);
  const [aviso, setAviso] = useState({ texto: '', error: false });

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

  const incompletas = filas.filter((r) => r.estado !== 'completa').length;
  const resumen = aviso.error
    ? ''
    : filas.length === 0 && !aviso.texto
      ? 'Buscando…'
      : `${filas.length} ${
          filas.length === 1 ? 'elaboración' : 'elaboraciones'
        } · ${filas.length - incompletas} completas · ${incompletas} incompletas${
          filas.length >= 500 ? ' (se muestran las 500 más recientes)' : ''
        }`;

  return (
    <div className="flex flex-col gap-4">
      <form
        onSubmit={filtrar}
        aria-label="Filtros"
        className={`${CARD} flex flex-wrap items-end gap-x-[18px] gap-y-3.5`}
      >
        <span className={`${labelClass} basis-full`}>Filtros</span>

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

        <span className={`${subClass} basis-full`}>
          Si la hora "desde" es mayor que la "hasta", la franja cruza la medianoche
          (por ejemplo 22:00 a 06:00).
        </span>
      </form>

      <section
        aria-label="Resultados"
        className={`${CARD} flex flex-col gap-2.5`}
      >
        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1.5">
          <span className={labelClass}>Elaboraciones encontradas</span>
          <span className={subClass}>{resumen}</span>
        </div>

        <LotesTable filas={filas} conSala minWidth={720} />

        <span
          className={`text-sm font-medium ${
            aviso.error ? 'text-red-600 dark:text-red-400' : 'text-gray-500 dark:text-slate-400'
          }`}
        >
          {aviso.texto}
        </span>
      </section>
    </div>
  );
}
