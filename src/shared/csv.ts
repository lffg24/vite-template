// src/shared/csv.ts
//
// Exportar a CSV sin abrirle la puerta a nadie.
//
// Vive en el núcleo porque cada listado que se exporta —avance, matriz,
// constancias— manda la nómina de una empresa a una hoja de cálculo, y la
// protección contra fórmulas tiene que ser la misma en todos. Una copia por
// pantalla es una copia que alguien olvida actualizar.

/**
 * Caracteres con los que Excel, LibreOffice y Sheets empiezan a leer una FÓRMULA.
 *
 * Entrecomillar no basta: la hoja de cálculo quita las comillas al abrir el CSV
 * y evalúa lo que queda. Un cargo escrito como `=HYPERLINK("http://…"&A1)` se
 * convierte en una petición que saca la cédula de un compañero al abrir el
 * archivo, y quien lo abre no hizo nada raro: abrió el listado de su empresa.
 *
 * Ver la descripción de OWASP como «CSV Injection».
 */
const INICIOS_DE_FORMULA = /^[=+@\-]/;

/**
 * Escapa una celda de CSV y la desarma como fórmula.
 *
 * Entre comillas SIEMPRE, no solo cuando hace falta: los nombres traen comas y
 * los cargos traen punto y coma, y una exportación que se rompe en la fila 40 se
 * descubre cuando ya está en el correo de alguien.
 *
 * Descarta controles iniciales y antepone una tabulación dentro de la celda
 * entrecomillada a los valores que empiezan como fórmula. La comilla simple
 * no sobrevive de forma fiable al ciclo de guardar y volver a abrir en Excel.
 */
export function celdaCSV(valor: string): string {
  const limpio = valor.replace(/^[\u0000-\u001f\ufeff]+/, "");
  const seguro = INICIOS_DE_FORMULA.test(limpio) ? `\t${limpio}` : limpio;
  return `"${seguro.replace(/"/g, '""')}"`;
}

/**
 * Arma el archivo y lo entrega al navegador.
 *
 * El BOM es lo que hace que Excel en Windows abra las tildes bien. Sin él,
 * «Inducción» llega como «InducciÃ³n» y el archivo parece corrupto. CRLF
 * porque es el fin de línea que el formato especifica.
 */
export function descargarCSV(nombreArchivo: string, filas: string[][]): void {
  const lineas = filas.map((f) => f.map(celdaCSV).join(","));
  const blob = new Blob(["﻿" + lineas.join("\r\n")], {
    type: "text/csv;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement("a");
  enlace.href = url;
  enlace.download = nombreArchivo;
  enlace.click();
  URL.revokeObjectURL(url);
}
