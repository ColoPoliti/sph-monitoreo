import { useEffect, useId, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faClipboardCheck, faEye, faEyeSlash, faXmark } from '@fortawesome/free-solid-svg-icons';
import { labelClass, subClass } from './ui';
import { iniciarSesion } from '../lib/auth';
import { toastCalidad } from '../lib/alertasCalidad';
import { DEMO } from '../lib/demo';
import { CLAVE_DEMO } from '../lib/demoApi';

const INPUT =
  'min-h-11 w-full rounded-lg border border-gray-300 dark:border-slate-700 bg-gray-200 dark:bg-slate-950 px-3 py-1.5 text-[15px] font-medium text-gray-900 dark:text-white';

/**
 * Login de "Aprobación calidad" como modal centrado sobre toda la app.
 * Se cierra con la X, con Escape o tocando el fondo. Al ingresar lleva al historial.
 */
export default function LoginModal({ abierto, onCerrar }) {
  return createPortal(
    <AnimatePresence>{abierto && <Contenido onCerrar={onCerrar} />}</AnimatePresence>,
    document.body,
  );
}

// El formulario se monta al abrir: así cada vez arranca vacío
function Contenido({ onCerrar }) {
  const navigate = useNavigate();
  const tituloId = useId();
  const [usuario, setUsuario] = useState('');
  const [clave, setClave] = useState('');
  // Ojo del campo contraseña: muestra u oculta lo escrito
  const [verClave, setVerClave] = useState(false);
  const [enviando, setEnviando] = useState(false);

  // Escape cierra el modal
  useEffect(() => {
    const esc = (e) => {
      if (e.key === 'Escape') onCerrar();
    };
    document.addEventListener('keydown', esc);
    return () => document.removeEventListener('keydown', esc);
  }, [onCerrar]);

  const entrar = async (e) => {
    e.preventDefault();
    setEnviando(true);
    try {
      await iniciarSesion(usuario, clave);
      onCerrar();
      navigate('/historial'); // ahí se aprueban los lotes
    } catch (err) {
      // Toast arriba, como al aprobar/rechazar. Si el problema es del servidor (caído, sin red),
      // se aclara que no es la contraseña; si no, el texto de "error" de la API tal cual
      // (clave incorrecta, bloqueo de 5 minutos, etc.).
      const delServidor = err.status === 0 || err.status >= 500 || err.status === 404;
      if (delServidor) toastCalidad('No se pudo conectar', 'rechazado', `${err.message}.`);
      else toastCalidad(err.message, 'rechazado');
    } finally {
      setEnviando(false);
    }
  };

  return (
    // Fondo oscuro y desenfocado (igual que los modales de SweetAlert); tocarlo cierra
    <motion.div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onCerrar();
      }}
    >
      <motion.form
        onSubmit={entrar}
        role="dialog"
        aria-modal="true"
        aria-labelledby={tituloId}
        className="relative flex w-full max-w-sm flex-col gap-4 rounded-[14px] bg-white px-5 py-6 text-gray-900 shadow-2xl dark:bg-slate-900 dark:text-white sm:px-6"
        initial={{ opacity: 0, scale: 0.95, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 12 }}
        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
      >
        <button
          type="button"
          onClick={onCerrar}
          aria-label="Cerrar"
          title="Cerrar"
          className="absolute right-3 top-3 flex h-9 w-9 cursor-pointer items-center justify-center rounded-md text-xl text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
        >
          <FontAwesomeIcon icon={faXmark} aria-hidden="true" />
        </button>

        <div className="flex items-center gap-3 pr-8">
          <span className="flex h-11 w-11 flex-none items-center justify-center rounded-lg bg-gradient-to-br from-teal-600 to-violet-600 text-white">
            <FontAwesomeIcon icon={faClipboardCheck} className="text-xl" aria-hidden="true" />
          </span>
          <div className="flex flex-col">
            <h2 id={tituloId} className="m-0 text-xl font-extrabold">
              Aprobación calidad
            </h2>
            <span className={subClass}>Ingresá tu usuario y contraseña</span>
          </div>
        </div>

        {/* Modo demo: qué usuarios de ejemplo hay (no existe en producción) */}
        {DEMO && (
          <p className="m-0 rounded-lg border border-sky-500/40 bg-sky-500/10 px-3 py-2 text-[14px] text-sky-800 dark:text-sky-200">
            <b>Modo demo:</b> usuario <b>super</b> (superadministrador), <b>calidad1</b> (administrador) u{' '}
            <b>operario1</b> (usuario). Clave: <b>{CLAVE_DEMO}</b>
          </p>
        )}

        <label className="flex flex-col gap-1.5">
          <span className={labelClass}>Usuario</span>
          <input
            type="text"
            autoComplete="username"
            required
            autoFocus
            className={INPUT}
            value={usuario}
            onChange={(e) => setUsuario(e.target.value)}
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className={labelClass}>Contraseña</span>
          <div className="relative">
            <input
              type={verClave ? 'text' : 'password'}
              autoComplete="current-password"
              required
              className={`${INPUT} pr-11`}
              value={clave}
              onChange={(e) => setClave(e.target.value)}
            />
            <button
              type="button"
              onClick={() => setVerClave((v) => !v)}
              aria-label={verClave ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              aria-pressed={verClave}
              title={verClave ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              className="absolute inset-y-0 right-0 flex w-11 cursor-pointer items-center justify-center rounded-r-lg text-gray-600 transition-colors hover:text-gray-900 dark:text-slate-300 dark:hover:text-white"
            >
              <FontAwesomeIcon icon={verClave ? faEyeSlash : faEye} aria-hidden="true" />
            </button>
          </div>
        </label>

        <button
          type="submit"
          disabled={enviando}
          // Mismo degradé que el botón "Aprobación calidad" del navbar (verde teal-600 → violeta violet-600)
          className="min-h-11 cursor-pointer rounded-lg border-0 bg-gradient-to-r from-teal-600 to-violet-600 px-[26px] py-1.5 text-[15px] font-bold text-white shadow-sm transition-colors hover:from-teal-700 hover:to-violet-700 disabled:cursor-wait disabled:opacity-60"
        >
          {enviando ? 'Ingresando…' : 'Ingresar'}
        </button>
      </motion.form>
    </motion.div>
  );
}
