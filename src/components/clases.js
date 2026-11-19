// Clases Tailwind comunes de las tablas (mismos estilos que el MES).
// Van en un archivo aparte de los componentes para no romper el Fast Refresh de Vite.

export const INPUT =
  'min-h-11 w-full rounded-lg border border-gray-300 dark:border-slate-700 bg-gray-200 dark:bg-slate-950 px-3 py-1.5 text-[15px] font-medium text-gray-900 dark:text-white';

export const TH =
  'px-1.5 py-2 text-[13px] font-bold uppercase tracking-[0.8px] text-gray-600 dark:text-slate-300';
export const TD = 'px-1.5 py-2 align-middle text-[15px] font-medium';

const BOTON_BASE =
  'inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-lg px-[18px] py-1.5 text-[15px] font-bold transition disabled:cursor-not-allowed disabled:opacity-50';
export const BOTON = {
  secundario: `${BOTON_BASE} border border-gray-300 bg-white text-gray-900 hover:bg-gray-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700`,
};
