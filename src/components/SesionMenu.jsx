import { useCallback, useEffect, useRef, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import LoginModal from './LoginModal';
import {
  faClipboardCheck,
  faEllipsisVertical,
  faRightFromBracket,
  faUser,
  faUserShield,
  faUsers,
} from '@fortawesome/free-solid-svg-icons';
import { ROLES, cerrarSesion, useSesion } from '../lib/auth';

const BOTON =
  'flex h-10 flex-none items-center gap-2 rounded-[10px] border border-gray-300 bg-white px-3 text-sm font-semibold text-gray-900 transition-colors hover:bg-gray-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700';
const ITEM =
  'flex w-full cursor-pointer items-center gap-2.5 px-3.5 py-2.5 text-left text-sm font-semibold transition-colors hover:bg-gray-100 dark:hover:bg-slate-700';

// Navbar: "Aprobación calidad" sin sesión (abre el login en un modal); con sesión, el usuario
// y un menú (3 puntos) con "Ingresar con otras credenciales" (abre el modal) y "Cerrar sesión".
export default function SesionMenu() {
  const [abierto, setAbierto] = useState(false);
  // Modal de login ("Aprobación calidad" / "Ingresar con otras credenciales")
  const [loginAbierto, setLoginAbierto] = useState(false);
  const cerrarLogin = useCallback(() => setLoginAbierto(false), []);
  const ref = useRef(null);

  // Reactivo: se actualiza solo al iniciar o cerrar sesión
  const { usuario, rol } = useSesion();

  // Cierra el menú al hacer clic afuera o con Escape
  useEffect(() => {
    if (!abierto) return undefined;
    const fuera = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setAbierto(false);
    };
    const esc = (e) => {
      if (e.key === 'Escape') setAbierto(false);
    };
    document.addEventListener('mousedown', fuera);
    document.addEventListener('keydown', esc);
    return () => {
      document.removeEventListener('mousedown', fuera);
      document.removeEventListener('keydown', esc);
    };
  }, [abierto]);

  const modal = <LoginModal abierto={loginAbierto} onCerrar={cerrarLogin} />;

  if (!usuario) {
    return (
      <>
        <button
          type="button"
          onClick={() => setLoginAbierto(true)}
          aria-haspopup="dialog"
          aria-label="Aprobación calidad"
          title="Aprobación calidad"
          // Degradé del verde (teal-600, Historial / borde del lote) al violeta (violet-600, fechas de fin)
          className="ml-auto flex h-10 flex-none cursor-pointer items-center gap-2 rounded-[10px] bg-gradient-to-r from-teal-600 to-violet-600 px-3 text-sm font-semibold text-white shadow-sm transition-colors hover:from-teal-700 hover:to-violet-700"
        >
          <FontAwesomeIcon icon={faClipboardCheck} aria-hidden="true" />
          <span className="hidden sm:inline">Aprobación calidad</span>
        </button>
        {modal}
      </>
    );
  }

  const otrasCredenciales = () => {
    setAbierto(false);
    cerrarSesion();
    setLoginAbierto(true);
  };

  const salir = () => {
    setAbierto(false);
    cerrarSesion();
  };

  return (
    <div ref={ref} className="relative ml-auto flex flex-none items-center gap-1.5">
      {/* Solo indicador de la sesión (no es un botón) */}
      <span
        title={`Sesión iniciada como ${usuario} (${ROLES[rol] || rol})`}
        className="flex h-10 flex-none select-none items-center gap-2 rounded-[10px] border border-transparent px-2 text-sm font-semibold text-gray-900 dark:text-white"
      >
        <FontAwesomeIcon
          icon={rol === 'admin' ? faUserShield : faUser}
          className="text-sky-600 dark:text-sky-400"
          aria-hidden="true"
        />
        <span className="sr-only">Sesión iniciada como </span>
        <span className="hidden max-w-[140px] truncate sm:inline">{usuario}</span>
      </span>

      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={abierto}
        aria-label="Opciones de sesión"
        title="Opciones de sesión"
        className={`${BOTON} w-10 cursor-pointer justify-center px-0`}
      >
        <FontAwesomeIcon icon={faEllipsisVertical} aria-hidden="true" />
      </button>

      {abierto && (
        <div
          role="menu"
          className="absolute right-0 top-full z-50 mt-2 w-max min-w-[16rem] overflow-hidden whitespace-nowrap rounded-[10px] border border-gray-300 bg-white text-gray-900 shadow-lg dark:border-slate-700 dark:bg-slate-800 dark:text-white"
        >
          <button type="button" role="menuitem" onClick={otrasCredenciales} className={ITEM}>
            <FontAwesomeIcon icon={faUsers} className="w-4 text-gray-500 dark:text-slate-400" aria-hidden="true" />
            Ingresar con otras credenciales
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={salir}
            className={`${ITEM} border-t border-gray-200 text-red-700 dark:border-slate-700 dark:text-red-300`}
          >
            <FontAwesomeIcon icon={faRightFromBracket} className="w-4" aria-hidden="true" />
            Cerrar sesión
          </button>
        </div>
      )}
      {modal}
    </div>
  );
}
