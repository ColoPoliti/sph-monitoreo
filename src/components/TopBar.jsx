import { Link } from 'react-router-dom';
import { useTituloVista } from '../lib/useTituloVista';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars, faXmark } from '@fortawesome/free-solid-svg-icons';
import SaphirusLogo from './SaphirusLogo';
import ThemeToggle from './ThemeToggle';

export default function TopBar({ menuOpen, onToggleMenu }) {
  const { titulo, sub } = useTituloVista();

  return (
    <header className="flex h-[72px] flex-none items-center gap-2.5 relative z-10 border-b border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-md dark:shadow-none px-4 sm:gap-4 sm:px-6">
      {/* Mobile: hamburguesa que abre/cierra el menú de salas (en escritorio se maneja desde el propio menú) */}
      <button
        type="button"
        onClick={onToggleMenu}
        aria-controls="menu-salas"
        aria-expanded={menuOpen}
        aria-label={menuOpen ? 'Cerrar menú de salas' : 'Abrir menú de salas'}
        className="flex h-10 w-10 flex-none cursor-pointer items-center justify-center rounded-[10px] text-gray-900 transition-colors hover:bg-gray-100 dark:text-white dark:hover:bg-slate-800 lg:hidden"
      >
        <FontAwesomeIcon icon={menuOpen ? faXmark : faBars} className="text-xl" aria-hidden="true" />
      </button>

      {/* Logo Saphirus: en mobile centrado en la barra, desde sm vuelve a su lugar */}
      <Link
        to="/"
        aria-label="Saphirus · Ir al monitor"
        className="absolute left-1/2 flex flex-none -translate-x-1/2 items-center rounded-md focus-visible:outline-offset-4 sm:static sm:translate-x-0"
      >
        <SaphirusLogo className="h-10 w-auto max-w-[170px] object-contain sm:max-w-none" />
      </Link>

      <span className="hidden h-7 w-px flex-none bg-gray-300 dark:bg-slate-700 sm:block" aria-hidden="true" />

      {/* Título de la vista/sala seleccionada dentro de un badge (oculto en mobile para dejar el logo centrado) */}
      <div className="flex min-w-0 flex-1 items-center gap-2.5">
        <span className="hidden min-w-0 items-center rounded-full sm:inline-flex border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-md dark:shadow-none px-3 py-1.5 sm:px-4">
          <span className="truncate text-[13px] font-extrabold leading-tight sm:text-[15px]">
            {titulo}
          </span>
        </span>
        <span className="hidden truncate text-[12px] font-medium text-gray-500 dark:text-slate-400 md:inline">
          {sub}
        </span>
      </div>

      <ThemeToggle />
    </header>
  );
}
