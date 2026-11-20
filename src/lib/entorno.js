// Configuración en tiempo de ejecución: lee /config.env al abrir la web.
//
// config.env (en public/, queda en la raíz de dist/) se edita directamente en el
// servidor: cambiar broker, API o credenciales NO requiere volver a compilar.
//
// Prioridad de cada valor:
//   1. config.env del servidor (si la clave tiene valor)
//   2. variable VITE_<CLAVE> grabada al compilar (.env.local / .env.production.local)
//   3. valor por defecto del código (los que ya funcionan en planta)
//
// Formato: CLAVE=valor por línea; "#" comenta; comillas opcionales; el prefijo VITE_ es opcional.

const valores = {};

function parsear(texto) {
  for (const linea of texto.split(/\r?\n/)) {
    const m = linea.match(/^\s*(?:VITE_)?([A-Z][A-Z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (!m) continue;
    let valor = m[2];
    if (/^(['"]).*\1$/.test(valor)) valor = valor.slice(1, -1);
    if (valor !== '') valores[m[1]] = valor;
  }
}

// Se llama UNA vez en main.jsx antes de cargar la aplicación.
// Si el archivo no está (o el servidor devuelve index.html en su lugar), se sigue con los valores compilados.
export async function cargarEntorno() {
  try {
    const r = await fetch(`${import.meta.env.BASE_URL}config.env`, { cache: 'no-store' });
    if (!r.ok || (r.headers.get('content-type') || '').includes('text/html')) return;
    parsear(await r.text());
  } catch {
    /* sin config.env: valores compilados */
  }
}

// env('MQTT_URL', 'ws://...') → config.env › VITE_MQTT_URL › porDefecto
export const env = (clave, porDefecto = '') =>
  valores[clave] ?? (import.meta.env[`VITE_${clave}`] || porDefecto);
