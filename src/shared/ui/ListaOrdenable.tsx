// src/shared/ui/ListaOrdenable.tsx
//
// Una lista que se reordena arrastrando por su asa de seis puntos.
//
// Sobre `@dnd-kit`, que ya estaba en el proyecto. Se eligió frente a escribirlo
// con la API de arrastre del navegador por una razón concreta y no por comodidad:
// **dnd-kit trae el teclado**. Con `KeyboardSensor`, el asa se enfoca con `Tab`,
// se toma con espacio, se mueve con las flechas y se suelta con espacio otra
// vez. La API nativa del navegador no tiene equivalente, y el orden de las
// lecciones de un curso es un dato normativo: dejarlo detrás de un gesto que
// solo existe con ratón lo vuelve inaccesible para quien no lo use.
//
// El asa es un asa y no la fila entera a propósito. Arrastrando desde cualquier
// punto no se puede seleccionar el texto de la fila ni pulsar sus botones sin
// que el gesto se interprete como un arrastre.

import type { ReactNode } from "react";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  restrictToParentElement,
  restrictToVerticalAxis,
} from "@dnd-kit/modifiers";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { GripVertical } from "lucide-react";

import { cn } from "@/lib/utils";

export function ListaOrdenable({
  ids,
  alReordenar,
  deshabilitada,
  children,
  className,
}: {
  /** En el orden actual. Es la fuente de la verdad mientras se arrastra. */
  ids: string[];
  /** Recibe la lista COMPLETA ya reordenada. */
  alReordenar: (nuevos: string[]) => void;
  deshabilitada?: boolean;
  children: ReactNode;
  className?: string;
}) {
  const sensores = useSensors(
    // Ocho píxeles antes de considerarlo arrastre: sin esa distancia, un clic
    // con un temblor de mano en el asa se interpreta como un movimiento y la
    // lista cambia sin que nadie lo haya pedido.
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  function alSoltar(evento: DragEndEvent) {
    const { active, over } = evento;
    if (!over || active.id === over.id) return;
    const desde = ids.indexOf(String(active.id));
    const hasta = ids.indexOf(String(over.id));
    if (desde < 0 || hasta < 0) return;

    const copia = [...ids];
    copia.splice(hasta, 0, copia.splice(desde, 1)[0]);
    alReordenar(copia);
  }

  return (
    <DndContext
      sensors={sensores}
      collisionDetection={closestCenter}
      // Vertical y dentro del contenedor: una lista que se puede arrastrar en
      // diagonal fuera de su caja se siente rota aunque el resultado sea el
      // mismo.
      modifiers={[restrictToVerticalAxis, restrictToParentElement]}
      onDragEnd={deshabilitada ? undefined : alSoltar}
    >
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        <ol className={cn("space-y-3", className)}>{children}</ol>
      </SortableContext>
    </DndContext>
  );
}

/** Una fila. El asa la pinta ella; el resto del contenido es de quien la usa. */
export function FilaOrdenable({
  id,
  etiqueta,
  deshabilitada,
  children,
  className,
}: {
  id: string;
  /** Qué se está moviendo. Lo anuncia el lector de pantalla al tomar el asa. */
  etiqueta: string;
  deshabilitada?: boolean;
  children: ReactNode;
  className?: string;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id, disabled: deshabilitada });

  return (
    <li
      ref={setNodeRef}
      // El `transform` se compone a mano en vez de importar `CSS` de
      // `@dnd-kit/utilities`: ese paquete está instalado como dependencia
      // TRANSITIVA, no declarada en `package.json`. Importarlo funcionaría hoy
      // y dejaría de compilar el día que dnd-kit deje de arrastrarlo, sin que
      // nadie haya tocado este archivo.
      style={{
        transform: transform
          ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
          : undefined,
        transition,
      }}
      className={cn(
        "flex items-start gap-2 rounded-rel-card border border-rel-border bg-rel-surface p-4",
        // Mientras se arrastra sube sobre las demás y se aligera: sin eso, la
        // fila pasa POR DEBAJO de las siguientes y parece que se ha perdido.
        isDragging && "relative z-10 opacity-90 shadow-lg",
        className
      )}
    >
      {deshabilitada ? null : (
        <button
          type="button"
          {...attributes}
          {...listeners}
          aria-label={`Reordenar ${etiqueta}`}
          className="mt-0.5 shrink-0 cursor-grab touch-none rounded-rel-control p-1 text-rel-muted transition-colors hover:bg-rel-surface-subtle hover:text-rel-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rel-primary active:cursor-grabbing"
        >
          <GripVertical className="h-5 w-5" aria-hidden="true" />
        </button>
      )}
      <div className="min-w-0 flex-1">{children}</div>
    </li>
  );
}
