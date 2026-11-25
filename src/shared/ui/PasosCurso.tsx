// src/shared/ui/PasosCurso.tsx
//
// «Dónde voy»: una raya por paso, pintada según el estado de cada uno.
//
// ## Por qué segmentos y no una barra
//
// Una barra continua dice «cuánto» pero no «cuántos». Quien cursa desde el
// teléfono necesita las dos: que son cuatro lecciones, que lleva una y que la
// siguiente es la tercera. Cada segmento es un paso, así que contar es mirar.
//
// ## Qué mide cada estado
//
// `hecho` y `pendiente` los decide quien llama; `actual` es el paso que se está
// viendo. No se deduce nada aquí: en la evaluación «hecho» es una pregunta
// RESPONDIDA, en la lección es una parte VISTA, y esa diferencia es de quien
// conoce el dominio, no de esta pieza.
//
// ## Accesibilidad
//
// Es una lista con su nombre y cada paso dice su estado en texto oculto. El
// color solo no cuenta: un segmento verde no se distingue de uno gris para
// quien no ve colores.

import { cn } from "@/lib/utils";

export type EstadoPaso = "hecho" | "actual" | "pendiente";

const CLASE: Record<EstadoPaso, string> = {
  hecho: "bg-rel-primary",
  actual: "bg-rel-primary/45",
  pendiente: "bg-rel-neutral-subtle",
};

const TEXTO: Record<EstadoPaso, string> = {
  hecho: "completado",
  actual: "en curso",
  pendiente: "pendiente",
};

export function PasosCurso({
  pasos,
  etiqueta,
  className,
}: {
  pasos: EstadoPaso[];
  /** Lo que se cuenta: «Partes de la lección», «Preguntas»… Se anuncia. */
  etiqueta: string;
  className?: string;
}) {
  return (
    <ol aria-label={etiqueta} className={cn("flex gap-1.5", className)}>
      {pasos.map((estado, i) => (
        <li
          key={i}
          className={cn(
            "h-2 min-w-0 flex-1 rounded-full",
            "transition-colors duration-context ease-rel-out motion-reduce:transition-none",
            CLASE[estado]
          )}
        >
          <span className="sr-only">
            {i + 1} de {pasos.length}: {TEXTO[estado]}
          </span>
        </li>
      ))}
    </ol>
  );
}
