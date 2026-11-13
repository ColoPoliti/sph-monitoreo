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

Los valores por defecto están en `src/config/monitor.js`. Se pueden sobrescribir
con variables de entorno de Vite (crear `.env.local`):

```env
VITE_MQTT_URL=wss://mqtt.ejemplo.com
VITE_MQTT_USER=web_lectura
VITE_MQTT_PASS=admin.sph
VITE_BROKER_ETIQUETA=mqtt.ejemplo.com
VITE_API_BASE=/api
```

Además, en ese archivo se configuran:

- `SEGUNDOS_SIN_CONEXION`: segundos sin telemetría para considerar el PLC caído.
- `VENTANA_GRAFICO_S`: ventana del gráfico.
- `ESCALA_PESO`: `1` si el PLC manda kg, `0.001` si manda gramos.
- `VALVULA_COMO_PORCENTAJE`: interpreta el campo `estado` como porcentaje.
- `TOLERANCIA_PCT`: tolerancia para marcar un insumo como “Fuera”.
- `AREAS`: salas, PLCs, nombres de etapas y unidades especiales.

> El usuario MQTT debe ser de **solo lectura**. Cualquiera que abra la página puede
> ver estas credenciales.

## Producción (servidor propio)

Generar el build:

```bash
npm run build
```

Subir **el contenido de `dist/`** a la carpeta pública del servidor
(por ejemplo `public_html/`). El servidor debe cumplir dos condiciones:

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

Definí `VITE_API_BASE=https://api.ejemplo.com` **antes de compilar**. Pero la API
debe habilitar CORS para el dominio del frontend; hoy no lo hace, por eso el proxy
es la opción recomendada.

## Rutas

| Ruta | Vista |
| --- | --- |
| `/` | Monitor de la sala seleccionada |
| `/historial` | Historial con filtros |
| `/lotes/:id` | Etiqueta digital del lote |
| `/login` | Acceso (opcional, sin validación todavía) |

## Estructura

```
src/
  config/monitor.js        Configuración (MQTT, API, áreas, tolerancias)
  context/MonitorContext   Conexión MQTT y estado en vivo de las salas
  context/ThemeContext     Tema claro/oscuro
  lib/api.js               Cliente de lotes.php
  lib/format.js            Formatos de números, tiempos y fechas
  lib/rooms.js             Estado/etapa de cada sala
  components/              Layout, sidebar, top bar, status, tabla, gráfico
  pages/                   Dashboard (monitor), Historial, EtiquetaDigital, Login
```
