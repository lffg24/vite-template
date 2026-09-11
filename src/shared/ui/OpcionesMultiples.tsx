// src/shared/ui/OpcionesMultiples.tsx
//
// Elegir VARIAS de una lista. El hermano de `OpcionesExcluyentes`.
//
// Son dos componentes y no uno con un `multiple` a propósito. La diferencia no
// es de presentación: un radio y una casilla significan cosas distintas —«una
// de estas» contra «las que apliquen»—, se anuncian distinto en un lector de
// pantalla y se operan distinto con el teclado (las flechas mueven entre
// radios; el espacio marca casillas). Un parámetro los uniría en un componente
// que tendría que ramificar en cada línea, y la ramificación acabaría en la
// accesibilidad, que es donde no se nota hasta que alguien no puede usarlo.
//
// Lo que sí comparten es la forma: misma tarjeta, mismo estado marcado, mismo
// foco. Eso es lo que hace que responder se sienta igual en los dos casos.

import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export type OpcionMultiple<T extends string> = {
  valor: T;
  titulo: string;
  descripcion?: string;
  nota?: ReactNode;
};

export function OpcionesMultiples<T extends string>({
  nombre,
  leyenda,
  ayuda,
  valores,
  alCambiar,
  opciones,
  className,
}: {
  /** Prefijo de los `id`. Único en el formulario. */
  nombre: string;
  leyenda: string;
  ayuda?: string;
  valores: T[];
  alCambiar: (v: T[]) => void;
  opciones: OpcionMultiple<T>[];
  className?: string;
}) {
  const idAyuda = ayuda ? `${nombre}-ayuda` : undefined;

  function alternar(valor: T) {
    alCambiar(
      valores.includes(valor) ? valores.filter((v) => v !== valor) : [...valores, valor]
    );
  }

  return (
    <fieldset className={cn("space-y-2", className)} aria-describedby={idAyuda}>
      <legend className="font-rel-body text-sm font-medium text-rel-dark">{leyenda}</legend>
      {ayuda ? (
        <p id={idAyuda} className="font-rel-body text-sm text-rel-muted">
          {ayuda}
        </p>
      ) : null}

      <div className="space-y-2 pt-1">
        {opciones.map((o) => {
          const marcada = valores.includes(o.valor);
          const id = `${nombre}-${o.valor}`;

          return (
            <label
              key={o.valor}
              htmlFor={id}
              className={cn(
                "flex cursor-pointer items-start gap-3 rounded-rel-card border p-4 transition-colors",
                marcada
                  ? "border-rel-primary bg-rel-accent-subtle"
                  : "border-rel-border bg-rel-surface hover:border-rel-border-strong"
              )}
            >
              <input
                type="checkbox"
                id={id}
                name={nombre}
                value={o.valor}
                checked={marcada}
                onChange={() => alternar(o.valor)}
                className="mt-1 h-4 w-4 shrink-0 accent-rel-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rel-primary focus-visible:ring-offset-2"
              />
              <span className="min-w-0">
                <span className="block font-rel-body text-sm font-bold text-rel-dark">
                  {o.titulo}
                </span>
                {o.descripcion ? (
                  <span className="mt-1 block font-rel-body text-sm text-rel-muted">
                    {o.descripcion}
                  </span>
                ) : null}
                {o.nota ? (
                  <span className="mt-2 block font-rel-body text-xs text-rel-muted">
                    {o.nota}
                  </span>
                ) : null}
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
