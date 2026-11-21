// src/shared/ui/tablero/Tablero.tsx
//
// El tablero: una columna por estado, una tarjeta por tarea, y se mueven
// arrastrando. Genérico: no sabe qué es una tarea del negocio.
//
// ## Quién decide el movimiento
//
// El tablero **no mueve nada por su cuenta**. Al soltar una tarjeta sobre otra
// columna avisa `alSolicitarMovimiento(tarea, destino)` y ahí termina su
// trabajo. Quien consume decide: moverla de inmediato (actualizando su lista),
// abrir un diálogo que pida datos (en Licitaciones, cerrar con GO o NO GO exige
// motivo y justificación), o rechazarla. Es lo que Jira llama «pantalla de
// transición», y es la razón por la que esto sirve para algo más que un juguete:
// en un flujo con reglas, **arrastrar es pedir**, no hacer.
//
// ## Cómo se mueve sin ratón
//
// - Teclado: Tab hasta la tarjeta, Espacio para levantarla, flechas para
//   elegir columna, Espacio para soltar. Los anuncios van en español.
// - Táctil: se arrastra con pulsación larga (250 ms), para no pelearse con el
//   desplazamiento de las columnas.
// - Siempre: el menú «Mover a…» de cada tarjeta.
//
// ## En el teléfono
//
// Las columnas se desplazan de lado y cada una se ajusta al borde (snap): se ve
// una entera y el asomo de la siguiente, que es lo que dice «hay más».

import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  closestCorners,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { useMemo, useState } from "react";

import { cn } from "@/lib/utils";
import { Esqueleto } from "@/shared/ui/Esqueleto";
import { TarjetaTarea } from "./TarjetaTarea";
import type { ColumnaTablero, SolicitudMovimiento, TareaVista } from "./modelo";

const PUNTO: Record<NonNullable<ColumnaTablero["tono"]>, string> = {
  exito: "bg-rel-success",
  atencion: "bg-rel-warning",
  peligro: "bg-rel-danger",
  neutro: "bg-rel-muted",
  info: "bg-rel-info",
  marca: "bg-rel-primary",
};

function TarjetaArrastrable<T>({
  tarea,
  columnas,
  alAbrir,
  alSolicitarMovimiento,
  enVuelo,
}: {
  tarea: TareaVista<T>;
  columnas: ColumnaTablero[];
  alAbrir?: (t: TareaVista<T>) => void;
  alSolicitarMovimiento: SolicitudMovimiento<T>;
  enVuelo: boolean;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: tarea.id,
    disabled: enVuelo,
  });
  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      // dnd-kit pone `role="button"`: aquí la tarjeta es un `article` con un
      // botón dentro, y dos botones anidados confundirían al lector de pantalla.
      role="group"
      aria-roledescription="tarea movible"
      aria-label={tarea.titulo}
      // El original se queda como hueco tenue mientras la copia viaja.
      className={cn("touch-manipulation rounded-rel-card outline-hidden focus-visible:ring-2 focus-visible:ring-rel-primary", isDragging && "opacity-35")}
    >
      <TarjetaTarea
        tarea={tarea}
        columnas={columnas}
        alAbrir={alAbrir}
        alMover={alSolicitarMovimiento}
        enVuelo={enVuelo}
        // Al llegar a una columna nueva la tarjeta es un elemento nuevo y entra
        // con un fundido corto: se ve DÓNDE aterrizó.
        className="animate-in fade-in zoom-in-95 duration-enter ease-rel-out motion-reduce:animate-none"
      />
    </div>
  );
}

function Columna<T>({
  columna,
  tareas,
  columnas,
  alAbrir,
  alSolicitarMovimiento,
  enVuelo,
  cargando,
}: {
  columna: ColumnaTablero;
  tareas: TareaVista<T>[];
  columnas: ColumnaTablero[];
  alAbrir?: (t: TareaVista<T>) => void;
  alSolicitarMovimiento: SolicitudMovimiento<T>;
  enVuelo: ReadonlySet<string>;
  cargando: boolean;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: columna.id });
  const pasado = columna.limite !== undefined && tareas.length > columna.limite;

  return (
    <section
      aria-labelledby={`col-${columna.id}`}
      className="flex w-[85vw] max-w-80 shrink-0 snap-start flex-col rounded-rel-card bg-rel-neutral-subtle/60 sm:w-72"
    >
      <header className="flex items-center gap-2 px-3 pb-2 pt-3">
        <span aria-hidden="true" className={cn("h-2.5 w-2.5 shrink-0 rounded-full", PUNTO[columna.tono ?? "neutro"])} />
        <h3 id={`col-${columna.id}`} className="min-w-0 flex-1 truncate text-xs font-bold uppercase tracking-[0.1em] text-rel-dark">
          {columna.titulo}
        </h3>
        <span
          className={cn(
            "rounded-full px-2 py-0.5 text-xs font-bold tabular-nums",
            pasado ? "bg-rel-warning-subtle text-rel-warning" : "bg-rel-surface text-rel-muted"
          )}
          title={pasado ? `Pasa el límite de ${columna.limite}` : undefined}
        >
          {tareas.length}
          {columna.limite !== undefined ? `/${columna.limite}` : ""}
          <span className="sr-only"> tareas{pasado ? ", pasa el límite" : ""}</span>
        </span>
      </header>

      <div
        ref={setNodeRef}
        className={cn(
          "mx-1.5 mb-1.5 flex min-h-24 flex-1 flex-col gap-2 rounded-rel-control p-1.5",
          "transition-colors duration-exit ease-rel-out motion-reduce:transition-none",
          isOver && "bg-rel-accent-subtle ring-2 ring-inset ring-rel-primary/40"
        )}
      >
        {cargando ? (
          <>
            <Esqueleto className="h-24 rounded-rel-card" />
            <Esqueleto className="h-20 rounded-rel-card" />
          </>
        ) : tareas.length === 0 ? (
          <p className="grid flex-1 place-items-center rounded-rel-control border border-dashed border-rel-border-strong px-3 py-6 text-center text-xs text-rel-muted">
            {isOver ? "Suelta aquí" : "Sin tareas"}
          </p>
        ) : (
          tareas.map((t) => (
            <TarjetaArrastrable
              key={`${t.id}:${t.columna}`}
              tarea={t}
              columnas={columnas}
              alAbrir={alAbrir}
              alSolicitarMovimiento={alSolicitarMovimiento}
              enVuelo={enVuelo.has(t.id)}
            />
          ))
        )}
      </div>
    </section>
  );
}

export function Tablero<T>({
  columnas,
  tareas,
  alSolicitarMovimiento,
  alAbrir,
  enVuelo,
  cargando = false,
  etiqueta = "Tablero de tareas",
}: {
  columnas: ColumnaTablero[];
  tareas: TareaVista<T>[];
  alSolicitarMovimiento: SolicitudMovimiento<T>;
  alAbrir?: (tarea: TareaVista<T>) => void;
  /** Ids de tareas cuyo movimiento se está guardando. */
  enVuelo?: ReadonlySet<string>;
  cargando?: boolean;
  etiqueta?: string;
}) {
  const [activa, setActiva] = useState<TareaVista<T> | null>(null);
  const vuelo = enVuelo ?? new Set<string>();

  const sensores = useSensors(
    // 6 px antes de arrastrar: un clic tembloroso no es un arrastre.
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 8 } }),
    useSensor(KeyboardSensor)
  );

  const porColumna = useMemo(() => {
    const mapa = new Map<string, TareaVista<T>[]>(columnas.map((c) => [c.id, []]));
    for (const t of tareas) mapa.get(t.columna)?.push(t);
    return mapa;
  }, [columnas, tareas]);

  const tituloColumna = (id: unknown) => columnas.find((c) => c.id === id)?.titulo ?? "otra columna";
  const tituloTarea = (id: unknown) => tareas.find((t) => t.id === id)?.titulo ?? "la tarea";

  function alSoltar(e: DragEndEvent) {
    setActiva(null);
    const tarea = tareas.find((t) => t.id === e.active.id);
    const destino = columnas.find((c) => c.id === e.over?.id);
    if (tarea && destino && destino.id !== tarea.columna) alSolicitarMovimiento(tarea, destino);
  }

  return (
    <DndContext
      sensors={sensores}
      collisionDetection={closestCorners}
      onDragStart={(e: DragStartEvent) => setActiva(tareas.find((t) => t.id === e.active.id) ?? null)}
      onDragEnd={alSoltar}
      onDragCancel={() => setActiva(null)}
      accessibility={{
        screenReaderInstructions: {
          draggable:
            "Para mover la tarea, pulsa Espacio. Con las flechas eliges la columna y con Espacio la sueltas. Escape cancela.",
        },
        announcements: {
          onDragStart: ({ active }) => `Levantaste «${tituloTarea(active.id)}».`,
          onDragOver: ({ over }) => (over ? `Sobre la columna «${tituloColumna(over.id)}».` : "Fuera de las columnas."),
          onDragEnd: ({ active, over }) =>
            over ? `Soltaste «${tituloTarea(active.id)}» en «${tituloColumna(over.id)}».` : "Soltaste la tarea fuera de las columnas.",
          onDragCancel: () => "Cancelaste el movimiento.",
        },
      }}
    >
      <div
        role="region"
        aria-label={etiqueta}
        className="relative -mx-4 flex snap-x snap-mandatory items-stretch gap-3 overflow-x-auto px-4 pb-4 sm:mx-0 sm:px-0"
      >
        {columnas.map((c) => (
          <Columna
            key={c.id}
            columna={c}
            tareas={porColumna.get(c.id) ?? []}
            columnas={columnas}
            alAbrir={alAbrir}
            alSolicitarMovimiento={alSolicitarMovimiento}
            enVuelo={vuelo}
            cargando={cargando}
          />
        ))}
      </div>
      <DragOverlay dropAnimation={null}>
        {activa ? <TarjetaTarea tarea={activa} arrastrando className="w-72" /> : null}
      </DragOverlay>
    </DndContext>
  );
}
