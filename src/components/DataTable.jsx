// Tabla de datos común a todos los módulos: orden por columna, búsqueda, paginado y exportación a Excel (.xlsx).
//
//   <DataTable
//     titulo="Proveedores"
//     filas={proveedores}
//     clave={(p) => p.id}
//     minWidth={820}
//     exportar="proveedores.xlsx"
//     columnas={[
//       { id: 'nombre', titulo: 'Razón social', valor: (p) => p.razonSocial, clase: 'font-bold' },
//       { id: 'total', titulo: 'Total', alinear: 'right', valor: (p) => p.total, celda: (p) => pesos(p.total) },
//       { id: 'editar', titulo: 'Editar', oculto: true, celda: (p) => <BotonEditar proveedor={p} /> },
//     ]}
//   />
//
// Cada columna:
//   id        identificador único
//   titulo    texto del encabezado (y de la columna en el Excel)
//   valor     (fila) => dato crudo: define el orden, la búsqueda y el Excel. Sin valor, la columna no se ordena ni se exporta.
//   celda     (fila, { orden }) => lo que se muestra; por defecto, el valor. `orden` es el orden activo ({ id, dir } o null).
//   texto     (fila) => texto adicional para la búsqueda (ej.: la fecha como se ve en pantalla)
//   alinear   'left' (por defecto) | 'right' | 'center'
//   clase     clases extra de la celda
//   encabezado  nodo para el encabezado, si no alcanza con el título
//   oculto    el título queda solo para lectores de pantalla (columnas de acciones)
//   span      (fila) => colSpan de la celda; 0 la omite
//
// Sin orden elegido se respeta el orden en que llegan las filas (ej.: la prioridad de una cola).
// compacta: solo orden por columna, para tablas cortas (sin buscador, paginado ni exportación).
import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faChevronDown,
  faChevronLeft,
  faChevronRight,
  faChevronUp,
  faFileExcel,
  faMagnifyingGlass,
} from '@fortawesome/free-solid-svg-icons';
import { descargarExcel } from '../lib/excel';
import { BOTON, INPUT, TD, TH } from './clases';

const TAMANOS = [10, 25, 50, 100];
const TODAS = 0;

const ALINEAR = { left: 'text-left', right: 'text-right', center: 'text-center' };
const JUSTIFICAR = { left: 'justify-start', right: 'justify-end', center: 'justify-center' };

const BOTON_PAGINA =
  'inline-flex h-9 w-9 flex-none cursor-pointer items-center justify-center rounded-full border border-gray-300 bg-white text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700';

// Doble chevron de los botones de primera y última página
const ChevronDoble = ({ icono }) => (
  <span className="inline-flex" aria-hidden="true">
    <FontAwesomeIcon icon={icono} />
    <FontAwesomeIcon icon={icono} className="-ml-1" />
  </span>
);

// Orden alfabético en español, sin distinguir mayúsculas ni acentos, y natural para números ('2' < '10')
const colador = new Intl.Collator('es', { numeric: true, sensitivity: 'base' });

const esVacio = (v) => v === null || v === undefined || v === '' || Number.isNaN(v);

const comparar = (a, b) =>
  typeof a === 'number' && typeof b === 'number' ? a - b : colador.compare(String(a), String(b));

// Las celdas vacías quedan siempre al final, en cualquiera de los dos sentidos
function ordenarFilas(filas, columna, dir) {
  const signo = dir === 'asc' ? 1 : -1;
  return [...filas].sort((filaA, filaB) => {
    const a = columna.valor(filaA);
    const b = columna.valor(filaB);
    if (esVacio(a) || esVacio(b)) return Number(esVacio(a)) - Number(esVacio(b));
    return signo * comparar(a, b);
  });
}

// Para buscar sin distinguir mayúsculas ni acentos
const normalizar = (v) =>
  String(v ?? '')
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase();

function coincide(fila, columnas, busqueda) {
  return columnas.some(
    (c) =>
      (c.valor && normalizar(c.valor(fila)).includes(busqueda)) ||
      (c.texto && normalizar(c.texto(fila)).includes(busqueda)),
  );
}

const ARIA_ORDEN = { asc: 'ascending', desc: 'descending' };

// Chevron del encabezado: arriba o abajo según el sentido; sin orden, los dos atenuados.
// El ancho fijo evita que la columna se mueva al cambiar de estado.
const ChevronOrden = ({ dir }) => (
  <span className="inline-flex w-3 flex-none flex-col items-center justify-center" aria-hidden="true">
    {dir ? (
      <FontAwesomeIcon icon={dir === 'asc' ? faChevronUp : faChevronDown} className="text-[12px]" />
    ) : (
      <>
        <FontAwesomeIcon icon={faChevronUp} className="text-[8px] opacity-40" />
        <FontAwesomeIcon icon={faChevronDown} className="-mt-0.5 text-[8px] opacity-40" />
      </>
    )}
  </span>
);

export default function DataTable({
  titulo,
  columnas,
  filas,
  clave,
  minWidth = 600,
  claseFila,
  buscador = true,
  exportar,
  porPagina = 10,
  compacta = false,
}) {
  const [orden, setOrden] = useState(null); // { id, dir }
  const [busqueda, setBusqueda] = useState('');
  const [tamano, setTamano] = useState(porPagina);
  const [paginaElegida, setPaginaElegida] = useState(1);

  const conBuscador = buscador && !compacta;
  const termino = conBuscador ? normalizar(busqueda.trim()) : '';
  const filtradas = termino ? filas.filter((f) => coincide(f, columnas, termino)) : filas;

  const columnaOrden = orden && columnas.find((c) => c.id === orden.id && c.valor);
  const ordenActivo = columnaOrden ? orden : null;
  const ordenadas = columnaOrden ? ordenarFilas(filtradas, columnaOrden, orden.dir) : filtradas;

  const paginar = !compacta && tamano !== TODAS;
  const totalPaginas = paginar ? Math.max(1, Math.ceil(ordenadas.length / tamano)) : 1;
  // Si las filas se achican (filtros, recarga), se queda en la última página que exista
  const pagina = Math.min(paginaElegida, totalPaginas);
  const desde = paginar ? (pagina - 1) * tamano : 0;
  const visibles = paginar ? ordenadas.slice(desde, desde + tamano) : ordenadas;

  // Clic en el encabezado: ascendente → descendente → orden original
  const alternarOrden = (id) => {
    setPaginaElegida(1);
    setOrden((o) => {
      if (o?.id !== id) return { id, dir: 'asc' };
      return o.dir === 'asc' ? { id, dir: 'desc' } : null;
    });
  };

  const descargar = () =>
    descargarExcel(
      exportar,
      ordenadas,
      columnas.filter((c) => c.valor).map((c) => ({ titulo: c.titulo, valor: c.valor })),
    );

  const conBarra = !compacta && filas.length > 0 && (conBuscador || exportar);
  const conPie = !compacta && filas.length > 0;
  const hayPaginas = filtradas.length > TAMANOS[0] || filas.length > TAMANOS[0];

  return (
    <div className="flex flex-col gap-3">
      {conBarra && (
        <div className="flex flex-wrap items-center gap-2">
          {conBuscador && (
            <label className="relative w-full sm:w-72">
              <span className="sr-only">Buscar en {titulo}</span>
              <FontAwesomeIcon
                icon={faMagnifyingGlass}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                aria-hidden="true"
              />
              <input
                type="search"
                placeholder="Buscar…"
                className={`${INPUT} pl-9`}
                value={busqueda}
                onChange={(e) => {
                  setBusqueda(e.target.value);
                  setPaginaElegida(1);
                }}
              />
            </label>
          )}
          {exportar && (
            <button type="button" className={`${BOTON.secundario} ml-auto`} onClick={descargar} disabled={!ordenadas.length}>
              <FontAwesomeIcon icon={faFileExcel} aria-hidden="true" />
              Exportar
            </button>
          )}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full" style={{ minWidth }}>
          <caption className="sr-only">{titulo}</caption>
          <thead>
            <tr>
              {columnas.map((c) => {
                const alinear = c.alinear || 'left';
                const activo = ordenActivo?.id === c.id ? ordenActivo.dir : null;
                const contenido = c.encabezado ?? c.titulo;
                return (
                  <th
                    key={c.id}
                    scope="col"
                    className={`${TH} ${ALINEAR[alinear]}`}
                    aria-sort={c.valor ? ARIA_ORDEN[activo] || 'none' : undefined}
                  >
                    {c.oculto ? (
                      <span className="sr-only">{c.titulo}</span>
                    ) : c.valor ? (
                      <button
                        type="button"
                        onClick={() => alternarOrden(c.id)}
                        title={`Ordenar por ${c.titulo}`}
                        className={`inline-flex min-h-6 cursor-pointer items-center gap-1.5 uppercase transition-colors hover:text-gray-900 dark:hover:text-white ${JUSTIFICAR[alinear]} ${
                          activo ? 'text-teal-600 dark:text-teal-400' : ''
                        }`}
                      >
                        <span>{contenido}</span>
                        <ChevronOrden dir={activo} />
                      </button>
                    ) : (
                      contenido
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {visibles.map((fila) => (
              <tr
                key={clave(fila)}
                className={`border-t border-gray-200 dark:border-slate-800 ${claseFila ? claseFila(fila) : ''}`}
              >
                {columnas.map((c) => {
                  const span = c.span ? c.span(fila) : 1;
                  if (!span) return null;
                  return (
                    <td
                      key={c.id}
                      colSpan={span > 1 ? span : undefined}
                      className={`${TD} ${ALINEAR[c.alinear || 'left']} ${c.clase || ''}`}
                    >
                      {c.celda ? c.celda(fila, { orden: ordenActivo }) : esVacio(c.valor?.(fila)) ? '—' : c.valor(fila)}
                    </td>
                  );
                })}
              </tr>
            ))}
            {filas.length > 0 && !visibles.length && (
              <tr className="border-t border-gray-200 dark:border-slate-800">
                <td colSpan={columnas.length} className={`${TD} py-6 text-center text-gray-600 dark:text-slate-300`}>
                  Ningún registro coincide con la búsqueda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {conPie && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[14px] font-medium text-gray-600 dark:text-slate-300">
          <span className="tabular-nums" aria-live="polite">
            {ordenadas.length
              ? `Mostrando ${desde + 1}–${desde + visibles.length} de ${ordenadas.length}`
              : 'Sin resultados'}
            {termino ? ` (filtrado de ${filas.length})` : ''}
          </span>

          {hayPaginas && (
            <div className="ml-auto flex flex-wrap items-center gap-x-4 gap-y-2">
              <label className="flex items-center gap-2 whitespace-nowrap">
                Filas por página
                <select
                  className={`${INPUT} !min-h-9 !w-auto flex-none py-1 text-sm`}
                  value={tamano}
                  onChange={(e) => {
                    setTamano(Number(e.target.value));
                    setPaginaElegida(1);
                  }}
                >
                  {TAMANOS.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                  <option value={TODAS}>Todas</option>
                </select>
              </label>

              {paginar && (
                <nav className="flex items-center gap-1.5" aria-label={`Páginas de ${titulo}`}>
                  <button type="button" className={BOTON_PAGINA} onClick={() => setPaginaElegida(1)} disabled={pagina === 1} aria-label="Primera página">
                    <ChevronDoble icono={faChevronLeft} />
                  </button>
                  <button type="button" className={BOTON_PAGINA} onClick={() => setPaginaElegida(pagina - 1)} disabled={pagina === 1} aria-label="Página anterior">
                    <FontAwesomeIcon icon={faChevronLeft} aria-hidden="true" />
                  </button>
                  <span className="px-2 tabular-nums">
                    {pagina} de {totalPaginas}
                  </span>
                  <button type="button" className={BOTON_PAGINA} onClick={() => setPaginaElegida(pagina + 1)} disabled={pagina === totalPaginas} aria-label="Página siguiente">
                    <FontAwesomeIcon icon={faChevronRight} aria-hidden="true" />
                  </button>
                  <button type="button" className={BOTON_PAGINA} onClick={() => setPaginaElegida(totalPaginas)} disabled={pagina === totalPaginas} aria-label="Última página">
                    <ChevronDoble icono={faChevronRight} />
                  </button>
                </nav>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
