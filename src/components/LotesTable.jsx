import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faClock, faEye } from '@fortawesome/free-solid-svg-icons';
import { Link } from 'react-router-dom';
import { areaDe } from '../config/monitor';
import { fechaCorta, mmss } from '../lib/format';
import { Chip, ChipEstado, SwitchAprobar } from './ui';

// Fecha dentro de un badge; sin fecha (ej.: lote sin terminar) muestra un guion
const BadgeFecha = ({ ts, tipo }) =>
  ts ? <Chip tipo={tipo}>{fechaCorta(ts)}</Chip> : '—';

const TH =
  'px-1.5 py-2 text-[12px] font-bold uppercase tracking-[0.8px] text-gray-500 dark:text-slate-400';
const TD = 'px-1.5 py-2 align-middle text-[15px] font-medium';

// onAprobar (opcional, vista Admin): agrega al final la columna "Aprobar" con un switch.
// Se llama con (fila, encendido). onInfo (opcional): columna "Info" que abre los datos del lote.
// soloLectura: muestra el switch pero no deja cambiarlo (perfil usuario).
export default function LotesTable({
  filas,
  conSala = false,
  minWidth = 600,
  onAprobar,
  onInfo,
  soloLectura = false,
}) {
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
            <th scope="col" className={`${TH} text-left`}>Código de barras</th>
            <th scope="col" className={`${TH} text-left`}>Producto</th>
            <th scope="col" className={`${TH} text-left`}>Inicio</th>
            <th scope="col" className={`${TH} text-left`}>Fin</th>
            <th scope="col" className={`${TH} text-right`}>Total</th>
            <th scope="col" className={`${TH} text-right`}>Estado</th>
            {onAprobar && <th scope="col" className={`${TH} text-center`}>Aprobar</th>}
            {onInfo && <th scope="col" className={`${TH} text-center`}>Info</th>}
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
                    className="inline-flex min-h-9 items-center rounded-md px-2.5 py-0.5 text-[15px] font-bold text-teal-600 dark:text-teal-400 underline"
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
                <td className={`${TD} font-bold tabular-nums text-violet-700 dark:text-violet-300`}>
                  {r.codigo_barra}
                </td>
                <td className={TD}>{r.nombre_producto}</td>
                <td className={`${TD} whitespace-nowrap tabular-nums`}>
                  <BadgeFecha ts={r.inicio} tipo="inicio" />
                </td>
                <td className={`${TD} whitespace-nowrap tabular-nums`}>
                  <BadgeFecha ts={r.fin} tipo="fin" />
                </td>
                <td className={`${TD} whitespace-nowrap text-right tabular-nums`}>
                  <FontAwesomeIcon icon={faClock} className="mr-1.5 text-gray-400 dark:text-slate-500" />
                  {mmss(r.tiempo_total_s)}
                </td>
                <td className={`${TD} whitespace-nowrap text-right`}>
                  <ChipEstado estado={r.estado} />
                </td>
                {onAprobar && (
                  <td className={`${TD} text-center`}>
                    {/* Switch: encendido = aprobado por calidad */}
                    <SwitchAprobar lote={r} onAprobar={onAprobar} deshabilitado={soloLectura} />
                  </td>
                )}
                {onInfo && (
                  <td className={`${TD} text-center`}>
                    {/* Con comentario de rechazo el ícono va en rojo */}
                    <button
                      type="button"
                      onClick={() => onInfo(r)}
                      aria-label={`Información del lote #${r.id}${r.calidad?.comentario ? ' (tiene comentario)' : ''}`}
                      title={r.calidad?.comentario ? 'Ver información y comentario' : 'Ver información'}
                      className={`inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-md text-lg transition-colors hover:bg-gray-100 dark:hover:bg-slate-800 ${
                        r.calidad?.comentario
                          ? 'text-red-600 dark:text-red-400'
                          : 'text-violet-600 dark:text-violet-400'
                      }`}
                    >
                      <FontAwesomeIcon icon={faEye} aria-hidden="true" />
                    </button>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
