import { useSyncExternalStore } from 'react';
import { CONFIG } from '../config/monitor';
import { fmt } from '../lib/format';
import { enEspera, unidadEtapa } from '../lib/rooms';

const X0 = 90;
const Y0 = 20;
const Y1 = 180;

// Mobile (< 640 px, breakpoint sm de Tailwind): el gráfico usa un lienzo más angosto,
// así a lo ancho de la pantalla queda mucho más alto y legible.
const MQ_MOBILE = '(max-width: 639px)';
const suscribir = (cb) => {
  const mq = window.matchMedia(MQ_MOBILE);
  mq.addEventListener('change', cb);
  return () => mq.removeEventListener('change', cb);
};
const esMobile = () => window.matchMedia(MQ_MOBILE).matches;

export default function PesoChart({ room, now }) {
  const mobile = useSyncExternalStore(suscribir, esMobile, () => false);
  const W = mobile ? 480 : 1300; // ancho del lienzo (el alto es siempre 230)
  const X1 = W - 10;
  const fs = mobile ? 15 : 13; // tamaño de los textos de los ejes
  const fsLeyenda = mobile ? 16 : 14;
  const ventana = CONFIG.VENTANA_GRAFICO_S * 1000;
  const desde = now - ventana;
  const pts = room.serie.filter((p) => now - p.t <= ventana);

  let ymax = 1;
  let ymin = 0;
  pts.forEach((p) => {
    ymax = Math.max(ymax, p.peso, p.sp);
    ymin = Math.min(ymin, p.peso);
  });
  ymax *= 1.15;
  ymin = ymin < 0 ? ymin * 1.15 : 0;

  const yDe = (v) => Y1 - ((v - ymin) / (ymax - ymin)) * (Y1 - Y0);
  const xDe = (t) => X0 + ((t - desde) / ventana) * (X1 - X0);

  const trazo = (clave, esSp) => {
    const lista = pts.filter((p) => !esSp || p.sp > 0);
    if (lista.length < 2) return null;
    const d = lista
      .map(
        (p, i) =>
          (i ? 'L' : 'M') + xDe(p.t).toFixed(1) + ' ' + yDe(p[clave]).toFixed(1),
      )
      .join(' ');

    return (
      <path
        d={d}
        fill="none"
        strokeWidth="2.5"
        className={esSp ? 'stroke-violet-600 dark:stroke-violet-400' : 'stroke-teal-600 dark:stroke-teal-400'}
        strokeDasharray={esSp ? '9 6' : undefined}
      />
    );
  };

  const unidad =
    room.etapa !== null && !enEspera(room) ? unidadEtapa(room, room.etapa) : 'kg';

  const texto = (x, y, contenido, extra = {}) => (
    <text
      x={x}
      y={y}
      textAnchor={extra.anchor || 'middle'}
      fontSize={extra.fontSize || fs}
      className="fill-gray-500 dark:fill-slate-400"
      fontFamily="inherit"
      transform={extra.transform}
    >
      {contenido}
    </text>
  );

  return (
    <svg
      viewBox={`0 0 ${W} 230`}
      role="img"
      aria-label="Gráfico del peso y del SP en el tiempo"
      className="block h-auto w-full"
    >
      <rect x={X0} y={10} width={X1 - X0} height={180} rx="4" className="fill-gray-50 dark:fill-slate-950" />

      {Array.from({ length: 5 }, (_, i) => {
        const v = ymax - (i * (ymax - ymin)) / 4;
        const y = Y0 + (i * (Y1 - Y0)) / 4;
        return (
          <g key={`y-${i}`}>
            <line
              x1={X0}
              y1={y}
              x2={X1}
              y2={y}
              className="stroke-gray-200 dark:stroke-slate-700"
              strokeWidth="1"
            />
            {texto(80, y + 5, fmt(v, ymax - ymin >= 10 ? 0 : 1), { anchor: 'end' })}
          </g>
        );
      })}

      {Array.from({ length: 10 }, (_, i) => {
        const k = i + 1;
        const x = X0 + (k * (X1 - X0)) / 10;
        return (
          <g key={`x-${k}`}>
            <line
              x1={x}
              y1={10}
              x2={x}
              y2={190}
              className="stroke-gray-200 dark:stroke-slate-700"
              strokeWidth="1"
            />
            {texto(
              x,
              208,
              String(Math.round((-(10 - k) * CONFIG.VENTANA_GRAFICO_S) / 10)),
            )}
          </g>
        );
      })}

      {trazo('sp', true)}
      {trazo('peso', false)}

      <line
        x1="118"
        y1="38"
        x2="152"
        y2="38"
        strokeWidth="3"
        className="stroke-teal-600 dark:stroke-teal-400"
      />
      {texto(164, 43, 'peso', { anchor: 'start', fontSize: fsLeyenda })}
      <line
        x1="118"
        y1="62"
        x2="152"
        y2="62"
        strokeWidth="3"
        strokeDasharray="9 6"
        className="stroke-violet-600 dark:stroke-violet-400"
      />
      {texto(164, 67, 'SP', { anchor: 'start', fontSize: fsLeyenda })}
      {texto((X0 + X1) / 2, 226, 'tiempo (s)', { fontSize: fsLeyenda })}
      {texto(18, 100, `peso (${unidad})`, {
        fontSize: fsLeyenda,
        transform: 'rotate(-90 18 100)',
      })}
    </svg>
  );
}
