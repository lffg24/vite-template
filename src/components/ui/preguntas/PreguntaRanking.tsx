import type { Pregunta } from "@/types/pregunta";
import { DndContext, closestCenter } from "@dnd-kit/core";
import { GripVertical } from "lucide-react";
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useEffect, useState } from "react";

interface Props {
  pregunta: Pregunta;
  ordenActual?: string[];
  onCambiar: (preguntaId: number, nuevoOrden: string[]) => void;
}

function esRanking(p: Pregunta): p is Pregunta & {
  metadata: {
    items?: { titulo: string; descripcion?: string }[];
    opciones?: string[];
    competencia?: string;
  };
} {
  const t = (p.tipo_respuesta ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, "_");
  return t === "ranking";
}

export default function PreguntaRanking({
  pregunta,
  ordenActual = [],
  onCambiar,
}: Props) {
  if (!esRanking(pregunta)) return null;

  const items =
    pregunta.metadata?.items ??
    pregunta.metadata?.opciones?.map((titulo) => ({ titulo })) ??
    [];
  const competencia = pregunta.metadata?.competencia;

  const [orden, setOrden] = useState<string[]>(() => {
    const titulos = items.map((it) => it.titulo);
    return ordenActual.length > 0 &&
      ordenActual.every((t) => titulos.includes(t))
      ? ordenActual
      : titulos;
  });

  useEffect(() => {
    onCambiar(pregunta.id, orden);
  }, [orden]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div>
      <div className="bg-muted p-4 rounded-xl mb-6">
        {competencia && (
          <p className="text-sm text-muted-foreground font-medium">
            Competencia: {competencia}
          </p>
        )}
        <h2 className="text-lg font-semibold mt-1">Pregunta</h2>
        <p>{pregunta.texto}</p>
      </div>

      <DndContext
        collisionDetection={closestCenter}
        onDragEnd={({ active, over }) => {
          if (!over || active.id === over.id) return;
          const oldIndex = orden.indexOf(active.id as string);
          const newIndex = orden.indexOf(over.id as string);
          setOrden(arrayMove(orden, oldIndex, newIndex));
        }}
      >
        <SortableContext items={orden} strategy={verticalListSortingStrategy}>
          <div className="flex flex-col gap-2">
            {orden.map((id) => {
              const item = items.find((i) => i.titulo === id);
              if (!item) return null;
              return <ItemDraggable key={id} id={id} texto={item.titulo} />;
            })}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}

function ItemDraggable({ id, texto }: { id: string; texto: string }) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id });

  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="p-3 bg-white rounded-md shadow-sm border text-sm cursor-grab hover:bg-muted flex items-center gap-2"
    >
      <GripVertical className="w-4 h-4 text-muted-foreground" />
      <span>{texto}</span>
    </div>
  );
}
