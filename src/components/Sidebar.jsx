import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CONFIG, roomKey } from '../config/monitor';
import { useMonitor } from '../context/MonitorContext';
import { enEspera, enLinea, subSala } from '../lib/rooms';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faClockRotateLeft } from '@fortawesome/free-solid-svg-icons';
import logoFoot from '../assets/logo-foot.png';

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

export default function Sidebar({ open, onClose, onToggle }) {
  const { rooms, selectedKey, setSelectedKey, now } = useMonitor();
  const [cerradas, setCerradas] = useState({});
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const histActivo = pathname.startsWith('/historial');

  const esMovil = () =>
    typeof window !== 'undefined' && window.matchMedia('(max-width: 1023px)').matches;

  const cerrarSiMovil = () => {
    if (esMovil()) onClose();
  };

  const irAHistorial = () => {
    navigate('/historial');
    cerrarSiMovil();
  };

  const seleccionarSala = (key) => {
    setSelectedKey(key);
    navigate('/');
    cerrarSiMovil();
  };

  const toggleArea = (areaKey) => {
    const abierta = !cerradas[areaKey];
    setCerradas((prev) => ({ ...prev, [areaKey]: abierta }));
  };

  return (
    <aside
      id="menu-salas"
      aria-label="Salas y PLC"
      className={`${
        open
          ? 'flex w-[280px] lg:w-64'
          : 'hidden lg:flex lg:w-[88px]'
      } fixed bottom-0 left-0 top-[72px] z-30 flex-col overflow-hidden border-r border-gray-200 bg-white shadow-md dark:border-slate-800 dark:bg-slate-950 dark:shadow-none transition-[width] duration-200 lg:static lg:bottom-auto lg:top-auto lg:z-auto lg:h-full lg:flex-none`}
    >
      {/* Encabezado / flecha para contraer o expandir el menú */}
      <div
        className={`flex h-14 flex-none items-center border-b border-gray-200 dark:border-slate-800 ${
          open ? 'justify-between px-4' : 'justify-center px-2'
        }`}
      >
        {open && (
          <span className="min-w-0 truncate text-[11px] font-extrabold uppercase tracking-[1.6px] text-gray-500 dark:text-slate-400">
            Salas y PLC
          </span>
        )}
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={open}
          aria-controls="menu-salas"
          aria-label={open ? 'Contraer menú de salas' : 'Expandir menú de salas'}
          className="hidden h-8 w-8 flex-none lg:flex cursor-pointer items-center justify-center rounded-md text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
        >
          <svg
            className="h-5 w-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            {open ? <polyline points="15 6 9 12 15 18" /> : <polyline points="9 6 15 12 9 18" />}
          </svg>
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto overflow-x-hidden px-2 py-3">
        {/* Historial */}
        <button
          type="button"
          onClick={irAHistorial}
          aria-current={histActivo ? 'page' : undefined}
          aria-label="Historial de elaboraciones"
          title="Historial de elaboraciones"
          className={`flex w-full cursor-pointer items-center justify-center rounded-lg border border-gray-300 bg-black/5 py-2 text-center font-bold text-gray-900 transition-colors hover:bg-black/10 dark:border-slate-700 dark:bg-white/5 dark:text-white dark:hover:bg-white/10 ${
            open ? 'min-h-11 px-3 text-[14px]' : 'min-h-10 px-1'
          } ${
            histActivo
              ? 'ring-2 ring-slate-400 ring-offset-2 ring-offset-white dark:ring-slate-500 dark:ring-offset-slate-950'
              : ''
          }`}
        >
          {open ? (
            <span className="min-w-0 truncate">Historial de elaboraciones</span>
          ) : (
            <FontAwesomeIcon icon={faClockRotateLeft} className="text-lg" aria-hidden="true" />
          )}
        </button>

        <div className="mt-2 border-t border-gray-200 dark:border-slate-800 pt-2">
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
                    className="flex min-h-10 -mx-2 w-[calc(100%+1rem)] cursor-pointer items-center gap-2 rounded-none bg-slate-300 px-5 py-2 text-left transition-colors hover:bg-slate-400/70 dark:bg-slate-800 dark:hover:bg-slate-700"
                  >
                    <span className="min-w-0 flex-1 truncate text-[11px] font-extrabold uppercase tracking-[1.4px] text-slate-800 dark:text-white">
                      {area.label}
                    </span>
                    <span className="whitespace-nowrap text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                      {area.plcs.length} PLC
                    </span>
                    <IconChevron
                      className={`h-4 w-4 flex-none text-slate-600 transition-transform dark:text-slate-300 ${
                        abierta ? '' : 'rotate-180'
                      }`}
                    />
                  </button>
                ) : (
                  <div
                    className="-mx-2 truncate rounded-none bg-slate-300 px-1 py-1.5 text-center text-[9px] font-extrabold uppercase tracking-[0.4px] text-slate-800 dark:bg-slate-800 dark:text-white"
                    title={`${area.label} (${area.plcs.length} PLC)`}
                  >
                    {area.label}
                  </div>
                )}

                {mostrarPlcs && (
                  <div className="flex flex-col pt-1">
                    {area.plcs.map((plc) => {
                      const s = rooms[roomKey(area.key, plc)];
                      const activo = selectedKey === s.key;
                      const indicador = (
                        <span
                          className={`h-2 w-2 flex-none rounded-[2px] ${
                            !enLinea(s, now) ? 'bg-red-500' : enEspera(s) ? 'bg-amber-400' : 'bg-emerald-500'
                          }`}
                          aria-hidden="true"
                        />
                      );

                      return open ? (
                        // Menú expandido: una línea abajo separa cada item
                        <div
                          key={s.key}
                          className="-mx-2 border-b border-gray-200 px-2 py-1 dark:border-slate-800"
                        >
                          <button
                            type="button"
                            onClick={() => seleccionarSala(s.key)}
                            aria-current={activo ? 'true' : undefined}
                            aria-label={`PLC ${plc} · ${area.label} · ${subSala(s, now)}`}
                            title={`PLC ${plc} · ${area.label}`}
                            className={`flex min-h-11 w-full cursor-pointer flex-col justify-center rounded-lg border-l-2 py-2 pl-4 pr-2 text-left transition-colors ${
                              activo
                                ? 'border-transparent bg-violet-100 dark:bg-violet-500/10'
                                : 'border-transparent hover:bg-gray-100 dark:hover:bg-slate-800/60'
                            }`}
                          >
                            <span
                              className={`block w-full truncate text-[14px] font-semibold ${
                                activo ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-slate-300'
                              }`}
                            >
                              PLC {plc}
                            </span>
                            {/* Estado e indicador en la misma línea */}
                            <span className="flex w-full min-w-0 items-center gap-2">
                              {indicador}
                              <span className="truncate text-[12px] font-medium text-gray-500 dark:text-slate-400">
                                {subSala(s, now)}
                              </span>
                            </span>
                          </button>
                        </div>
                      ) : (
                        // Menú contraído: indicador de estado y "PLC 001" en una sola línea;
                        // una línea separa cada item
                        <div
                          key={s.key}
                          className="-mx-2 flex justify-center border-b border-gray-200 px-2 py-1.5 dark:border-slate-800"
                        >
                          <button
                            type="button"
                            onClick={() => seleccionarSala(s.key)}
                            aria-current={activo ? 'true' : undefined}
                            aria-label={`PLC ${plc} · ${area.label} · ${subSala(s, now)}`}
                            title={`PLC ${plc} · ${area.label} · ${subSala(s, now)}`}
                            className={`flex h-11 w-full cursor-pointer items-center justify-center gap-1.5 rounded-lg border-2 px-1 transition-colors ${
                              activo
                                ? 'border-transparent bg-violet-100 dark:bg-violet-500/10'
                                : 'border-transparent hover:bg-gray-100 dark:hover:bg-slate-800/60'
                            }`}
                          >
                            {indicador}
                            <span
                              className={`whitespace-nowrap text-[10px] font-bold leading-none ${
                                activo ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-slate-300'
                              }`}
                            >
                              PLC {plc}
                            </span>
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
      </nav>

      {/* Logo al pie, como el sidebar original */}
      <div
        className={`flex flex-none items-center border-t border-gray-200 dark:border-slate-800 py-4 ${
          open ? 'justify-start gap-2.5 px-4' : 'justify-center px-2'
        }`}
      >
        <img
          src={logoFoot}
          alt="industria 4"
          className="h-7 w-7 flex-shrink-0 object-contain"
        />
        {open && (
          <span className="min-w-0 truncate font-montserrat text-sm font-bold tracking-tight text-gray-900 dark:text-white">
            industria 4
          </span>
        )}
      </div>
    </aside>
  );
}
