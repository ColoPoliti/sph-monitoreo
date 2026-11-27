import { useCallback, useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLock, faUserMinus, faUserPlus, faUsers } from '@fortawesome/free-solid-svg-icons';
import DataTable from '../components/DataTable';
import NuevoUsuarioModal from '../components/NuevoUsuarioModal';
import { Chip, labelClass, subClass } from '../components/ui';
import { ROLES, esSuperadmin, useSesion } from '../lib/auth';
import { bajaUsuario, getUsuarios } from '../lib/usuarios';
import { confirmarBajaUsuario, toastCalidad } from '../lib/alertasCalidad';

const CARD = 'rounded-md bg-white/70 dark:bg-slate-900/60 shadow-md dark:shadow-none px-4 py-[18px] sm:px-[22px]';

// Color del chip de cada rol
const CHIP_ROL = { superadmin: 'curso', admin: 'calidad', usuario: 'neutro' };

// 'AAAA-MM-DD HH:MM:SS' -> 'DD/MM/AAAA HH:MM'
const fecha = (ts) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}:\d{2})/.exec(ts || '');
  return m ? `${m[3]}/${m[2]}/${m[1]} ${m[4]}` : '—';
};

/**
 * Administración de usuarios (solo superadministrador): tabla con todos los usuarios,
 * alta con el modal "Nuevo usuario" y baja lógica (el usuario queda inactivo, no se borra).
 */
export default function Usuarios() {
  const { usuario: yo, rol } = useSesion();
  const permitido = esSuperadmin(rol);

  const [filas, setFilas] = useState([]);
  const [aviso, setAviso] = useState({ texto: '', error: false });
  const [cargando, setCargando] = useState(true);
  const [nuevoAbierto, setNuevoAbierto] = useState(false);
  const cerrarNuevo = useCallback(() => setNuevoAbierto(false), []);

  // "Cargando…" arranca en true; al recargar (después de un alta o una baja) lo pone recargar()
  const cargar = useCallback(() => {
    return getUsuarios()
      .then((lista) => {
        // Activos primero; dentro de cada grupo, por usuario
        lista.sort((a, b) => Number(b.activo) - Number(a.activo) || String(a.usuario).localeCompare(String(b.usuario), 'es'));
        setFilas(lista);
        setAviso({ texto: lista.length ? '' : 'Todavía no hay usuarios cargados.', error: false });
      })
      .catch((e) => {
        setFilas([]);
        setAviso({ texto: 'No se pudo cargar la lista de usuarios (' + e.message + ').', error: true });
      })
      .finally(() => setCargando(false));
  }, []);

  useEffect(() => {
    if (permitido) cargar();
  }, [permitido, cargar]);

  const recargar = useCallback(() => {
    setCargando(true);
    cargar();
  }, [cargar]);

  const darDeBaja = async (u) => {
    if (!(await confirmarBajaUsuario(u))) return;
    try {
      await bajaUsuario(u.usuario);
      toastCalidad(`Diste de baja a ${u.usuario}`, 'neutro');
      recargar();
    } catch (e) {
      toastCalidad(e.message, 'rechazado');
    }
  };

  // Sin sesión de superadministrador: solo un aviso (el servidor igual rechaza con 403)
  if (!permitido) {
    return (
      <section className={`${CARD} flex items-start gap-3`}>
        <FontAwesomeIcon icon={faLock} className="mt-1 flex-none text-gray-600 dark:text-slate-300" aria-hidden="true" />
        <div className="flex flex-col gap-1">
          <h1 className="m-0 text-xl font-extrabold">Usuarios</h1>
          <p className={`m-0 ${subClass}`}>
            Solo el superadministrador puede ver y administrar usuarios. Ingresá con esa cuenta desde
            "Aprobación calidad".
          </p>
        </div>
      </section>
    );
  }

  const activos = filas.filter((u) => u.activo).length;

  const columnas = [
    { id: 'usuario', titulo: 'Usuario', valor: (u) => u.usuario, clase: 'font-bold' },
    { id: 'nombre', titulo: 'Nombre', valor: (u) => u.nombre || '', celda: (u) => u.nombre || '—' },
    {
      id: 'rol',
      titulo: 'Rol',
      valor: (u) => ROLES[u.rol] || u.rol,
      celda: (u) => <Chip tipo={CHIP_ROL[u.rol] || 'neutro'}>{ROLES[u.rol] || u.rol}</Chip>,
    },
    {
      id: 'estado',
      titulo: 'Estado',
      valor: (u) => (u.activo ? 'Activo' : 'De baja'),
      celda: (u) => <Chip tipo={u.activo ? 'ok' : 'neutro'} mayus>{u.activo ? 'Activo' : 'De baja'}</Chip>,
    },
    { id: 'alta', titulo: 'Alta', valor: (u) => u.creado_en || '', celda: (u) => fecha(u.creado_en), texto: (u) => fecha(u.creado_en), clase: 'whitespace-nowrap tabular-nums' },
    {
      id: 'acceso',
      titulo: 'Último acceso',
      valor: (u) => u.ultimo_acceso || '',
      celda: (u) => fecha(u.ultimo_acceso),
      texto: (u) => fecha(u.ultimo_acceso),
      clase: 'whitespace-nowrap tabular-nums',
    },
    {
      id: 'acciones',
      titulo: 'Acciones',
      oculto: true,
      alinear: 'right',
      celda: (u) => {
        const esYo = u.usuario === yo;
        if (!u.activo) return null;
        return (
          <button
            type="button"
            onClick={() => darDeBaja(u)}
            disabled={esYo}
            title={esYo ? 'No podés darte de baja a vos mismo' : `Dar de baja a ${u.usuario}`}
            aria-label={`Dar de baja a ${u.usuario}`}
            className="inline-flex min-h-9 cursor-pointer items-center gap-2 whitespace-nowrap rounded-lg border border-current bg-red-500/10 px-3 text-[14px] font-bold text-red-700 transition-colors hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-red-400/10 dark:text-red-300 dark:hover:bg-red-400/20"
          >
            <FontAwesomeIcon icon={faUserMinus} aria-hidden="true" />
            Dar de baja
          </button>
        );
      },
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <section aria-label="Usuarios" className={`${CARD} flex flex-col gap-2.5`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className={`${labelClass} flex items-center gap-2`}>
            <FontAwesomeIcon icon={faUsers} aria-hidden="true" />
            Usuarios
            {cargando && <span className={`${subClass} normal-case tracking-normal`}>Cargando…</span>}
          </span>
          <button
            type="button"
            onClick={() => setNuevoAbierto(true)}
            className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border-0 bg-gradient-to-r from-teal-600 to-violet-600 px-[18px] py-1.5 text-[15px] font-bold text-white shadow-sm transition-colors hover:from-teal-700 hover:to-violet-700"
          >
            <FontAwesomeIcon icon={faUserPlus} aria-hidden="true" />
            Nuevo usuario
          </button>
        </div>

        <DataTable
          titulo="Usuarios"
          filas={filas}
          clave={(u) => u.usuario}
          columnas={columnas}
          minWidth={860}
          exportar="usuarios.csv"
          claseFila={(u) => (u.activo ? '' : 'opacity-60')}
        />

        {aviso.texto && (
          <span
            className={`text-sm font-medium ${
              aviso.error ? 'text-red-600 dark:text-red-400' : 'text-gray-600 dark:text-slate-300'
            }`}
          >
            {aviso.texto}
          </span>
        )}

        {filas.length > 0 && (
          <footer className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-gray-200 pt-3 text-[14px] font-medium text-gray-600 dark:border-slate-800 dark:text-slate-300">
            <span>
              <span className="font-bold tabular-nums text-gray-900 dark:text-white">{activos}</span>{' '}
              {activos === 1 ? 'activo' : 'activos'}
            </span>
            <span>
              <span className="font-bold tabular-nums text-gray-900 dark:text-white">{filas.length - activos}</span> de baja
            </span>
          </footer>
        )}
      </section>

      <NuevoUsuarioModal abierto={nuevoAbierto} onCerrar={cerrarNuevo} onCreado={recargar} />
    </div>
  );
}
