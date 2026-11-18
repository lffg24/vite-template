import { type ClassValue } from "clsx";
import { clsx } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

/**
 * `cn` conoce los radios y los relieves de la casa.
 *
 * `tailwind-merge` resuelve un conflicto solo si sabe que dos clases hacen el
 * mismo trabajo, y lo sabe por una tabla de valores. Los nombres de la casa no
 * estaban en esa tabla, asi que:
 *
 *   - `cn("rounded-rel-panel", "rounded-none")` devolvia **las dos**. No es un
 *     empate inofensivo: cual gana lo decide el orden en la hoja compilada, no
 *     el orden en el atributo, asi que una pantalla no puede quitarle el radio
 *     a una pieza ni saber que no se lo quito.
 *   - `cn("shadow-rel-card", "shadow-none")` tambien devolvia las dos, porque
 *     un `shadow-<algo>` desconocido se clasifica como color de sombra y el
 *     color no entra en conflicto con la sombra.
 *
 * Esto afecta a las dos escalas que el producto acaba de cerrar —tres radios y
 * tres relieves— y a los 65 sitios que pasan `className` a una pieza. Se
 * arregla aqui, una vez, declarando los nombres propios en el grupo al que
 * pertenecen.
 */
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      rounded: [{ rounded: ["rel-control", "rel-card", "rel-panel"] }],
      shadow: [{ shadow: ["rel-soft", "rel-card", "rel-floating"] }],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
