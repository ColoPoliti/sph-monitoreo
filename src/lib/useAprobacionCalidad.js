import { conDecision, quitarDecision, registrarDecision } from './aprobaciones';
import { confirmarQuitarAprobacion, preguntarDecision, toastCalidad } from './alertasCalidad';
import { getLote } from './api';
import { puedeAprobar, useSesion } from './auth';

/**
 * Aprobación de lotes por Calidad dentro de una tabla de lotes.
 * setFilas: el setState de las filas de la tabla (para actualizar la fila aprobada/rechazada).
 * Devuelve esAdmin y onAprobar (para LotesTable). Los avisos salen como toast arriba.
 */
export function useAprobacionCalidad(setFilas) {
  // Reactivo: al cerrar sesión (o si vence) desaparecen el switch y la info sin refrescar
  const { usuario, rol } = useSesion();
  // Administrador o superadministrador
  const esAdmin = Boolean(usuario) && puedeAprobar(rol);

  // Pone en la fila la decisión que devolvió la API (null = sin revisar)
  const ponerDecision = (id, calidad) =>
    setFilas((prev) => prev.map((r) => (r.id === id ? conDecision(r, calidad) : r)));

  // Vuelve a pedir el lote a lotes.php (por ejemplo si otra PC lo cambió: 409)
  const recargarFila = (id) =>
    getLote(id)
      .then((d) => {
        if (d?.lote) setFilas((prev) => prev.map((r) => (r.id === id ? { ...r, ...d.lote } : r)));
      })
      .catch(() => {
        /* queda como estaba */
      });

  // Ejecuta la acción contra la API; si falla muestra el texto de "error" tal cual
  const ejecutar = async (fila, accion) => {
    try {
      await accion();
      return true;
    } catch (e) {
      toastCalidad(e.message, 'rechazado');
      if (e.status === 409 || e.status === 404) recargarFila(fila.id);
      return false;
    }
  };

  const onAprobar = async (fila, encender) => {
    if (!esAdmin) return; // solo el administrador aprueba
    const nombre = `lote #${fila.id} · ${fila.nombre_producto}`;

    if (!encender) {
      // Apagar el switch de un lote aprobado
      if (!(await confirmarQuitarAprobacion(fila))) return;
      const ok = await ejecutar(fila, async () => {
        await quitarDecision(fila.id);
        ponerDecision(fila.id, null);
      });
      if (ok) toastCalidad(`Quitaste la aprobación del ${nombre}`, 'neutro');
      return;
    }

    const r = await preguntarDecision(fila);
    if (!r) return; // Cancelar: queda como estaba

    if (r.decision === 'quitar') {
      // Quitar el rechazo: el lote vuelve a su estado original (sin revisar)
      const ok = await ejecutar(fila, async () => {
        await quitarDecision(fila.id);
        ponerDecision(fila.id, null);
      });
      if (ok) toastCalidad(`Quitaste el rechazo del ${nombre}`, 'neutro');
      return;
    }

    const ok = await ejecutar(fila, async () => {
      const calidad = await registrarDecision(fila.id, r);
      if (calidad) ponerDecision(fila.id, calidad);
      else recargarFila(fila.id);
    });
    if (!ok) return;
    if (r.decision === 'aprobado') toastCalidad(`Aprobaste el ${nombre}`, 'aprobado');
    else toastCalidad(`Rechazaste el ${nombre}`, 'rechazado');
  };

  return { esAdmin, onAprobar };
}
