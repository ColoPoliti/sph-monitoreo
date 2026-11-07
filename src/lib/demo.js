// Modo demostración: simula la telemetría de los PLC sin conectarse al broker MQTT.
// Se activa abriendo la app con ?demo en la URL (ej: http://localhost:5173/?demo).
// Usa los mismos manejadores que los mensajes MQTT reales, así que todo el
// monitor (contadores, barras, receta, gráfico) se comporta igual que en producción.

export const DEMO =
  typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('demo');

// Receta de ejemplo (misma forma que publica Node-RED en AREA/SALA/receta).
// Etapas: 0 alcohol, 1 colorante (ml), 2 glicerina, 3 agua, 4 esencia, 5 etiqueta y agitado.
function recetaDemo(n) {
  return {
    ts: Date.now(),
    codigo_barra: String(7790000000000 + n),
    tolva: 3,
    producto: { nombre: 'Aromatizante Demo ' + n, sku: 'DEMO-' + String(n).padStart(3, '0') },
    insumos: [
      { etapa: 0, nombre: 'Alcohol', codigo_mp: 'MP-101', sp: 12 },
      { etapa: 1, nombre: 'Colorante', codigo_mp: 'MP-205', sp: 0.08 }, // 80 ml
      { etapa: 2, nombre: 'Glicerina', codigo_mp: 'MP-310', sp: 3.5 },
      { etapa: 3, nombre: 'Agua', codigo_mp: 'MP-001', sp: 18 },
      { etapa: 4, nombre: 'Esencia', codigo_mp: 'MP-412', sp: 1.2 },
    ],
  };
}

const rnd = (a, b) => a + Math.random() * (b - a);

/**
 * Arranca la simulación.
 * @param {(key: string, d: object) => void} producto  manejador de AREA/SALA/producto
 * @param {(key: string, d: object) => void} receta    manejador de AREA/SALA/receta
 * @returns {() => void} función para detenerla
 */
export function iniciarDemo({ producto, receta }) {
  const SALA = 'elaboracion/001'; // sala que dosifica
  const ESPERA = 'aerosoles/001'; // sala conectada pero en espera
  // elaboracion/002 y aerosoles/002 no publican: aparecen "Sin conexión"

  let ciclo = 1;
  let r = recetaDemo(ciclo);
  let etapa = 0;
  let peso = 0;
  let ticksFase = 0;

  receta(SALA, r);

  const tick = () => {
    ticksFase += 1;

    if (etapa <= 4) {
      // Dosificando: el peso sube rápido al principio y lento al acercarse al SP
      const ins = r.insumos[etapa];
      const sp = etapa === 1 ? ins.sp * 1000 : ins.sp;
      const falta = sp - peso;
      peso = Math.min(sp, peso + Math.max(falta * rnd(0.22, 0.32), sp * 0.01));
      const valvula = Math.round(Math.min(100, (falta / sp) * 140 + rnd(-4, 4)));
      producto(SALA, { etapa, estado: Math.max(0, valvula), peso, sp });

      if (sp - peso < sp * 0.004) {
        etapa += 1;
        peso = 0;
        ticksFase = 0;
      }
    } else if (etapa === 5) {
      // Etiqueta y agitado
      producto(SALA, { etapa: 5, estado: 0, peso: 0, sp: 0 });
      if (ticksFase >= 6) {
        etapa = 6;
        ticksFase = 0;
      }
    } else if (etapa === 6) {
      // Fin
      producto(SALA, { etapa: 6, estado: 0, peso: 0, sp: 0 });
      if (ticksFase >= 4) {
        etapa = 7;
        ticksFase = 0;
      }
    } else {
      // En espera y arranca un lote nuevo
      producto(SALA, { etapa: 0, estado: 0, peso: 0, sp: 0 });
      if (ticksFase >= 4) {
        ciclo += 1;
        r = recetaDemo(ciclo);
        receta(SALA, r);
        etapa = 0;
        peso = 0;
        ticksFase = 0;
      }
    }

    producto(ESPERA, { etapa: 0, estado: 0, peso: 0, sp: 0 });
  };

  tick();
  const id = setInterval(tick, 1000); // el PLC real publica cada 1 s
  return () => clearInterval(id);
}
