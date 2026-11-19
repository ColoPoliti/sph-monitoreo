import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFlask, faIndustry, faSprayCan } from '@fortawesome/free-solid-svg-icons';
import { CONFIG, roomKey } from '../config/monitor';
import { useMonitor } from '../context/MonitorContext';
import { enEspera, enLinea, subSala } from '../lib/rooms';

// Ícono de cada área (por su key en CONFIG.AREAS); un área nueva sin ícono usa el de fábrica
const ICONOS_AREA = { elaboracion: faFlask, aerosoles: faSprayCan };
const iconoArea = (key) => ICONOS_AREA[key] || faIndustry;

function IconChevron({ className }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

/** Árbol de áreas y PLC con su estado en vivo (menú lateral del módulo Monitoreo). */
export default function SalasMenu({ open, onNavegar }) {
  const { rooms, selectedKey, setSelectedKey, now } = useMonitor();
  const [cerradas, setCerradas] = useState({});
  const navigate = useNavigate();
  const { pathname } = useLocation();
  // Solo se marca el PLC activo en el monitor (no en historial ni etiqueta digital)
  const enMonitor = pathname === '/';

  const seleccionarSala = (key) => {
    setSelectedKey(key);
    navigate('/');
    onNavegar?.();
  };

  const toggleArea = (areaKey) => setCerradas((prev) => ({ ...prev, [areaKey]: !prev[areaKey] }));

  return (
    <div>
      {CONFIG.AREAS.map((area) => {
        const abierta = !cerradas[area.key];
        const mostrarPlcs = open ? abierta : true;

        return (
          <div key={area.key} className="mb-1">
            {open ? (
              <button
                type="button"
                onClick={() => toggleArea(area.key)}
                aria-expanded={abierta}
                aria-label={`${area.label} (${area.plcs.length} PLC)`}
                className="flex min-h-10 -mx-2 w-[calc(100%+1rem)] cursor-pointer items-center gap-2 rounded-none px-4 py-2 text-left transition-colors hover:bg-gray-100 dark:hover:bg-slate-800/50"
              >
                <FontAwesomeIcon
                  icon={iconoArea(area.key)}
                  className="w-4 flex-none text-slate-800 dark:text-white"
                  aria-hidden="true"
                />
                <span className="min-w-0 flex-1 truncate text-[12px] font-extrabold uppercase tracking-[1px] text-slate-800 dark:text-white">
                  {area.label}
                </span>
                <span className="whitespace-nowrap rounded-md bg-gray-100 px-2 py-0.5 text-[12px] font-extrabold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                  {area.plcs.length} PLC
                </span>
                <IconChevron
                  className={`h-4 w-4 flex-none text-slate-600 transition-transform dark:text-slate-300 ${
                    abierta ? '' : 'rotate-180'
                  }`}
                />
              </button>
            ) : (
              // Menú contraído: solo el ícono del área
              <div
                className="-mx-2 flex justify-center rounded-none px-1 py-2 text-slate-800 dark:text-white"
                title={`${area.label} (${area.plcs.length} PLC)`}
              >
                <FontAwesomeIcon icon={iconoArea(area.key)} className="text-base" aria-hidden="true" />
                <span className="sr-only">{area.label}</span>
              </div>
            )}

            {mostrarPlcs && (
              // Menú expandido: PLC uno debajo del otro, con sangría a la izquierda
              <div className={`flex flex-col pt-1 ${open ? 'ml-4' : ''}`}>
                {area.plcs.map((plc) => {
                  const s = rooms[roomKey(area.key, plc)];
                  const activo = selectedKey === s.key && enMonitor;
                  const estado = subSala(s, now);
                  const indicador = (
                    <span
                      className={`h-2 w-2 flex-none rounded-[2px] ${
                        !enLinea(s, now) ? 'bg-red-500' : enEspera(s) ? 'bg-yellow-500 dark:bg-yellow-400' : 'bg-emerald-500'
                      }`}
                      aria-hidden="true"
                    />
                  );

                  return (
                    <div
                      key={s.key}
                      className={`transition-colors ${
                        open
                          ? 'py-0.5'
                          : `-mx-2 flex justify-center px-2 py-1.5 ${
                              activo ? 'border-l-4 border-l-teal-600 bg-slate-200 pl-1 dark:border-l-teal-600 dark:bg-slate-900' : ''
                            }`
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => seleccionarSala(s.key)}
                        aria-current={activo ? 'true' : undefined}
                        aria-label={`PLC ${plc} · ${area.label} · ${estado}`}
                        title={`PLC ${plc} · ${area.label} · ${estado}`}
                        className={`flex w-full cursor-pointer rounded-lg border-transparent transition-colors ${
                          open
                            ? `min-h-10 items-center gap-3 py-2 pl-3 pr-2 text-left ${activo ? 'bg-slate-200 dark:bg-slate-900' : ''}`
                            : 'h-11 items-center justify-center gap-1.5 border-2 px-1'
                        } ${activo ? '' : 'hover:bg-gray-100 dark:hover:bg-slate-800/60'}`}
                      >
                        {open ? (
                          // Estado (color) y nombre en una sola línea; el texto del estado queda en el tooltip
                          <>
                            {indicador}
                            <span
                              className={`min-w-0 truncate text-[14px] font-normal ${
                                activo ? 'text-slate-900 dark:text-white' : 'text-gray-600 dark:text-slate-300'
                              }`}
                            >
                              PLC {plc}
                            </span>
                          </>
                        ) : (
                          <>
                            {indicador}
                            <span
                              className={`whitespace-nowrap text-[10px] font-normal leading-none ${
                                activo ? 'text-slate-900 dark:text-white' : 'text-gray-600 dark:text-slate-300'
                              }`}
                            >
                              PLC {plc}
                            </span>
                          </>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
