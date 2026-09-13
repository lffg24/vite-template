// src/shared/ui/Ayuda.tsx
//
// El porqué de un campo, detrás de un icono.
//
// Los formularios del módulo llevaban un párrafo bajo cada campo explicando la
// regla que hay detrás. Cada uno por separado estaba bien escrito; juntos
// convertían una pantalla de seis campos en un muro que nadie lee, y el efecto
// es el contrario del buscado: cuando todo está explicado, nada destaca.
//
// Aquí la explicación sigue estando —no se borra, que sería perder la razón de
// la regla— pero se pide. Quien ya sabe, no la ve.
//
// **Popover y no tooltip.** Un tooltip aparece al pasar el ratón por encima, y
// en un teléfono no hay ratón: la mitad de quien opera esto lo hace desde el
// móvil y no habría forma de abrirlo. El popover se abre al pulsar, funciona
// igual con dedo, ratón y teclado, y se cierra con `Escape`.
//
// Cuándo NO usarlo: si el texto es una condición para rellenar bien el campo
// —un formato, un rango, una consecuencia irreversible— va VISIBLE. Esconder lo
// que hace falta para no equivocarse es peor que el muro de texto.

import type { ReactNode } from "react";
import { Info } from "lucide-react";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export function Ayuda({
  children,
  etiqueta = "Más información",
  className,
}: {
  children: ReactNode;
  /** Qué anuncia el lector de pantalla. Concreto: «Qué es la vigencia». */
  etiqueta?: string;
  className?: string;
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={etiqueta}
          className={cn(
            "inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-rel-muted transition-colors hover:bg-rel-accent-subtle hover:text-rel-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rel-primary focus-visible:ring-offset-2",
            className
          )}
        >
          <Info className="h-4 w-4" aria-hidden="true" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="max-w-xs rounded-rel-card border-rel-border bg-rel-surface p-4 text-sm leading-relaxed text-rel-muted shadow-lg"
      >
        {children}
      </PopoverContent>
    </Popover>
  );
}

/**
 * Etiqueta de campo con su ayuda al lado.
 *
 * Existe para que el icono quede SIEMPRE en el mismo sitio —pegado a la
 * etiqueta, no al final del campo ni flotando a la derecha—. Un icono que
 * aparece en un sitio distinto en cada formulario deja de leerse como «aquí hay
 * ayuda» y pasa a leerse como ruido.
 */
export function EtiquetaConAyuda({
  htmlFor,
  children,
  ayuda,
  etiquetaAyuda,
  requerido,
}: {
  htmlFor: string;
  children: ReactNode;
  ayuda: ReactNode;
  etiquetaAyuda?: string;
  requerido?: boolean;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <label
        htmlFor={htmlFor}
        className="font-rel-body text-sm font-medium leading-none text-rel-dark"
      >
        {children}
        {requerido ? <span className="ml-0.5 text-rel-danger">*</span> : null}
      </label>
      <Ayuda etiqueta={etiquetaAyuda}>{ayuda}</Ayuda>
    </div>
  );
}
