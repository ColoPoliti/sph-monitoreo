import { useLocation } from 'react-router-dom';
import { useMonitor } from '../context/MonitorContext';

/**
 * Título de la vista actual (sala seleccionada, Historial o Etiqueta digital).
 * Lo usan el badge del TopBar (escritorio) y el badge de mobile en el Layout.
 */
export function useTituloVista() {
  const { selectedRoom } = useMonitor();
  const { pathname } = useLocation();

  if (pathname.startsWith('/historial')) {
    return { titulo: 'Historial de elaboraciones', sub: 'Todas las salas' };
  }
  if (pathname.startsWith('/lotes/')) {
    return { titulo: 'Etiqueta digital', sub: '' };
  }
  return {
    titulo: selectedRoom ? `${selectedRoom.area.label} ${selectedRoom.plc}` : 'Monitor',
    sub: selectedRoom?.key || '',
  };
}
