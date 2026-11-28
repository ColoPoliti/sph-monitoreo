// Modo demostración (?demo): API simulada para el login y la administración de usuarios,
// para mostrar la pantalla de Usuarios sin servidor. Responde igual que la API real
// (mismos códigos y el mismo formato de error { ok: false, error }).
// Los datos viven en sessionStorage: se mantienen al recargar y se pierden al cerrar la pestaña.
// El resto de la API (lotes, calidad) sigue yendo al servidor real.

// Usuarios de ejemplo. Clave de todos: demo1234
export const CLAVE_DEMO = 'demo1234';
const INICIALES = [
  { usuario: 'super', nombre: 'Responsable de sistemas', rol: 'superadmin', activo: true, creado_en: '2026-10-01 09:00:00', creado_por: null, ultimo_acceso: '2026-11-26 08:12:00' },
  { usuario: 'calidad1', nombre: 'Laura Gómez', rol: 'admin', activo: true, creado_en: '2026-10-03 11:20:00', creado_por: 'super', ultimo_acceso: '2026-11-25 17:45:00' },
  { usuario: 'calidad2', nombre: 'Martín Sosa', rol: 'admin', activo: true, creado_en: '2026-10-20 14:02:00', creado_por: 'super', ultimo_acceso: '2026-11-24 10:30:00' },
  { usuario: 'operario1', nombre: 'Juan Pérez', rol: 'usuario', activo: true, creado_en: '2026-10-15 08:05:00', creado_por: 'super', ultimo_acceso: null },
  { usuario: 'calidad_ant', nombre: 'Ex supervisor de Calidad', rol: 'admin', activo: false, creado_en: '2026-09-01 10:00:00', creado_por: 'super', ultimo_acceso: '2026-09-30 16:00:00' },
];

const K_USUARIOS = 'sph-demo-usuarios';
const K_SESION = 'sph-demo-sesion';

const leer = (k, def) => {
  try {
    const v = sessionStorage.getItem(k);
    return v ? JSON.parse(v) : def;
  } catch {
    return def;
  }
};
const guardar = (k, v) => {
  try {
    if (v === null) sessionStorage.removeItem(k);
    else sessionStorage.setItem(k, JSON.stringify(v));
  } catch {
    /* sin sessionStorage: queda solo en memoria hasta recargar */
  }
};

let usuarios = leer(K_USUARIOS, INICIALES);
let sesion = leer(K_SESION, null); // usuario logueado

const ahora = () => new Date().toLocaleString('sv-SE').slice(0, 19);
const falla = (status, error) => {
  const err = new Error(error);
  err.status = status;
  throw err;
};
const publico = (u) => ({ usuario: u.usuario, nombre: u.nombre, rol: u.rol });
const actual = () => usuarios.find((u) => u.usuario === sesion && u.activo);

// Rutas que atiende la demo (el resto va a la API real)
export const esRutaDemo = (path) => /^\/(login|sesion|logout|usuarios)\.php/.test(path);

/** Responde como la API real. path: '/usuarios.php?usuario=x', cuerpo: objeto JSON. */
export async function respuestaDemo(path, method, cuerpo) {
  await new Promise((r) => setTimeout(r, 250)); // demora de red, para ver el "Ingresando…"
  const [ruta, qs] = path.split('?');
  const params = new URLSearchParams(qs || '');

  if (ruta === '/login.php') {
    const u = usuarios.find((x) => x.usuario === String(cuerpo?.usuario || '').trim());
    if (!u || !u.activo || cuerpo?.clave !== CLAVE_DEMO) falla(401, 'Usuario o contraseña incorrectos');
    u.ultimo_acceso = ahora();
    sesion = u.usuario;
    guardar(K_USUARIOS, usuarios);
    guardar(K_SESION, sesion);
    return { ok: true, ...publico(u) };
  }

  if (ruta === '/logout.php') {
    sesion = null;
    guardar(K_SESION, null);
    return { ok: true };
  }

  const yo = actual();
  if (!yo) falla(401, 'Sin sesión');

  if (ruta === '/sesion.php') return { ok: true, ...publico(yo) };

  // /usuarios.php: solo superadministrador
  if (yo.rol !== 'superadmin') falla(403, 'No tenés permiso para administrar usuarios');

  if (method === 'GET') return usuarios;

  if (method === 'POST') {
    const usuario = String(cuerpo?.usuario || '').trim();
    if (!/^[A-Za-z0-9._-]{3,50}$/.test(usuario)) falla(400, 'Usuario inválido');
    if (!['superadmin', 'admin', 'usuario'].includes(cuerpo?.rol)) falla(400, 'Rol inválido');
    if (String(cuerpo?.clave || '').length < 8) falla(400, 'La contraseña debe tener al menos 8 caracteres');
    if (usuarios.some((u) => u.usuario.toLowerCase() === usuario.toLowerCase())) falla(409, 'El usuario ya existe');
    usuarios = [
      ...usuarios,
      { usuario, nombre: cuerpo.nombre || '', rol: cuerpo.rol, activo: true, creado_en: ahora(), creado_por: yo.usuario, ultimo_acceso: null },
    ];
    guardar(K_USUARIOS, usuarios);
    return { ok: true };
  }

  if (method === 'DELETE') {
    const objetivo = usuarios.find((u) => u.usuario === params.get('usuario'));
    if (!objetivo) falla(404, 'El usuario no existe');
    if (objetivo.usuario === yo.usuario) falla(409, 'No podés darte de baja a vos mismo');
    const superActivos = usuarios.filter((u) => u.rol === 'superadmin' && u.activo);
    if (objetivo.rol === 'superadmin' && superActivos.length <= 1) falla(409, 'No se puede dar de baja al último superadministrador');
    usuarios = usuarios.map((u) => (u === objetivo ? { ...u, activo: false } : u));
    guardar(K_USUARIOS, usuarios);
    return { ok: true };
  }

  // PUT ?usuario=X { activo: 1 } -> reactivar · { rol } -> cambiar el rol
  if (method === 'PUT') {
    const objetivo = usuarios.find((u) => u.usuario === params.get('usuario'));
    if (!objetivo) falla(404, 'El usuario no existe');
    const cambios = {};

    if (cuerpo?.activo !== undefined) {
      if (Number(cuerpo.activo) !== 1) falla(400, 'Para dar de baja usá la opción "Dar de baja"');
      if (objetivo.activo) falla(409, 'El usuario ya está activo');
      cambios.activo = true;
    }

    if (cuerpo?.rol !== undefined) {
      if (!['superadmin', 'admin', 'usuario'].includes(cuerpo.rol)) falla(400, 'Rol inválido');
      if (objetivo.usuario === yo.usuario) falla(409, 'No podés cambiar tu propio rol');
      if (!objetivo.activo && !cambios.activo) falla(409, 'El usuario está dado de baja: reactivalo primero');
      const superActivos = usuarios.filter((u) => u.rol === 'superadmin' && u.activo);
      if (objetivo.rol === 'superadmin' && cuerpo.rol !== 'superadmin' && objetivo.activo && superActivos.length <= 1) {
        falla(409, 'No se puede quitar el rol al último superadministrador');
      }
      cambios.rol = cuerpo.rol;
    }

    if (!Object.keys(cambios).length) falla(400, 'No hay cambios para guardar');
    usuarios = usuarios.map((u) => (u === objetivo ? { ...u, ...cambios } : u));
    guardar(K_USUARIOS, usuarios);
    return { ok: true };
  }

  falla(405, 'Método no permitido');
}
