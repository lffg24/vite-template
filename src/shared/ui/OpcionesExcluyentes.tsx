// src/shared/ui/OpcionesExcluyentes.tsx
//
// Elegir UNA de varias opciones que hay que leer para elegir bien.
//
// No es un `Select` disfrazado. Un desplegable sirve cuando las opciones se
// entienden por su nombre —un mes, una empresa, una versión—; aquí cada opción
// necesita una frase de explicación, y esconderlas detrás de un clic obliga a
// abrir, leer, cerrar y volver a abrir para comparar. Es la forma que ya tiene
// el producto en las preguntas de Psicosocial: tarjetas con radio, todas a la
// vista.
//
// Se construye sobre `<input type="radio">` de verdad, dentro de un
// `<fieldset>` con `<legend>`. Esa es la razón de que exista como componente y
// no como un puñado de divs con `onClick`: los radios nativos ya traen
// navegación con flechas, agrupación por `name`, anuncio de «2 de 2» en los
// lectores de pantalla y validación del formulario. Reimplementarlo con divs es
// el camino más corto a un formulario que no se puede usar con el teclado.

import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export type OpcionExcluyente<T extends string> = {
  valor: T;
  titulo: string;
  descripcion: string;
  /** Consecuencia práctica de elegir esto. Se pinta aparte, más apagado. */
  nota?: ReactNode;
  deshabilitada?: boolean;
  /** Por qué no se puede elegir. Obligatorio si está deshabilitada. */
  motivo?: string;
};

export function OpcionesExcluyentes<T extends string>({
  nombre,
  leyenda,
  leyendaOculta,
  disposicion = "lista",
  ayuda,
  valor,
  alCambiar,
  opciones,
  className,
}: {
  /** `name` del grupo de radios. Único en el formulario. */
  nombre: string;
  leyenda: string;
  /**
   * Oculta la leyenda a la vista, nunca al lector de pantalla.
   *
   * Para cuando lo que envuelve al grupo ya lo nombra —un `<fieldset>`
   * «Pregunta 3» con un único grupo dentro—. Verla dos veces estorba; no
   * tenerla deja al lector con un grupo de radios sin nombre.
   */
  leyendaOculta?: boolean;
  /**
   * `lista` apila las opciones; `rejilla` las reparte en columnas que se
   * adaptan solas al ancho.
   *
   * No es decoración: depende del largo de la descripción. Dos frases por
   * opción se leen apiladas; media línea por opción, apilada, deja una columna
   * de huecos.
   */
  disposicion?: "lista" | "rejilla";
  ayuda?: string;
  valor: T;
  alCambiar: (v: T) => void;
  opciones: OpcionExcluyente<T>[];
  className?: string;
}) {
  const idAyuda = ayuda ? `${nombre}-ayuda` : undefined;

  return (
    <fieldset className={cn("space-y-2", className)} aria-describedby={idAyuda}>
      <legend
        className={cn(
          "font-rel-body text-sm font-medium text-rel-dark",
          leyendaOculta && "sr-only"
        )}
      >
        {leyenda}
      </legend>
      {ayuda ? (
        <p id={idAyuda} className="font-rel-body text-sm text-rel-muted">
          {ayuda}
        </p>
      ) : null}

      <div
        className={cn(
          "pt-1",
          disposicion === "rejilla"
            ? "grid gap-2 sm:grid-cols-[repeat(auto-fit,minmax(14rem,1fr))]"
            : "space-y-2"
        )}
      >
        {opciones.map((o) => {
          const elegida = o.valor === valor;
          const id = `${nombre}-${o.valor}`;

          return (
            <label
              key={o.valor}
              htmlFor={id}
              className={cn(
                "flex cursor-pointer items-start gap-3 rounded-rel-card border p-4 transition-colors",
                disposicion === "rejilla" && "h-full",
                elegida
                  ? "border-rel-primary bg-rel-accent-subtle"
                  : "border-rel-border bg-rel-surface hover:border-rel-border-strong",
                o.deshabilitada && "cursor-not-allowed opacity-60 hover:border-rel-border"
              )}
            >
              <input
                type="radio"
                id={id}
                name={nombre}
                value={o.valor}
                checked={elegida}
                disabled={o.deshabilitada}
                onChange={() => alCambiar(o.valor)}
                className="mt-1 h-4 w-4 shrink-0 accent-rel-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rel-primary focus-visible:ring-offset-2"
              />
              <span className="min-w-0">
                <span className="block font-rel-body text-sm font-bold text-rel-dark">
                  {o.titulo}
                </span>
                <span className="mt-1 block font-rel-body text-sm text-rel-muted">
                  {o.descripcion}
                </span>
                {o.nota ? (
                  <span className="mt-2 block font-rel-body text-xs text-rel-muted">{o.nota}</span>
                ) : null}
                {o.deshabilitada && o.motivo ? (
                  <span className="mt-2 block font-rel-body text-xs text-rel-warning">
                    {o.motivo}
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
