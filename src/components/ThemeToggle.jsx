import { AnimatePresence, motion } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSun, faMoon } from '@fortawesome/free-solid-svg-icons';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const esClaro = theme === 'light';
  const texto = esClaro ? 'Modo claro' : 'Modo oscuro';

  return (
    <motion.button
      type="button"
      onClick={toggleTheme}
      whileTap={{ scale: 0.96 }}
      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
      aria-label={`Cambiar a ${texto.toLowerCase()}`}
      title={`Cambiar a ${texto.toLowerCase()}`}
      className="flex h-10 flex-none cursor-pointer items-center gap-2 rounded-[10px] border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-sm font-semibold text-gray-900 dark:text-white transition-colors hover:bg-gray-100 dark:hover:bg-slate-700"
    >
      <span className="relative flex h-5 w-5 items-center justify-center overflow-hidden" aria-hidden="true">
        {/* Sin mode="wait": el ícono que sale y el que entra se animan a la vez (superpuestos) */}
        <AnimatePresence initial={false}>
          <motion.span
            key={theme}
            initial={{ scale: 0, rotate: -180, opacity: 0 }}
            animate={{ scale: 1, rotate: 0, opacity: 1 }}
            exit={{ scale: 0, rotate: 180, opacity: 0, transition: { duration: 0.15, ease: 'easeIn' } }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <FontAwesomeIcon
              icon={esClaro ? faSun : faMoon}
              className={esClaro ? 'text-amber-500' : 'text-indigo-300'}
            />
          </motion.span>
        </AnimatePresence>
      </span>
      <span className="hidden sm:inline">{texto}</span>
    </motion.button>
  );
}
