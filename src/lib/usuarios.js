// Administración de usuarios (solo superadministrador), contra /api/usuarios.php.
// El servidor controla todo: que la sesión sea superadmin (403 si no), que el usuario no exista (409),
// que no se dé de baja a sí mismo ni al último superadmin, y guarda la clave con password_hash().
// La baja es lógica (activo = 0): el usuario no se borra, así el historial de Calidad conserva quién decidió.

import { pedir } from './api';
import { conSesion } from './aprobaciones';

/**
 * GET /api/usuarios.php
 * Devuelve [{ usuario, nombre, rol, activo, creado, creado_por, ultimo_acceso }] (sin la clave).
 * "creado" es la columna de la tabla usuarios; también se acepta "creado_en".
 * Acepta la lista sola o envuelta en { usuarios: [...] }.
 */
export async function getUsuarios() {
  const data = await conSesion(pedir('/usuarios.php'));
  const lista = Array.isArray(data) ? data : data?.usuarios || [];
  return lista.map((u) => ({
    ...u,
    activo: u.activo === undefined ? true : Boolean(Number(u.activo)),
    creado_en: u.creado_en ?? u.creado ?? null,
  }));
}

/** POST /api/usuarios.php { usuario, nombre, rol, clave }: crea el usuario. */
export async function crearUsuario({ usuario, nombre, rol, clave }) {
  return conSesion(
    pedir('/usuarios.php', {
      method: 'POST',
      cuerpo: { usuario: usuario.trim(), nombre: (nombre || '').trim(), rol, clave },
    }),
  );
}

/** DELETE /api/usuarios.php?usuario=X: baja lógica (queda inactivo, no puede ingresar). */
export async function bajaUsuario(usuario) {
  return conSesion(pedir('/usuarios.php?usuario=' + encodeURIComponent(usuario), { method: 'DELETE' }));
}

// PUT /api/usuarios.php?usuario=X con { activo: 1 } (reactivar) o { rol } (cambiar el rol).
// El servidor no deja cambiarse el rol a uno mismo ni quitarle el rol al último superadmin (409).
const modificarUsuario = (usuario, cambios) =>
  conSesion(
    pedir('/usuarios.php?usuario=' + encodeURIComponent(usuario), { method: 'PUT', cuerpo: cambios }),
  );

/** Vuelve a habilitar un usuario dado de baja (puede ingresar de nuevo, con su clave y su rol de antes). */
export const reactivarUsuario = (usuario) => modificarUsuario(usuario, { activo: 1 });

/** Cambia el rol: 'superadmin' | 'admin' | 'usuario'. */
export const cambiarRolUsuario = (usuario, rol) => modificarUsuario(usuario, { rol });
