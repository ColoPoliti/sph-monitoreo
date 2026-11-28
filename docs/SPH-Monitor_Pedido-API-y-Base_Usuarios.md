# SPH Monitoreo - Pedido: usuarios y superadministrador

**Para:** quien administra la base de datos (MariaDB) y quien arma la API (PHP).

**Objetivo:** que el superadministrador, desde la web, pueda dar de alta, dar de baja, reactivar y cambiar el rol de los usuarios. La web ya está terminada y probada con datos simulados: falta solo lo que se detalla acá.

Se parte de lo que ya se hizo con el pedido anterior "Aprobación de Calidad" (25/11/2026): tablas `usuarios`, `aprobaciones_calidad` y `aprobaciones_historial`, y `login.php`, `sesion.php`, `logout.php`, `calidad.php` y `lotes.php`.

## Roles que maneja la web

| Rol | Qué puede hacer |
| --- | --- |
| `superadmin` | Todo lo del admin, y además administrar usuarios (alta, baja, reactivar, cambiar rol). |
| `admin` | Aprobar y rechazar lotes de Calidad, y quitar la decisión. |
| `usuario` | Solo consultar. |

---

## Parte 1 - Base de datos (MariaDB)

### 1. Tabla `usuarios`: qué cambia

La tabla ya existe con `id`, `usuario`, `nombre`, `clave_hash`, `rol`, `activo` y `creado`. Esas columnas quedan como están; solo hay que cambiar una y agregar dos:

| Columna | Cambio | Para qué |
| --- | --- | --- |
| `rol` | `ENUM('superadmin','admin','usuario') NOT NULL` | Agregar el valor `'superadmin'`. Hoy es `ENUM('admin','usuario')`. |
| `creado_por_id` | NUEVA: `INT NULL`, FK a `usuarios(id)` | Qué superadmin creó el usuario (igual que `aprobaciones_calidad.usuario_id`). |
| `ultimo_acceso` | NUEVA: `DATETIME NULL` | Fecha y hora del último login. |

### 2. SQL del cambio

```sql
ALTER TABLE usuarios
  MODIFY rol ENUM('superadmin','admin','usuario') NOT NULL,
  ADD COLUMN creado_por_id INT NULL,
  ADD COLUMN ultimo_acceso DATETIME NULL,
  ADD FOREIGN KEY (creado_por_id) REFERENCES usuarios(id);
```

Verificar que la columna `usuario` no distinga mayúsculas: en `SHOW FULL COLUMNS FROM usuarios`, su `Collation` tiene que terminar en `_ci` (así "Juan" y "juan" cuentan como el mismo usuario).

### 3. Designar el superadministrador

Sin al menos un superadmin nadie puede administrar usuarios desde la web. Lo más simple es subir al admin que ya existe:

```sql
UPDATE usuarios SET rol = 'superadmin' WHERE usuario = 'admin';
```

O, si prefieren uno aparte, generar el hash de la clave y crearlo:

```bash
php -r "echo password_hash('CLAVE_ELEGIDA', PASSWORD_DEFAULT);"
```

```sql
INSERT INTO usuarios (usuario, nombre, clave_hash, rol)
VALUES ('super', 'Responsable de sistemas', '<hash generado arriba>', 'superadmin');
```

### 4. Dos reglas de la base

- Fechas (`ultimo_acceso`, `creado`) en **hora de Argentina**, igual que ya se corrigió en la fecha de aprobación de Calidad. La web las muestra tal cual vienen.
- **Nunca borrar usuarios** (no usar `DELETE`). La baja es solo `activo = 0`. La FK de `aprobaciones_calidad.usuario_id` ya impide borrar a quien aprobó o rechazó lotes.

---

## Parte 2 - API (PHP)

**Reglas generales** (las mismas que ya usan):

- Respuestas en JSON. En los errores: el código HTTP que corresponda y `{ "ok": false, "error": "texto" }`. La web muestra ese texto tal cual al usuario: tiene que estar en español y ser entendible.
- Sesión con la cookie `SPHSESION` que ya usan. Pedidos con `Content-Type: application/json`.
- Consultas preparadas (nunca concatenar SQL).

### 5. `login.php` - cambios

`POST /login.php` `{ usuario, clave }`

Ya hace: buscar solo usuarios activos, validar con `password_verify()` y devolver usuario, nombre y rol. Falta:

- Si entra bien: `UPDATE usuarios SET ultimo_acceso = NOW() WHERE id = <id del usuario>`.
- Que acepte y devuelva el rol `superadmin` (revisar que no haya una lista fija que solo admita `admin` y `usuario`).

### 6. `sesion.php` - cambios

`GET /sesion.php`

Hoy devuelve el rol que se guardó en la sesión al hacer login. Falta:

- Releer el usuario de la base en **cada** llamada, por el `id` guardado en la sesión: `SELECT usuario, nombre, rol, activo FROM usuarios WHERE id = ?`.
- Si fue dado de baja (`activo = 0`): responder 401 y cerrar la sesión (`session_destroy`).
- Si le cambiaron el rol: devolver el rol nuevo y actualizarlo en la sesión. Así los cambios se aplican enseguida, sin esperar a que venza la sesión.

Lo mismo vale para `calidad.php` y `usuarios.php`: tomar el rol de la base (no el guardado en la sesión) para que a un usuario dado de baja o con el rol cambiado no le sigan funcionando los permisos viejos.

### 7. `calidad.php` - cambio

`POST / DELETE /calidad.php`

- Hoy aceptan solo el rol `admin`. Tienen que aceptar `admin` y `superadmin`. El rol `usuario` sigue con 403.
- Nada más cambia: las validaciones, `aprobaciones_historial` y `lotes.php` quedan como están.

### 8. `usuarios.php` - archivo nuevo

Para todos los métodos:

| Caso | Código | Error |
| --- | --- | --- |
| Sin sesión | 401 | Sesión no iniciada |
| La sesión no es superadmin | 403 | No tenés permiso para administrar usuarios |
| Otro método (no GET/POST/PUT/DELETE) | 405 | Método no permitido |

"Uno mismo" se compara por el `id` guardado en la sesión.

#### `GET /usuarios.php` (lista)

Devuelve **todos** los usuarios, también los dados de baja. Nunca devolver `clave_hash` ni `id`. `creado_por` es el nombre de usuario de quien lo creó (JOIN por `creado_por_id`):

```sql
SELECT u.usuario, u.nombre, u.rol, u.activo, u.creado,
       c.usuario AS creado_por, u.ultimo_acceso
FROM usuarios u
LEFT JOIN usuarios c ON c.id = u.creado_por_id;
```

Respuesta (fechas `AAAA-MM-DD HH:MM:SS`, hora de Argentina):

```json
[
  { "usuario": "admin", "nombre": "Calidad", "rol": "superadmin",
    "activo": 1, "creado": "2026-11-25 09:00:00", "creado_por": null,
    "ultimo_acceso": "2026-11-28 08:12:00" },
  { "usuario": "calidad1", "nombre": "Laura Gómez", "rol": "admin",
    "activo": 1, "creado": "2026-11-28 10:20:00", "creado_por": "admin",
    "ultimo_acceso": null }
]
```

#### `POST /usuarios.php` `{ usuario, nombre, rol, clave }` (alta)

Al guardar: `clave_hash = password_hash(clave, PASSWORD_DEFAULT)`, `activo = 1`, `creado = NOW()`, `creado_por_id` = id del superadmin de la sesión. `nombre` es opcional. Responde `{ "ok": true }`. Validaciones:

| Caso | Código | Error |
| --- | --- | --- |
| `usuario` no cumple `^[A-Za-z0-9._-]{3,50}$` | 400 | Usuario inválido |
| `rol` distinto de superadmin/admin/usuario | 400 | Rol inválido |
| `clave` de menos de 8 caracteres | 400 | La contraseña debe tener al menos 8 caracteres |
| Ya existe (aunque esté de baja o con otras mayúsculas) | 409 | El usuario ya existe |

#### `DELETE /usuarios.php?usuario=X` (baja)

`UPDATE usuarios SET activo = 0 WHERE usuario = X`. Responde `{ "ok": true }`.

| Caso | Código | Error |
| --- | --- | --- |
| No existe | 404 | El usuario no existe |
| Es el mismo usuario logueado | 409 | No podés darte de baja a vos mismo |
| Es el último superadmin activo | 409 | No se puede dar de baja al último superadministrador |

#### `PUT /usuarios.php?usuario=X` `{ "activo": 1 }` (reactivar)

`UPDATE usuarios SET activo = 1`. Vuelve con su clave y su rol de antes. Responde `{ "ok": true }`.

| Caso | Código | Error |
| --- | --- | --- |
| No existe | 404 | El usuario no existe |
| Ya está activo | 409 | El usuario ya está activo |

#### `PUT /usuarios.php?usuario=X` `{ "rol": "admin" }` (cambiar rol)

`UPDATE usuarios SET rol = <rol nuevo>`. Responde `{ "ok": true }`.

| Caso | Código | Error |
| --- | --- | --- |
| No existe | 404 | El usuario no existe |
| `rol` distinto de superadmin/admin/usuario | 400 | Rol inválido |
| Es el mismo usuario logueado | 409 | No podés cambiar tu propio rol |
| Está dado de baja | 409 | El usuario está dado de baja: reactivalo primero |
| Es el último superadmin activo y el rol nuevo no es superadmin | 409 | No se puede quitar el rol al último superadministrador |

---

## Parte 3 - Prueba final

Con todo cargado, verificar en la web (no hay que tocar nada en la web):

- [ ] Ingresar con el superadmin desde "Aprobación calidad". En el menú de sesión aparece "Usuarios" y muestra la lista.
- [ ] Crear un usuario admin de prueba. Cerrar sesión y entrar con él: puede aprobar lotes y NO ve "Usuarios".
- [ ] Volver como superadmin y cambiarle el rol a usuario. Él, sin volver a ingresar, deja de poder aprobar (al recargar la página).
- [ ] Darlo de baja: ya no puede ingresar. Reactivarlo: vuelve a ingresar con su misma clave.
- [ ] Intentar darse de baja o cambiarse el rol a uno mismo: la web no lo permite y la API responde 409.
