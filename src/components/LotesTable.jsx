import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faClock, faEye } from '@fortawesome/free-solid-svg-icons';
import { Link } from 'react-router-dom';
import { areaDe } from '../config/monitor';
import { fechaCorta, mmss, num } from '../lib/format';
import { estadoChip } from '../lib/estados';
import DataTable from '../components/DataTable';
import { Chip, ChipEstado, SwitchAprobar } from '../components/ui';

// Fecha dentro de un badge; sin fecha (ej.: lote sin terminar) muestra un guion
const BadgeFecha = ({ ts, tipo }) =>
  ts ? <Chip tipo={tipo} chico>{fechaCorta(ts)}</Chip> : '—';

// onAprobar (opcional, vista Admin): agrega al final la columna "Aprobar" con un switch.
// Se llama con (fila, encendido). onInfo (opcional): columna "Info" que abre los datos del lote.
// soloLectura: muestra el switch pero no deja cambiarlo (perfil usuario).
// rutaLote: arma el link del Id (cada módulo puede abrir la etiqueta dentro de su propia sección).
// columnasExtra (opcional): columnas de DataTable que van antes de "Estado".
// buscador, exportar, compacta: ver DataTable.
export default function LotesTable({
  filas,
  conSala = false,
  minWidth = 600,
  onAprobar,
  onInfo,
  soloLectura = false,
  rutaLote = (id) => `/lotes/${id}`,
  columnasExtra = [],
  buscador = true,
  exportar,
  compacta = false,
}) {
  const columnas = [
    {
      id: 'id',
      titulo: 'Id',
      valor: (r) => r.id,
      celda: (r) => (
        <Link
          to={rutaLote(r.id)}
          aria-label={`Ver la etiqueta digital del lote ${r.id}`}
          className="inline-flex min-h-9 items-center rounded-md px-2.5 py-0.5 text-[15px] font-bold text-teal-600 dark:text-teal-400 underline"
        >
          #{r.id}
        </Link>
      ),
    },
    ...(conSala
      ? [
          { id: 'sector', titulo: 'Sector', valor: (r) => areaDe(r.area)?.label || r.area },
          { id: 'plc', titulo: 'PLC', valor: (r) => r.sala, clase: 'tabular-nums' },
        ]
      : []),
    {
      id: 'codigo',
      titulo: 'Código de barras',
      // En pantalla abreviado; el Excel y el "Ordenar por" siguen con el nombre completo
      encabezado: 'Cód. barras',
      valor: (r) => r.codigo_barra,
      clase: 'codigo font-bold tabular-nums text-violet-700 dark:text-violet-300',
    },
    // Producto: letra más chica y centrado (también el guion cuando no hay nombre).
    // "!" porque la celda ya trae text-[15px] (TD) y las dos clases son del mismo tipo.
    {
      id: 'producto',
      titulo: 'Producto',
      alinear: 'center',
      valor: (r) => r.nombre_producto,
      clase: '!text-[13px]',
    },
    {
      id: 'inicio',
      titulo: 'Inicio',
      valor: (r) => r.inicio,
      texto: (r) => fechaCorta(r.inicio),
      celda: (r) => <BadgeFecha ts={r.inicio} tipo="inicio" />,
      clase: 'whitespace-nowrap tabular-nums',
    },
    {
      id: 'fin',
      titulo: 'Fin',
      valor: (r) => r.fin,
      texto: (r) => fechaCorta(r.fin),
      celda: (r) => <BadgeFecha ts={r.fin} tipo="fin" />,
      clase: 'whitespace-nowrap tabular-nums',
    },
    {
      id: 'total',
      titulo: 'Total',
      alinear: 'right',
      valor: (r) => num(r.tiempo_total_s),
      texto: (r) => mmss(r.tiempo_total_s),
      celda: (r) => (
        <>
          <FontAwesomeIcon icon={faClock} className="mr-1.5 text-gray-400 dark:text-slate-400" />
          {mmss(r.tiempo_total_s)}
        </>
      ),
      clase: 'whitespace-nowrap tabular-nums',
    },
    ...columnasExtra,
    {
      id: 'estado',
      titulo: 'Estado',
      alinear: 'right',
      valor: (r) => estadoChip(r.estado).texto,
      celda: (r) => <ChipEstado estado={r.estado} />,
      clase: 'whitespace-nowrap',
    },
    ...(onAprobar
      ? [
          {
            id: 'aprobar',
            titulo: 'Aprobar',
            alinear: 'center',
            // Switch: encendido = aprobado por calidad
            celda: (r) => <SwitchAprobar lote={r} onAprobar={onAprobar} deshabilitado={soloLectura} />,
          },
        ]
      : []),
    ...(onInfo
      ? [
          {
            id: 'info',
            titulo: 'Info',
            alinear: 'center',
            // Con comentario de rechazo el ícono va en rojo
            celda: (r) => (
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
            ),
          },
        ]
      : []),
  ];

  return (
    <DataTable
      titulo="Elaboraciones registradas"
      columnas={columnas}
      filas={filas}
      clave={(r) => r.id}
      minWidth={minWidth}
      buscador={buscador}
      exportar={exportar}
      compacta={compacta}
    />
  );
}
