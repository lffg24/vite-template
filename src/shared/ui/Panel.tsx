// src/shared/ui/Panel.tsx
//
// El contenedor de contenido de ABRIL-360, y la carcasa de tabla que va dentro.
//
// Mismo origen que `PageHeader`: es el marcado que Psicosocial ya usa
// (`EmpresasPsicoPage.tsx:39` y `:50-53`), extraído para poder consumirlo.
//
// Por qué `TablaPanel` existe y no es solo una clase: la tabla necesita DOS
// cajas —una que recorta las esquinas y otra que desborda en horizontal— y
// olvidar la segunda es lo que hace que una tabla ancha empuje el `body` entero
// de lado. Poniéndolo aquí, ninguna pantalla tiene que acordarse.

import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function Panel({
  children,
  className,
  titulo,
}: {
  children: ReactNode;
  className?: string;
  titulo?: string;
}) {
  return (
    <section
      className={cn(
        "rounded-rel-panel border border-rel-border bg-rel-surface p-5 shadow-sm",
        className
      )}
    >
      {titulo ? (
        <h2 className="mb-4 font-rel-heading text-base font-bold text-rel-dark">{titulo}</h2>
      ) : null}
      {children}
    </section>
  );
}

/**
 * Carcasa de tabla: esquinas recortadas y desborde horizontal PROPIO.
 *
 * `overflow-x-auto` va en el contenedor de la tabla y no en la página: una
 * tabla ancha debe hacer scroll dentro de su caja, nunca mover el documento.
 */
export function TablaPanel({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("overflow-hidden rounded-rel-card border border-rel-border", className)}>
      {/* `relative`: sin él, lo que va en posición absoluta dentro de la tabla
          —los textos solo para lector de pantalla, por ejemplo— no queda
          recortado por esta caja y alarga la página entera hacia la derecha. */}
      <div className="relative overflow-x-auto">{children}</div>
    </div>
  );
}

/** Encabezado de tabla de la casa. Se usa como `<thead>`. */
export function TablaHead({ children }: { children: ReactNode }) {
  return (
    <thead className="bg-rel-surface-subtle text-xs uppercase tracking-wide text-rel-muted">
      {children}
    </thead>
  );
}

/** Cuerpo de tabla de la casa: separadores finos, sin bordes verticales. */
export function TablaBody({ children }: { children: ReactNode }) {
  return <tbody className="divide-y divide-rel-border">{children}</tbody>;
}
