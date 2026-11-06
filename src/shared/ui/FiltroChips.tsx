// src/shared/ui/FiltroChips.tsx
//
// Filtros de una sola elección a la vista: «Todas 3 · Vigentes 2 · Vencidas 1».
//
// Son botones con `aria-pressed` y no pestañas: no cambian de panel, filtran
// la misma lista. Un lector de pantalla anuncia «Vigentes, 2, pulsado», que es
// exactamente lo que pasa.
//
// El conteo es opcional y lo trae quien llama. Un chip que calculara su propio
// número tendría que recibir la lista entera, y el número que importa —el del
// servidor, sobre todos los registros— no es el de la página visible.

import { cn } from "@/lib/utils";

import type { TonoPill } from "./Pill";

export type OpcionFiltro<T extends string> = {
  valor: T;
  etiqueta: string;
  cuenta?: number;
  /** Solo para filtros que son un estado: pinta el punto de su color. */
  tono?: Exclude<TonoPill, "marca" | "info">;
};

const PUNTO = {
  exito: "bg-rel-success",
  atencion: "bg-rel-warning",
  peligro: "bg-rel-danger",
  neutro: "bg-rel-neutral",
} as const;

export function FiltroChips<T extends string>({
  opciones,
  valor,
  alCambiar,
  etiqueta,
  className,
}: {
  opciones: OpcionFiltro<T>[];
  valor: T;
  alCambiar: (valor: T) => void;
  /** Qué se filtra; agrupa los botones para el lector de pantalla. */
  etiqueta: string;
  className?: string;
}) {
  return (
    <div role="group" aria-label={etiqueta} className={cn("flex flex-wrap gap-2", className)}>
      {opciones.map((o) => {
        const activo = o.valor === valor;
        return (
          <button
            key={o.valor}
            type="button"
            aria-pressed={activo}
            onClick={() => alCambiar(o.valor)}
            className={cn(
              "inline-flex min-h-[2.5rem] items-center gap-2 rounded-full border px-4 text-sm font-semibold transition-colors duration-rel-micro",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rel-primary focus-visible:ring-offset-2",
              activo
                ? "border-rel-primary bg-rel-primary text-white"
                : "border-rel-border bg-rel-surface text-rel-dark hover:bg-rel-surface-subtle"
            )}
          >
            {o.tono ? (
              <span aria-hidden="true" className={cn("h-2 w-2 rounded-full", PUNTO[o.tono])} />
            ) : null}
            {o.etiqueta}
            {o.cuenta != null ? (
              <span
                className={cn(
                  "min-w-6 rounded-full px-1.5 text-xs tabular-nums",
                  activo ? "bg-white/20 text-white" : "bg-rel-neutral-subtle text-rel-muted"
                )}
              >
                {o.cuenta}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
