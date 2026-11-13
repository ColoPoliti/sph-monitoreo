import { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import StatusBar from './StatusBar';
import TopBar from './TopBar';
import { useTituloVista } from '../lib/useTituloVista';

export default function Layout() {
  const { titulo } = useTituloVista();
  const [menuOpen, setMenuOpen] = useState(
    () => typeof window === 'undefined' || window.innerWidth >= 1024,
  );

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-white dark:bg-slate-950 text-gray-900 dark:text-white">
      <TopBar menuOpen={menuOpen} onToggleMenu={() => setMenuOpen((v) => !v)} />

      <div className="relative flex min-h-0 flex-1">
        {menuOpen && (
          <button
            type="button"
            aria-label="Cerrar menú de salas"
            onClick={() => setMenuOpen(false)}
            className="fixed inset-0 top-[72px] z-20 cursor-default bg-black/40 lg:hidden"
          />
        )}

        <Sidebar
          open={menuOpen}
          onClose={() => setMenuOpen(false)}
          onToggle={() => setMenuOpen((v) => !v)}
        />

        <main className="h-full min-w-0 flex-1 overflow-y-auto bg-slate-200 p-4 dark:bg-slate-950">
          {/* Mobile: nombre de la vista/sala en un badge arriba del contenido (en el TopBar se oculta para centrar el logo) */}
          <div className="mb-3 flex sm:hidden">
            <span className="inline-flex min-w-0 items-center rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-gray-900 shadow-md dark:border-white dark:shadow-none">
              <span className="truncate text-[13px] font-extrabold leading-tight">{titulo}</span>
            </span>
          </div>
          <Outlet />
        </main>
      </div>

      <StatusBar />
    </div>
  );
}
