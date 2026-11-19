// Exportación a CSV (se abre directo en Excel: separador ";" y BOM UTF-8 para los acentos).
//
//   descargarCSV('ordenes.csv', filas, [
//     { titulo: 'Número', valor: (r) => r.numero },
//     { titulo: 'Total', valor: (r) => r.total },
//   ]);

const celda = (v) => {
  const s = v === null || v === undefined ? '' : String(v);
  return /[";\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export function descargarCSV(nombre, filas, columnas) {
  const lineas = [
    columnas.map((c) => celda(c.titulo)).join(';'),
    ...filas.map((r) => columnas.map((c) => celda(c.valor(r))).join(';')),
  ];
  const blob = new Blob(['﻿' + lineas.join('\r\n')], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nombre;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
