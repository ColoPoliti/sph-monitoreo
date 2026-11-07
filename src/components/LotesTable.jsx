import { Link } from 'react-router-dom';
import { areaDe } from '../config/monitor';
import { fechaCorta, mmss } from '../lib/format';
import { ChipEstado } from './ui';

const TH =
  'px-1.5 py-2 text-[12px] font-bold uppercase tracking-[0.8px] text-gray-500 dark:text-slate-400';
const TD = 'px-1.5 py-2 align-middle text-[15px] font-medium';

export default function LotesTable({ filas, conSala = false, minWidth = 600 }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full" style={{ minWidth }}>
        <caption className="sr-only">Elaboraciones registradas</caption>
        <thead>
          <tr>
            <th scope="col" className={`${TH} text-left`}>Id</th>
            {conSala && (
              <>
                <th scope="col" className={`${TH} text-left`}>Sector</th>
                <th scope="col" className={`${TH} text-left`}>PLC</th>
              </>
            )}
            <th scope="col" className={`${TH} text-left`}>Inicio</th>
            <th scope="col" className={`${TH} text-left`}>Código de barras</th>
            <th scope="col" className={`${TH} text-left`}>Producto</th>
            <th scope="col" className={`${TH} text-right`}>Total</th>
            <th scope="col" className={`${TH} text-right`}>Estado</th>
          </tr>
        </thead>
        <tbody>
          {filas.map((r) => {
            const area = areaDe(r.area);
            return (
              <tr key={r.id} className="border-t border-gray-200 dark:border-slate-800">
                <td className={TD}>
                  <Link
                    to={`/lotes/${r.id}`}
                    aria-label={`Ver la etiqueta digital del lote ${r.id}`}
                    className="inline-flex min-h-9 items-center rounded-md px-2.5 py-0.5 text-[15px] font-bold text-violet-700 dark:text-violet-300 underline"
                  >
                    #{r.id}
                  </Link>
                </td>
                {conSala && (
                  <>
                    <td className={TD}>{area ? area.label : r.area}</td>
                    <td className={`${TD} tabular-nums`}>{r.sala}</td>
                  </>
                )}
                <td className={`${TD} whitespace-nowrap tabular-nums`}>
                  {fechaCorta(r.inicio)}
                </td>
                <td className={`${TD} font-bold tabular-nums text-violet-700 dark:text-violet-300`}>
                  {r.codigo_barra}
                </td>
                <td className={TD}>{r.nombre_producto}</td>
                <td className={`${TD} whitespace-nowrap text-right tabular-nums`}>
                  {mmss(r.tiempo_total_s)}
                </td>
                <td className={`${TD} text-right`}>
                  <ChipEstado estado={r.estado} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
