// src/shared/ui/Desplegable.tsx
//
// El desplegable de la casa: un `<select>` nativo con el aspecto del campo de
// texto de la casa.
//
// ## Por qué nativo y no el recreado
//
// La casa ya tiene un desplegable recreado con Radix (`components/ui/select`)
// y lo usan veinte pantallas. Este no lo sustituye, y la razón estaba escrita
// a mano en `AreasCxPage`: *«la lista tiene dos opciones y el nativo se opera
// mejor en móvil. Lo que se homologa es el tratamiento —tokens, radio y
// foco—, no el elemento»*.
//
// El principio es correcto. Lo que falló fue cumplirlo copiando las clases:
// la frase quedó en un comentario de una pantalla y el tratamiento se pegó a
// mano en cinco variantes. Esta pieza existe para que el principio sobreviva
// sin copiar nada. En móvil sigue abriendo el selector del sistema, que es
// todo el motivo para no recrearlo.
//
// ## Cuándo usar cuál
//
//   - **`Desplegable`** para una lista corta y plana de opciones: un estado,
//     un tipo de documento, una sede. Teclado y lector de pantalla salen del
//     navegador, que es donde mejor funcionan.
//   - **`Select` de Radix** cuando hace falta algo que el nativo no da:
//     agrupar, buscar dentro, pintar cada opción con icono o insignia, o
//     dejar el panel abierto mientras se filtra.
//
// ## Decisiones
//
//   - **La flecha la pinta la pieza**, no el sistema operativo: con
//     `appearance-none` el control mide y se alinea igual en todas las
//     plataformas, que es la mitad del motivo por el que los dieciocho
//     anteriores no encajaban entre sí.
//   - **`className` va al envoltorio**, no al `<select>`. Las pantallas lo
//     usan para el ancho (`sm:w-40`), y una anchura puesta en el `select`
//     dentro de un envoltorio ancho dejaría la flecha lejos del borde.
//   - **El resto de props va al `<select>`**, para que `Campo` pueda clonar
//     esta pieza y enlazarle `id`, `aria-invalid` y `aria-describedby`.

import { forwardRef, type SelectHTMLAttributes } from "react";
import { ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";
import { ALTO_CONTROL, CLASE_CONTROL } from "@/shared/ui/controles";

export type PropsDesplegable = Omit<SelectHTMLAttributes<HTMLSelectElement>, "className"> & {
  /** Clases del envoltorio: ancho y colocación. No el aspecto del control. */
  className?: string;
};

export const Desplegable = forwardRef<HTMLSelectElement, PropsDesplegable>(function Desplegable(
  { children, className, ...resto },
  referencia,
) {
  return (
    <div className={cn("desplegable-casa relative w-full", className)}>
      <select
        ref={referencia}
        className={cn(CLASE_CONTROL, ALTO_CONTROL.normal, "flex cursor-pointer appearance-none pr-9")}
        {...resto}
      >
        {children}
      </select>
      <ChevronDown
        aria-hidden="true"
        className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
      />
    </div>
  );
});
