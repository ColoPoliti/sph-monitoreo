import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CONFIG, roomKey } from '../config/monitor';
import { useMonitor } from '../context/MonitorContext';
import { enEspera, enLinea, subSala } from '../lib/rooms';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faClockRotateLeft, faFlask, faIndustry, faSprayCan } from '@fortawesome/free-solid-svg-icons';

// Ícono de cada área (por su key en CONFIG.AREAS); un área nueva sin ícono usa el de fábrica
const ICONOS_AREA = { elaboracion: faFlask, aerosoles: faSprayCan };
const iconoArea = (key) => ICONOS_AREA[key] || faIndustry;
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
      } fixed bottom-0 left-0 top-[72px] z-30 flex-col overflow-hidden border-r border-slate-400 bg-white shadow-md dark:border-slate-900 dark:bg-slate-950 dark:shadow-none transition-[width] duration-200 lg:static lg:bottom-auto lg:top-auto lg:z-auto lg:h-full lg:flex-none`}
    >
      {/* Encabezado / flecha para contraer o expandir el menú */}
      <div
        className={`flex h-14 flex-none items-center border-b border-slate-400 dark:border-black ${
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

      {/* Sin padding arriba: el primer ítem (Historial) queda pegado a "Salas y PLC" */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden px-2 pb-3">
        {/* Historial: un ítem más del menú, alineado con los PLC (título arriba; abajo el reloj en el
            lugar del indicador de estado). Fondo oscuro casi como el del menú; seleccionado = igual que un PLC */}
        <div
          className={`-mx-2 border-b border-slate-400 px-2 transition-colors dark:border-black ${
            open ? 'py-1' : 'flex justify-center py-1.5'
          } ${
            histActivo
              ? 'border-l-4 border-l-teal-600 bg-slate-900 pl-1 dark:border-l-teal-600 dark:bg-slate-900'
              : 'bg-slate-100 dark:bg-slate-900/50'
          }`}
        >
          <button
            type="button"
            onClick={irAHistorial}
            aria-current={histActivo ? 'page' : undefined}
            aria-label="Historial de elaboraciones · Todas las salas"
            title="Historial de elaboraciones"
            className={`flex w-full cursor-pointer rounded-lg border-transparent transition-colors ${
              open
                ? 'min-h-11 flex-col justify-center border-l-2 py-2 pl-4 pr-2 text-left'
                : 'h-11 items-center justify-center border-2 px-1'
            } ${histActivo ? '' : 'hover:bg-gray-200/70 dark:hover:bg-slate-800/60'}`}
          >
            {open ? (
              <>
                <span
                  className={`block w-full truncate text-[14px] font-extrabold ${
                    histActivo ? 'text-white' : 'text-gray-600 dark:text-slate-300'
                  }`}
                >
                  Historial de elaboraciones
                </span>
                <span className="flex w-full min-w-0 items-center gap-2">
                  <FontAwesomeIcon
                    icon={faClockRotateLeft}
                    className="flex-none text-[10px] text-teal-600 dark:text-teal-400"
                    aria-hidden="true"
                  />
                  <span
                    className={`truncate text-[12px] font-medium ${
                      histActivo ? 'text-white/85' : 'text-gray-500 dark:text-slate-400'
                    }`}
                  >
                    Todas las salas
                  </span>
                </span>
              </>
            ) : (
              <FontAwesomeIcon
                icon={faClockRotateLeft}
                className="text-base text-teal-600 dark:text-teal-400"
                aria-hidden="true"
              />
            )}
          </button>
        </div>

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
                    className="flex min-h-10 -mx-2 w-[calc(100%+1rem)] cursor-pointer items-center gap-2 rounded-none bg-slate-300 px-4 py-2 text-left transition-colors hover:bg-slate-400/70 dark:bg-[#172033] dark:hover:bg-slate-800"
                  >
                    <FontAwesomeIcon
                      icon={iconoArea(area.key)}
                      className="w-4 flex-none text-slate-800 dark:text-white"
                      aria-hidden="true"
                    />
                    <span className="min-w-0 flex-1 truncate text-[11px] font-extrabold uppercase tracking-[1px] text-slate-800 dark:text-white">
                      {area.label}
                    </span>
                    {/* Cantidad de PLC en un badge blanco pleno */}
                    <span className="whitespace-nowrap rounded-md bg-white px-2 py-0.5 text-[11px] font-extrabold text-slate-800 shadow-sm">
                      {area.plcs.length} PLC
                    </span>
                    <IconChevron
                      className={`h-4 w-4 flex-none text-slate-600 transition-transform dark:text-slate-300 ${
                        abierta ? '' : 'rotate-180'
                      }`}
                    />
                  </button>
                ) : (
                  // Menú contraído: solo el ícono del área (el nombre queda en el title y para lectores de pantalla)
                  <div
                    className="-mx-2 flex justify-center rounded-none bg-slate-300 px-1 py-2 text-slate-800 dark:bg-[#172033] dark:text-white"
                    title={`${area.label} (${area.plcs.length} PLC)`}
                  >
                    <FontAwesomeIcon icon={iconoArea(area.key)} className="text-base" aria-hidden="true" />
                    <span className="sr-only">{area.label}</span>
                  </div>
                )}

                {mostrarPlcs && (
                  <div className="flex flex-col pt-1">
                    {area.plcs.map((plc) => {
                      const s = rooms[roomKey(area.key, plc)];
                      // En el historial no se marca ningún PLC (ahí el seleccionado es el ítem del historial)
                      const activo = selectedKey === s.key && !histActivo;
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
                        // Activo: toda la fila (100% del ancho del menú) en slate oscuro con texto blanco y borde izquierdo
                        // verde (el mismo de la card del lote); pl-1 compensa el borde para que el texto no se corra
                        <div
                          key={s.key}
                          className={`-mx-2 border-b border-slate-400 px-2 py-1 transition-colors dark:border-black ${
                            activo ? 'border-l-4 border-l-teal-600 bg-slate-900 pl-1 dark:border-l-teal-600 dark:bg-slate-900' : ''
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => seleccionarSala(s.key)}
                            aria-current={activo ? 'true' : undefined}
                            aria-label={`PLC ${plc} · ${area.label} · ${subSala(s, now)}`}
                            title={`PLC ${plc} · ${area.label}`}
                            className={`flex min-h-11 w-full cursor-pointer flex-col justify-center rounded-lg border-l-2 py-2 pl-4 pr-2 text-left transition-colors ${
                              activo
                                ? 'border-transparent'
                                : 'border-transparent hover:bg-gray-100 dark:hover:bg-slate-800/60'
                            }`}
                          >
                            <span
                              className={`block w-full truncate text-[14px] font-extrabold ${
                                activo ? 'text-white' : 'text-gray-600 dark:text-slate-300'
                              }`}
                            >
                              PLC {plc}
                            </span>
                            {/* Estado e indicador en la misma línea */}
                            <span className="flex w-full min-w-0 items-center gap-2">
                              {indicador}
                              <span
                                className={`truncate text-[12px] font-medium ${
                                  activo ? 'text-white/85' : 'text-gray-500 dark:text-slate-400'
                                }`}
                              >
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
                          className={`-mx-2 flex justify-center border-b border-slate-400 px-2 py-1.5 transition-colors dark:border-black ${
                            activo ? 'border-l-4 border-l-teal-600 bg-slate-900 pl-1 dark:border-l-teal-600 dark:bg-slate-900' : ''
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => seleccionarSala(s.key)}
                            aria-current={activo ? 'true' : undefined}
                            aria-label={`PLC ${plc} · ${area.label} · ${subSala(s, now)}`}
                            title={`PLC ${plc} · ${area.label} · ${subSala(s, now)}`}
                            className={`flex h-11 w-full cursor-pointer items-center justify-center gap-1.5 rounded-lg border-2 px-1 transition-colors ${
                              activo
                                ? 'border-transparent'
                                : 'border-transparent hover:bg-gray-100 dark:hover:bg-slate-800/60'
                            }`}
                          >
                            {indicador}
                            <span
                              className={`whitespace-nowrap text-[10px] font-extrabold leading-none ${
                                activo ? 'text-white' : 'text-gray-600 dark:text-slate-300'
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
        className={`flex flex-none items-center border-t border-slate-400 dark:border-black py-4 ${
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
