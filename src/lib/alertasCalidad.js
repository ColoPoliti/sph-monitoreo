// Ventanas de SweetAlert2 para la aprobación de lotes por Calidad.
// Estilos con clases Tailwind (customClass + buttonsStyling: false); el "!" le gana al CSS de SweetAlert.
import Swal from 'sweetalert2';
import 'sweetalert2/dist/sweetalert2.min.css';
import { areaDe } from '../config/monitor';
import { icon } from '@fortawesome/fontawesome-svg-core';
import { CHIP_BASE, CHIP_ESTADO, CHIP_VARIANTS, estadoChip } from './estados';
import { fechaCorta, mmss } from './format';

const BOTON = 'mx-1 min-h-11 cursor-pointer rounded-lg px-5 py-1.5 text-[15px] font-bold transition-opacity hover:opacity-90';

const CLASES = {
  popup: '!rounded-[14px] !bg-white !text-gray-900 dark:!bg-slate-900 dark:!text-white',
  title: '!text-xl !font-extrabold !text-gray-900 dark:!text-white',
  htmlContainer: '!text-[15px] !text-gray-600 dark:!text-slate-300',
  inputLabel: '!text-[13px] !font-bold !text-gray-600 dark:!text-slate-300',
  input:
    '!rounded-lg !border !border-gray-300 !bg-white !text-[15px] !text-gray-900 dark:!border-slate-700 dark:!bg-slate-950 dark:!text-white',
  actions: '!gap-y-2',
  confirmButton: `${BOTON} bg-sky-600 text-white dark:bg-sky-400 dark:text-gray-900`,
  denyButton: `${BOTON} bg-red-600 text-white dark:bg-red-400 dark:text-gray-900`,
  cancelButton: `${BOTON} border border-gray-300 bg-white text-gray-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white`,
  // "Quitar rechazo": ámbar suave, como los badges
  quitarButton: `${BOTON} border border-current bg-amber-500/15 text-amber-700 dark:bg-amber-400/15 dark:text-amber-300`,
  // Fondo más oscuro y desenfocado detrás de todos los modales
  container: '!bg-black/70 backdrop-blur-sm',
};

const alerta = Swal.mixin({ buttonsStyling: false, customClass: CLASES, reverseButtons: false });

// Toast arriba al centro, debajo del navbar (72px): no tapa los botones ni las columnas de la tabla. tipo: 'aprobado' | 'rechazado' | 'neutro'
const TOAST_TIPO = {
  aprobado: { icon: 'success', borde: '!border-sky-500 dark:!border-sky-400' },
  rechazado: { icon: 'error', borde: '!border-red-500 dark:!border-red-400' },
  neutro: { icon: 'info', borde: '!border-gray-400 dark:!border-slate-500' },
};

export function toastCalidad(texto, tipo = 'neutro') {
  const t = TOAST_TIPO[tipo] || TOAST_TIPO.neutro;
  return Swal.fire({
    toast: true,
    position: 'top',
    icon: t.icon,
    // Aprobado: verde brillante (green-500) en el ícono; el resto, el color de SweetAlert
    ...(tipo === 'aprobado' ? { iconColor: '#22c55e' } : {}),
    title: texto,
    showConfirmButton: false,
    timer: 2500, // 2,5 s
    timerProgressBar: true,
    // Animación propia (tailwind.config.js): baja desde arriba y sube al irse
    showClass: { popup: 'animate-toast-in' },
    hideClass: { popup: 'animate-toast-out' },
    didOpen: (el) => {
      // Pausa el tiempo mientras el mouse está encima
      el.addEventListener('mouseenter', Swal.stopTimer);
      el.addEventListener('mouseleave', Swal.resumeTimer);
    },
    customClass: {
      container: '!top-[64px]', // el toast queda justo debajo del navbar (72px)
      popup: `!rounded-[10px] !border !bg-white !text-gray-900 !shadow-lg dark:!bg-slate-800 dark:!text-white ${t.borde}`,
      title: '!text-[15px] !font-semibold !text-gray-900 dark:!text-white',
      // Aprobado: el mismo verde brillante del ícono (green-500)
      timerProgressBar: tipo === 'rechazado' ? '!bg-red-500' : tipo === 'aprobado' ? '!bg-[#22c55e]' : '!bg-gray-400',
    },
  });
}

const esc = (t) =>
  String(t ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

// Segunda línea de las ventanas: solo el producto (el número de lote va en el título)
const nombreLote = (f) => esc(f.nombre_producto);

/**
 * Pregunta qué hacer con el lote: Aprobar / Rechazar / Cancelar.
 * Si rechaza, pide un comentario opcional.
 * Devuelve { decision: 'aprobado' } | { decision: 'rechazado', comentario }
 * | { decision: 'quitar' } (lote ya rechazado: quitar el rechazo) | null (canceló).
 */
export async function preguntarDecision(fila) {
  // Un lote ya rechazado no se puede volver a rechazar: solo Aprobar o Cancelar,
  // y se muestra el motivo del rechazo anterior
  const yaRechazado = fila.estado === 'rechazado';
  const motivo = fila.calidad?.comentario;
  const avisoRechazo = yaRechazado
    ? `<div class="mt-3 rounded-md border border-current bg-red-500/15 px-3 py-2 text-left text-red-700 dark:bg-red-400/15 dark:text-red-300">
        <div class="text-[13px] font-bold uppercase tracking-[0.6px]">Rechazado por calidad</div>
        ${motivo ? `<div class="whitespace-pre-wrap">${esc(motivo)}</div>` : ''}
      </div>`
    : '';

  const r = await alerta.fire({
    icon: 'question',
    title: `¿Desea aprobar el lote #${fila.id}?`,
    html: nombreLote(fila) + avisoRechazo,
    showDenyButton: true,
    showCancelButton: true,
    confirmButtonText: 'Aprobar',
    // Ya rechazado: en lugar de "Rechazar" ofrece "Quitar rechazo" (vuelve a quedar sin revisar)
    denyButtonText: yaRechazado ? 'Quitar rechazo' : 'Rechazar',
    cancelButtonText: 'Cancelar',
    focusCancel: true,
    customClass: yaRechazado ? { ...CLASES, denyButton: CLASES.quitarButton } : CLASES,
  });

  if (r.isConfirmed) return { decision: 'aprobado' };
  if (!r.isDenied) return null;
  if (yaRechazado) return { decision: 'quitar' };

  const c = await alerta.fire({
    icon: 'warning',
    title: `Rechazar lote #${fila.id}`,
    html: nombreLote(fila),
    input: 'textarea',
    inputLabel: 'Comentario (opcional)',
    inputPlaceholder: 'Motivo del rechazo…',
    showCancelButton: true,
    confirmButtonText: 'Rechazar',
    cancelButtonText: 'Cancelar',
    customClass: { ...CLASES, confirmButton: CLASES.denyButton },
  });

  return c.isConfirmed ? { decision: 'rechazado', comentario: c.value || '' } : null;
}

// Al apagar el switch de un lote aprobado
export async function confirmarQuitarAprobacion(fila) {
  const r = await alerta.fire({
    icon: 'warning',
    title: `¿Quitar la aprobación del lote #${fila.id}?`,
    html: nombreLote(fila),
    showCancelButton: true,
    confirmButtonText: 'Quitar aprobación',
    cancelButtonText: 'Cancelar',
    focusCancel: true,
  });
  return r.isConfirmed;
}

// Modal con los datos del lote y la decisión de Calidad
export function mostrarInfoLote(fila) {
  const area = areaDe(fila.area);
  const cal = fila.calidad;
  // Estado como chip, con los mismos colores que en la tabla
  const { tipo, texto, icono } = estadoChip(fila.estado);
  const iconoSvg = icon(icono, { classes: ['mr-1.5'] }).html.join('');
  const estadoHtml = `<span class="${CHIP_BASE} ${CHIP_VARIANTS[tipo]} ${CHIP_ESTADO}">${iconoSvg}${esc(texto)}</span>`;

  const filas = [
    ['Producto', fila.nombre_producto],
    ['Lote', `#${fila.id}`],
    ['Código de barras', fila.codigo_barra],
    ['Sector / PLC', `${area ? area.label : fila.area} ${fila.sala}`],
    ['Inicio', fila.inicio ? fechaCorta(fila.inicio) : '—'],
    ['Fin', fila.fin ? fechaCorta(fila.fin) : '—'],
    ['Tiempo total', mmss(fila.tiempo_total_s)],
    ['Estado', { html: estadoHtml }],
  ];
  if (cal) {
    filas.push(['Revisó', cal.usuario || '—']);
    filas.push(['Fecha de revisión', cal.fecha ? new Date(cal.fecha).toLocaleString('es-AR') : '—']);
  }

  const tabla = filas
    .map(
      ([k, v]) =>
        `<tr class="border-t border-gray-200 dark:border-slate-800">
          <th class="py-2 pr-3 text-left align-top text-[13px] font-bold uppercase tracking-[0.6px] text-gray-500 dark:text-slate-400">${esc(k)}</th>
          <td class="py-2 text-left font-semibold text-gray-900 dark:text-white">${v && v.html ? v.html : esc(v)}</td>
        </tr>`,
    )
    .join('');

  const comentario = cal?.comentario
    ? `<div class="mt-3 rounded-md border border-current bg-red-500/15 px-3 py-2 text-left text-[16px] text-red-700 dark:bg-red-400/15 dark:text-red-300">
        <div class="text-[13px] font-bold uppercase tracking-[0.6px]">Comentario</div>
        <div class="whitespace-pre-wrap">${esc(cal.comentario)}</div>
      </div>`
    : '';

  return alerta.fire({
    title: 'Información del lote',
    html: `<table class="w-full text-[16px]"><tbody>${tabla}</tbody></table>${comentario}`,
    confirmButtonText: 'Cerrar',
    customClass: {
      ...CLASES,
      confirmButton: CLASES.cancelButton,
      // X para cerrar arriba a la derecha
      closeButton:
        '!text-4xl !text-gray-500 hover:!text-gray-900 focus:!shadow-none dark:!text-slate-400 dark:hover:!text-white',
    },
    width: 520,
    showCloseButton: true,
    closeButtonHtml: '&times;',
  });
}
