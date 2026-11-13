// Genera y descarga la receta de un lote en PDF (etiqueta digital).
// Las librerías se cargan recién al hacer clic, para no agrandar la carga inicial.
import { CONFIG, areaDe } from '../config/monitor';
import { codigoMP, fechaCorta, fmt, mmss, num, signo } from './format';

export async function descargarRecetaPdf(lote, etapas = []) {
  const [{ jsPDF }, { default: autoTable }] = await Promise.all([
    import('jspdf'),
    import('jspdf-autotable'),
  ]);

  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const area = areaDe(lote.area);
  const x = 14;

  // Encabezado
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text(String(lote.nombre_producto || 'Receta'), x, 20);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(
    `${area ? area.label : lote.area} ${lote.sala} · Lote #${lote.id} · Tolva ${
      lote.tolva === null ? '-' : lote.tolva
    }`,
    x,
    27,
  );

  // Datos del lote
  const datos = [
    ['Código de barras', String(lote.codigo_barra ?? '—')],
    [
      'Estado',
      lote.estado === 'aprobado'
        ? `Aprobado por calidad${lote.calidad?.usuario ? ` (${lote.calidad.usuario})` : ''}`
        : lote.estado === 'rechazado'
          ? `Rechazado por calidad${lote.calidad?.usuario ? ` (${lote.calidad.usuario})` : ''}`
          : lote.estado === 'completa'
          ? 'Completa'
          : 'Incompleta',
    ],
    ['Inicio', lote.inicio ? fechaCorta(lote.inicio) : '—'],
    ['Fin', lote.fin ? fechaCorta(lote.fin) : '—'],
    ['Tiempo total', mmss(lote.tiempo_total_s)],
    ['Origen de los valores', lote.fuente === 'plc' ? 'Etiqueta del PLC' : 'Telemetría'],
  ];
  if (lote.calidad?.comentario) datos.push(['Comentario de calidad', lote.calidad.comentario]);

  autoTable(doc, {
    startY: 33,
    body: datos,
    theme: 'plain',
    styles: { fontSize: 10, cellPadding: 1.5 },
    columnStyles: { 0: { fontStyle: 'bold', textColor: 90, cellWidth: 45 } },
    margin: { left: x },
  });

  // Receta y elaboración
  const filas = etapas.map((e) => {
    const sp = num(e.sp);
    const cargado = num(e.cargado);
    const dif = num(e.diferencia);
    const pct = num(e.diferencia_pct);
    const u = e.unidad || 'kg';
    const fuera = pct !== null && Math.abs(pct) > CONFIG.TOLERANCIA_PCT;
    const insumo = (e.insumo || e.etapa_clave || '') + (e.codigo_mp ? `\n${codigoMP(e.codigo_mp)}` : '');

    return [
      insumo,
      sp === null ? '—' : `${fmt(sp)} ${u}`,
      cargado === null ? '—' : `${fmt(cargado)} ${u}`,
      dif === null ? '—' : `${signo(dif)} ${u}`,
      pct === null ? '—' : `${signo(pct)} %`,
      mmss(e.duracion_s),
      sp === null || pct === null ? '—' : fuera ? 'Fuera' : 'OK',
    ];
  });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(0);
  const yTitulo = doc.lastAutoTable.finalY + 8;
  doc.text('Receta y elaboración', x, yTitulo);

  autoTable(doc, {
    startY: yTitulo + 3,
    head: [['Insumo', 'SP', 'Cargado', 'Diferencia', 'Dif. %', 'Duración', 'Tolerancia']],
    body: filas,
    styles: { fontSize: 9, cellPadding: 2 },
    headStyles: { fillColor: [13, 148, 136] }, // teal-600, el verde de la app
    columnStyles: {
      1: { halign: 'right' },
      2: { halign: 'right', fontStyle: 'bold' },
      3: { halign: 'right' },
      4: { halign: 'right' },
      5: { halign: 'right' },
      6: { halign: 'center' },
    },
    didParseCell: (d) => {
      if (d.section === 'body' && d.column.index === 6) {
        if (d.cell.raw === 'Fuera') d.cell.styles.textColor = [185, 28, 28];
        if (d.cell.raw === 'OK') d.cell.styles.textColor = [4, 120, 87];
      }
    },
    margin: { left: x, right: x },
  });

  // Notas
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100);
  const notas = [
    'Diferencia = cargado - SP.',
    `"Fuera" marca los insumos con una diferencia mayor a ${String(CONFIG.TOLERANCIA_PCT).replace('.', ',')} %.`,
    'Colorante en ml; el resto en kg.',
  ];
  let y = doc.lastAutoTable.finalY + 7;
  notas.forEach((n) => {
    doc.text(n, x, y);
    y += 5;
  });

  doc.save(`receta-lote-${lote.id}.pdf`);
}
