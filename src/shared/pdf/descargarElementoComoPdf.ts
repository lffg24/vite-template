function nombreSeguro(nombre: string): string {
  return nombre
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "") || "documento";
}

/**
 * Descarga una superficie HTML como PDF A4 apaisado sin abrir el diálogo de
 * impresión. La composición se captura a ancho de escritorio incluso si la
 * persona descarga desde el teléfono; así el archivo conserva la plantilla
 * formal y no la columna responsive de la vista móvil.
 */
export async function descargarElementoComoPdf(
  elemento: HTMLElement,
  nombre: string,
): Promise<void> {
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
    import("html2canvas"),
    import("jspdf"),
  ]);

  const anfitrion = document.createElement("div");
  anfitrion.setAttribute("aria-hidden", "true");
  anfitrion.style.cssText =
    "position:fixed;left:-12000px;top:0;width:1120px;background:#fff;pointer-events:none;";
  const copia = elemento.cloneNode(true) as HTMLElement;
  copia.style.width = "1120px";
  copia.style.maxWidth = "none";
  copia.style.boxShadow = "none";
  anfitrion.appendChild(copia);
  document.body.appendChild(anfitrion);

  try {
    await document.fonts?.ready;
    const canvas = await html2canvas(copia, {
      backgroundColor: "#ffffff",
      logging: false,
      scale: 2,
      useCORS: true,
      windowWidth: 1440,
    });
    const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
    const anchoPagina = pdf.internal.pageSize.getWidth();
    const altoPagina = pdf.internal.pageSize.getHeight();
    const margen = 8;
    const escala = Math.min(
      (anchoPagina - margen * 2) / canvas.width,
      (altoPagina - margen * 2) / canvas.height,
    );
    const ancho = canvas.width * escala;
    const alto = canvas.height * escala;
    pdf.addImage(
      canvas.toDataURL("image/jpeg", 0.96),
      "JPEG",
      (anchoPagina - ancho) / 2,
      (altoPagina - alto) / 2,
      ancho,
      alto,
      undefined,
      "FAST",
    );
    pdf.save(`${nombreSeguro(nombre)}.pdf`);
  } finally {
    anfitrion.remove();
  }
}

export { nombreSeguro };
