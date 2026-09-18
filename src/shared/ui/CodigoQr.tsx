// src/shared/ui/CodigoQr.tsx
//
// Un código QR en SVG, dibujado como un solo `path`.
//
// Vectorial porque se imprime: un PNG de 200 px se ve borroso en papel y un
// lector de celular falla con un QR borroso. Un solo `path` y no un `rect` por
// módulo porque un QR de versión 4 tiene más de mil módulos, y mil nodos por
// documento hacen lenta la vista de impresión.
//
// Se arma con React a partir de la matriz, sin `dangerouslySetInnerHTML`: el
// contenido viene de un código del servidor y no hay por qué inyectar marcado.

import qrcode from "qrcode-generator";
import { useMemo } from "react";

import { cn } from "@/lib/utils";

export function CodigoQr({
  valor,
  etiqueta,
  className,
}: {
  valor: string;
  /** Qué abre el código; es lo que se anuncia. */
  etiqueta: string;
  className?: string;
}) {
  const { tamano, trazo } = useMemo(() => {
    // Tipo 0 = el más pequeño que quepa. Corrección «M»: aguanta una esquina
    // doblada o una mancha en el papel sin hacer el código enorme.
    const qr = qrcode(0, "M");
    qr.addData(valor);
    qr.make();
    const n = qr.getModuleCount();
    let d = "";
    for (let fila = 0; fila < n; fila++) {
      for (let col = 0; col < n; col++) {
        if (qr.isDark(fila, col)) d += `M${col} ${fila}h1v1h-1z`;
      }
    }
    return { tamano: n, trazo: d };
  }, [valor]);

  // Margen de 2 módulos: la «zona tranquila» que los lectores necesitan.
  const margen = 2;
  return (
    <svg
      role="img"
      aria-label={etiqueta}
      viewBox={`${-margen} ${-margen} ${tamano + margen * 2} ${tamano + margen * 2}`}
      shapeRendering="crispEdges"
      className={cn("h-32 w-32 bg-white", className)}
    >
      <path d={trazo} className="fill-rel-dark" />
    </svg>
  );
}
