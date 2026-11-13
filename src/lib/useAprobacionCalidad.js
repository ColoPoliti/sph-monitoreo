import { aplicarAprobacion, quitarDecision, registrarDecision } from './aprobaciones';
import { confirmarQuitarAprobacion, preguntarDecision, toastCalidad } from './alertasCalidad';
import { useSesion } from './auth';

/**
 * Aprobación de lotes por Calidad dentro de una tabla de lotes.
 * setFilas: el setState de las filas de la tabla (para actualizar la fila aprobada/rechazada).
 * Devuelve esAdmin y onAprobar (para LotesTable). Los avisos salen como toast arriba.
 */
export function useAprobacionCalidad(setFilas) {
  // Reactivo: al cerrar sesión desaparecen el switch y la info sin refrescar
  const { usuario, rol } = useSesion();
  const esAdmin = Boolean(usuario) && rol === 'admin';

  // Vuelve a leer la decisión guardada para esa fila
  const refrescarFila = (id) =>
    setFilas((prev) => prev.map((r) => (r.id === id ? aplicarAprobacion(r) : r)));

  const onAprobar = async (fila, encender) => {
    if (!esAdmin) return; // solo el administrador aprueba
    const nombre = `lote #${fila.id} · ${fila.nombre_producto}`;

    if (!encender) {
      // Apagar el switch de un lote aprobado
      if (!(await confirmarQuitarAprobacion(fila))) return;
      quitarDecision(fila.id);
      refrescarFila(fila.id);
      toastCalidad(`Quitaste la aprobación del ${nombre}`, 'neutro');
      return;
    }

    const r = await preguntarDecision(fila);
    if (!r) return; // Cancelar: queda como estaba

    if (r.decision === 'quitar') {
      // Quitar el rechazo: el lote vuelve a su estado original (sin revisar)
      quitarDecision(fila.id);
      refrescarFila(fila.id);
      toastCalidad(`Quitaste el rechazo del ${nombre}`, 'neutro');
      return;
    }

    registrarDecision(fila.id, r, usuario);
    refrescarFila(fila.id);
    if (r.decision === 'aprobado') toastCalidad(`Aprobaste el ${nombre}`, 'aprobado');
    else toastCalidad(`Rechazaste el ${nombre}`, 'rechazado');
  };

  return { esAdmin, onAprobar };
}
