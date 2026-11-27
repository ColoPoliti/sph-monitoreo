import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDownload } from '@fortawesome/free-solid-svg-icons';
import { instalarApp, useInstalarApp } from '../lib/instalarPWA';
import { mostrarInstalarIOS } from '../lib/alertasCalidad';

// Navbar: botón "Instalar app". Solo aparece si el navegador permite instalarla
// (Chrome/Edge en Android y escritorio) o en iPhone/iPad; ya instalada, no se muestra.
export default function InstalarApp() {
  const modo = useInstalarApp();
  if (!modo) return null;

  const instalar = () => (modo === 'ios' ? mostrarInstalarIOS() : instalarApp());

  return (
    <button
      type="button"
      onClick={instalar}
      aria-label="Instalar app"
      title="Instalar app"
      // Celular y tablet: círculo solo con el ícono. Escritorio (lg): píldora redonda con ícono + "Instalar app"
      className="flex h-10 w-10 flex-none cursor-pointer items-center justify-center gap-2 rounded-full border border-gray-300 bg-white text-sky-600 transition-colors hover:bg-gray-100 dark:border-slate-700 dark:bg-slate-800 dark:text-sky-400 dark:hover:bg-slate-700 lg:w-auto lg:px-4"
    >
      <FontAwesomeIcon icon={faDownload} aria-hidden="true" />
      <span className="hidden text-sm font-semibold text-gray-900 dark:text-white lg:inline">Instalar app</span>
    </button>
  );
}
