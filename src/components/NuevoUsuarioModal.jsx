import { useEffect, useId, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faEyeSlash, faUserPlus, faXmark } from '@fortawesome/free-solid-svg-icons';
import { labelClass, subClass } from './ui';
import { ROLES } from '../lib/auth';
import { crearUsuario } from '../lib/usuarios';
import { toastCalidad } from '../lib/alertasCalidad';

const INPUT =
  'min-h-11 w-full rounded-lg border border-gray-300 dark:border-slate-700 bg-gray-200 dark:bg-slate-950 px-3 py-1.5 text-[15px] font-medium text-gray-900 dark:text-white';

// Mínimo de la contraseña (el servidor también lo controla)
const MIN_CLAVE = 8;

/**
 * Alta de usuario (solo superadministrador), como modal centrado igual al de login.
 * Se cierra con la X, con Escape o tocando el fondo. onCreado se llama después de crearlo.
 */
export default function NuevoUsuarioModal({ abierto, onCerrar, onCreado }) {
  return createPortal(
    <AnimatePresence>{abierto && <Contenido onCerrar={onCerrar} onCreado={onCreado} />}</AnimatePresence>,
    document.body,
  );
}

// Campo de contraseña con el ojo para mostrarla u ocultarla
function CampoClave({ etiqueta, valor, onCambiar, ver, onVer }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className={labelClass}>{etiqueta}</span>
      <div className="relative">
        <input
          type={ver ? 'text' : 'password'}
          autoComplete="new-password"
          required
          minLength={MIN_CLAVE}
          className={`${INPUT} pr-11`}
          value={valor}
          onChange={(e) => onCambiar(e.target.value)}
        />
        <button
          type="button"
          onClick={onVer}
          aria-label={ver ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          aria-pressed={ver}
          title={ver ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          className="absolute inset-y-0 right-0 flex w-11 cursor-pointer items-center justify-center rounded-r-lg text-gray-600 transition-colors hover:text-gray-900 dark:text-slate-300 dark:hover:text-white"
        >
          <FontAwesomeIcon icon={ver ? faEyeSlash : faEye} aria-hidden="true" />
        </button>
      </div>
    </label>
  );
}

// El formulario se monta al abrir: así cada vez arranca vacío
function Contenido({ onCerrar, onCreado }) {
  const tituloId = useId();
  const [form, setForm] = useState({ usuario: '', nombre: '', rol: 'usuario', clave: '', repetir: '' });
  const [verClave, setVerClave] = useState(false);
  const [enviando, setEnviando] = useState(false);

  const cambiar = (campo) => (valor) => setForm((f) => ({ ...f, [campo]: valor }));

  // Escape cierra el modal
  useEffect(() => {
    const esc = (e) => {
      if (e.key === 'Escape') onCerrar();
    };
    document.addEventListener('keydown', esc);
    return () => document.removeEventListener('keydown', esc);
  }, [onCerrar]);

  const guardar = async (e) => {
    e.preventDefault();
    if (form.clave.length < MIN_CLAVE) {
      toastCalidad(`La contraseña debe tener al menos ${MIN_CLAVE} caracteres`, 'rechazado');
      return;
    }
    if (form.clave !== form.repetir) {
      toastCalidad('Las contraseñas no coinciden', 'rechazado');
      return;
    }
    setEnviando(true);
    try {
      await crearUsuario(form);
      toastCalidad(`Creaste el usuario ${form.usuario.trim()}`, 'aprobado');
      onCerrar();
      onCreado?.();
    } catch (err) {
      // Texto de "error" de la API tal cual (usuario existente, sin permiso, etc.)
      toastCalidad(err.message, 'rechazado');
    } finally {
      setEnviando(false);
    }
  };

  return (
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
        onSubmit={guardar}
        role="dialog"
        aria-modal="true"
        aria-labelledby={tituloId}
        className="relative flex max-h-full w-full max-w-md flex-col gap-4 overflow-y-auto rounded-[14px] bg-white px-5 py-6 text-gray-900 shadow-2xl dark:bg-slate-900 dark:text-white sm:px-6"
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
            <FontAwesomeIcon icon={faUserPlus} className="text-xl" aria-hidden="true" />
          </span>
          <div className="flex flex-col">
            <h2 id={tituloId} className="m-0 text-xl font-extrabold">
              Nuevo usuario
            </h2>
            <span className={subClass}>Completá los datos de acceso</span>
          </div>
        </div>

        <label className="flex flex-col gap-1.5">
          <span className={labelClass}>Usuario</span>
          <input
            type="text"
            autoComplete="off"
            required
            autoFocus
            maxLength={50}
            pattern="[A-Za-z0-9._\-]{3,50}"
            title="De 3 a 50 caracteres: letras, números, punto, guion o guion bajo (sin espacios)"
            className={INPUT}
            value={form.usuario}
            onChange={(e) => cambiar('usuario')(e.target.value)}
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className={labelClass}>Nombre y apellido</span>
          <input
            type="text"
            autoComplete="off"
            maxLength={100}
            className={INPUT}
            value={form.nombre}
            onChange={(e) => cambiar('nombre')(e.target.value)}
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className={labelClass}>Rol</span>
          <select className={`${INPUT} cursor-pointer`} value={form.rol} onChange={(e) => cambiar('rol')(e.target.value)}>
            <option value="usuario">{ROLES.usuario} · solo consulta</option>
            <option value="admin">{ROLES.admin} · aprueba y rechaza lotes</option>
            <option value="superadmin">{ROLES.superadmin} · además administra usuarios</option>
          </select>
        </label>

        <CampoClave
          etiqueta={`Contraseña (mínimo ${MIN_CLAVE} caracteres)`}
          valor={form.clave}
          onCambiar={cambiar('clave')}
          ver={verClave}
          onVer={() => setVerClave((v) => !v)}
        />
        <CampoClave
          etiqueta="Repetir contraseña"
          valor={form.repetir}
          onCambiar={cambiar('repetir')}
          ver={verClave}
          onVer={() => setVerClave((v) => !v)}
        />

        <button
          type="submit"
          disabled={enviando}
          className="min-h-11 cursor-pointer rounded-lg border-0 bg-gradient-to-r from-teal-600 to-violet-600 px-[26px] py-1.5 text-[15px] font-bold text-white shadow-sm transition-colors hover:from-teal-700 hover:to-violet-700 disabled:cursor-wait disabled:opacity-60"
        >
          {enviando ? 'Creando…' : 'Crear usuario'}
        </button>
      </motion.form>
    </motion.div>
  );
}
