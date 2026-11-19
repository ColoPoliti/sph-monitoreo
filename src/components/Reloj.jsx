import { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faClock } from '@fortawesome/free-solid-svg-icons';

const hora = (d) => d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
const fecha = (d) => d.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

/** Hora local del equipo, actualizada cada segundo. La fecha completa va en el tooltip. */
export default function Reloj({ className = '' }) {
  const [ahora, setAhora] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setAhora(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <time
      dateTime={ahora.toISOString()}
      title={fecha(ahora)}
      className={`flex-none items-center gap-2 text-[15px] font-bold tabular-nums text-gray-900 dark:text-white ${className}`}
    >
      <FontAwesomeIcon icon={faClock} className="text-sm text-gray-600 dark:text-slate-300" aria-hidden="true" />
      {hora(ahora)}
    </time>
  );
}
