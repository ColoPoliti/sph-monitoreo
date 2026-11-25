# Monitor de salas · SPH

Monitor web de salas de elaboración. Muestra en vivo, por MQTT (WebSocket), la etapa,
el peso, la válvula y la receta de cada PLC, y consulta el historial de lotes a la API PHP.

Migrado desde la versión HTML + JS vanilla + PHP a **React 19 + Vite + Tailwind CSS**,
manteniendo la misma estructura visual y funcionalidad.

## Funcionalidad

- **Monitor por sala/PLC**: producto, código de barras, etapa, peso de balanza, SP,
  estado, válvula, peso cargado y avance por etapa.
- **Receta en curso**: estado de cada insumo, SP, cargado, faltante y avance.
- **Gráfico “Peso en el tiempo”** (ventana configurable, por defecto 60 s).
- **Últimas elaboraciones** del PLC seleccionado (se refresca cada 60 s).
- **Historial con filtros**: sector, PLC, rango de días y franja horaria (cruza medianoche).
- **Etiqueta digital de un lote**: tiempos, origen de datos y tolerancias por insumo.
- **Aprobación de Calidad**: con sesión de administrador se aprueba, rechaza (con comentario)
  o quita la decisión de cada lote. Se guarda en la base (MariaDB) a través de la API,
  así todas las PC ven lo mismo.
- **Estado de conexión**: broker MQTT y PLC en línea.
- **Tema claro/oscuro** persistido en `localStorage`.
- **Responsive y accesible**: menú lateral colapsable (drawer en móvil), foco visible,
  etiquetas ARIA, tablas semánticas y scroll horizontal en tablas.

## Requisitos

- Node.js 20+.
- Acceso al broker MQTT por WebSocket y a la API PHP de lotes (en la red de planta,
  por defecto `ws://10.200.1.243:9001` y `http://10.200.1.243:8080`).

## Desarrollo

```bash
npm install
npm run dev
```

Vite sirve la app en `http://localhost:5173` y redirige `/api` a la API PHP
(la API no envía cabeceras CORS, por eso se usa el proxy en desarrollo).

Otras tareas:

```bash
npm run lint
npm run build
npm run preview
```

## Configuración

Los parámetros del broker y de la API se gestionan con un archivo tipo `.env`,
con esta prioridad (gana el primero que tenga valor):

1. **`config.env`** en la raíz del sitio (`public/config.env` → `dist/config.env`).
   Se edita **en el servidor**, sin recompilar; se aplica al recargar la página (F5).
2. **`.env.local`** (variables `VITE_*`), grabadas al compilar. Uso en desarrollo
   (copiar `.env.example` como `.env.local`).
3. **Valores por defecto** de `src/config/monitor.js` (los de la instalación actual en planta).

| Clave | Por defecto | Para qué |
| --- | --- | --- |
| `MQTT_URL` | `ws://10.200.1.243:9001` | Broker MQTT por WebSocket (`wss://dominio/mqtt` si el sitio es HTTPS) |
| `MQTT_USER` / `MQTT_PASS` | `web_lectura` / (la actual) | Usuario MQTT de **solo lectura** |
| `BROKER_ETIQUETA` | `10.200.1.243` | Texto de la barra de estado |
| `API_BASE` | `/api` | Ruta (o URL) de la API PHP de lotes |
| `API_DESTINO` | `http://10.200.1.243:8080` | Solo `.env.local`: destino del proxy `/api` de Vite en desarrollo |

La lectura la hace `src/lib/entorno.js` antes de arrancar la app (`main.jsx`).
Si `config.env` no está en el servidor, la app funciona igual con los valores compilados.

En `src/config/monitor.js` (requieren recompilar) se configuran además:

- `SEGUNDOS_SIN_CONEXION`: segundos sin telemetría para considerar el PLC caído.
- `VENTANA_GRAFICO_S`: ventana del gráfico.
- `ESCALA_PESO`: `1` si el PLC manda kg, `0.001` si manda gramos.
- `VALVULA_COMO_PORCENTAJE`: interpreta el campo `estado` como porcentaje.
- `TOLERANCIA_PCT`: tolerancia para marcar un insumo como “Fuera”.
- `AREAS`: salas, PLCs, nombres de etapas y unidades especiales.

> `config.env` y el código compilado se descargan en el navegador: cualquiera que abra
> la página puede ver estos valores. El usuario MQTT debe ser de **solo lectura** y
> **no** se ponen usuarios ni contraseñas de Calidad (ni en `config.env` ni en `.env.local`).

## Usuarios y aprobación de Calidad

Los usuarios y contraseñas **no se configuran en la web**: están en la base de datos
(MariaDB) del servidor y los valida la API. Para crear un usuario o cambiar una contraseña
hay que hacerlo en la tabla de usuarios que usa `login.php` (consultar con quien administra
la API; si la clave se guarda con `password_hash()`, se genera con
`php -r "echo password_hash('LaClave', PASSWORD_DEFAULT);"`).

Perfiles:

| Rol | Puede |
| --- | --- |
| `admin` | Aprobar, rechazar y quitar la decisión |
| `usuario` | Solo consultar (switch deshabilitado) |
| sin sesión | Ver monitor e historial, sin switch |

La sesión viaja en una cookie `HttpOnly` (`SPHSESION`) que pone el servidor; vence a las
8 h sin uso y al cerrar el navegador. Si cualquier llamada devuelve 401, la web vuelve a
"sin sesión". Después de 5 intentos fallidos el usuario queda bloqueado 5 minutos.

Endpoints que usa la web (todos bajo `/api`, respuestas JSON; en los errores
`{ "ok": false, "error": "..." }`, que se muestra tal cual):

| Método y ruta | Para qué | Código en la web |
| --- | --- | --- |
| `POST /api/login.php` `{ usuario, clave }` | Iniciar sesión | `src/lib/auth.js` |
| `GET /api/sesion.php` | Saber si hay sesión y con qué rol (al abrir la página) | `src/lib/auth.js` |
| `POST /api/logout.php` | Cerrar sesión | `src/lib/auth.js` |
| `POST /api/calidad.php` `{ id, decision, comentario }` | Aprobar o rechazar | `src/lib/aprobaciones.js` |
| `DELETE /api/calidad.php?id=N` | Quitar aprobación o rechazo | `src/lib/aprobaciones.js` |
| `GET /api/lotes.php` | Listado y detalle; trae `estado`, `estado_original` y `calidad` | `src/lib/api.js` |

Todos los POST llevan `Content-Type: application/json` (sin él la API responde 415).
Los cambios de estado los controla el servidor: rechazar un lote aprobado o volver a
rechazar uno rechazado devuelve 409 (primero hay que quitar la decisión).

## Producción (servidor propio)

Generar el build:

```bash
npm run build
```

### Servidor del cliente (Docker, 10.200.1.243)

Subir al servidor, en `infra/monitor`: `src`, `public`, `index.html`, `package.json`,
`package-lock.json` y los `*.config.js`. **No** subir `node_modules`, `dist` ni `.git`, y
**no** pisar `Dockerfile` ni `nginx.conf` del servidor (`nginx.conf` tiene las rutas
`/api` y `/mqtt`). Revisar `config.env` en el servidor y compilar con:

```bash
docker compose up -d --build monitor
```

Prueba final: login con el usuario admin de la base, aprobar, rechazar con comentario,
quitar, y ver la misma decisión desde otra PC.

### Otro servidor (dist/)

Subir **el contenido de `dist/`** a la carpeta pública del servidor
(por ejemplo `public_html/`). Incluye `config.env`: ajustar ahí broker y API
(en una actualización, conservar el `config.env` que ya está en el servidor). El servidor debe cumplir dos condiciones:

1. **Fallback de rutas**: devolver `index.html` cuando la ruta no sea un archivo,
   para que `/historial` y `/lotes/13` funcionen al recargar.
2. **Proxy de `/api`**: redirigir `/api/*` a `https://api.ejemplo.com/*`.
   Es necesario porque la API PHP no envía cabeceras CORS.

### Nginx

```nginx
server {
    listen 80;
    server_name monitor.ejemplo.com;

    root /var/www/sph;
    index index.html;

    location /api/ {
        proxy_pass https://api.ejemplo.com/;
        proxy_ssl_server_name on;
        proxy_set_header Host api.ejemplo.com;
    }

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

### Apache

Con `mod_rewrite` y `mod_proxy` habilitados, en `.htaccess`:

```apache
RewriteEngine On

# Proxy hacia la API PHP
RewriteRule ^api/(.*)$ https://api.ejemplo.com/$1 [P,L]

# Fallback de la SPA
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^ index.html [L]
```

### Si la API está en el mismo dominio

Si servís el frontend y la API bajo el mismo dominio y `/api` ya apunta al PHP,
no hace falta el proxy: el valor por defecto `API_BASE=/api` funciona directo.

### Si no podés usar proxy

Definí `API_BASE=https://api.ejemplo.com` en `config.env` (o `VITE_API_BASE` antes de compilar). Pero la API
debe habilitar CORS para el dominio del frontend; hoy no lo hace, por eso el proxy
es la opción recomendada.

## Rutas

| Ruta | Vista |
| --- | --- |
| `/` | Monitor de la sala seleccionada |
| `/historial` | Historial con filtros |
| `/lotes/:id` | Etiqueta digital del lote |
| `/login` | Pantalla de acceso vieja (el login de Calidad es el modal "Aprobación calidad" del navbar) |

## Estructura

```
src/
  config/monitor.js        Configuración (MQTT, API, áreas, tolerancias)
  lib/entorno.js           Lee config.env al arrancar (prioridad sobre .env.local)
  context/MonitorContext   Conexión MQTT y estado en vivo de las salas
  context/ThemeContext     Tema claro/oscuro
  lib/api.js               Pedidos a la API (lotes.php y función común con manejo de errores)
  lib/auth.js              Sesión de Calidad (login.php, sesion.php, logout.php)
  lib/aprobaciones.js      Decisiones de Calidad (calidad.php)
  lib/useAprobacionCalidad Switch de aprobación en tablas y etiqueta digital
  lib/format.js            Formatos de números, tiempos y fechas
  lib/rooms.js             Estado/etapa de cada sala
  components/              Layout, sidebar, top bar, status, tabla, gráfico
  pages/                   Dashboard (monitor), Historial, EtiquetaDigital, Login
```
