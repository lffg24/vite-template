// src/shared/ui/tablero/TarjetaTarea.tsx
//
// La tarjeta de una tarea. Es PRESENTACIONAL: no sabe arrastrarse ni de qué
// dominio viene. El tablero la envuelve para arrastrar; la lista no la usa.
//
// ## Qué lleva y en qué orden (lo que hace Jira, por algo)
//
//   1. clave + prioridad + menú     → «de qué hablo» y «qué tan urgente»
//   2. título                       → lo que hay que hacer, hasta tres líneas
//   3. etiquetas                    → clasificación, sin ocupar una fila entera
//   4. fecha · conteos · responsables → lo que cambia con el tiempo y quién
//
// ## Dos reglas de interacción
//
// - **El título es el botón que abre el detalle.** No toda la tarjeta: la
//   tarjeta entera es la superficie de arrastre, y un clic y un arrastre sobre
//   el mismo sitio se pelean. Con el título como botón, el teclado tiene una
//   forma clara de abrir (Enter) distinta de la de arrastrar (Espacio).
// - **«Mover a…» existe siempre.** Arrastrar no se puede con un lector de
//   pantalla ni, bien, con el pulgar sobre una columna que hace scroll. El
//   menú es la misma acción con un camino accesible, no un extra.

import { CalendarClock, Lock, MessageSquare, MoreHorizontal, Paperclip } from "lucide-react";
import { useState } from "react";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Pill } from "@/shared/ui/Pill";
import { GrupoAvatares } from "./AvatarPersona";
import { IndicadorPrioridad } from "./IndicadorPrioridad";
import {
  estaVencida,
  formatearVence,
  type ColumnaTablero,
  type TareaVista,
} from "./modelo";

export function TarjetaTarea<T>({
  tarea,
  columnas,
  alAbrir,
  alMover,
  arrastrando = false,
  enVuelo = false,
  className,
}: {
  tarea: TareaVista<T>;
  /** Para el menú «Mover a…». Sin ellas, no hay menú. */
  columnas?: ColumnaTablero[];
  alAbrir?: (tarea: TareaVista<T>) => void;
  alMover?: (tarea: TareaVista<T>, destino: ColumnaTablero) => void;
  /** Es la copia que sigue al puntero: más relieve, ligeramente inclinada. */
  arrastrando?: boolean;
  /** Se está guardando su movimiento: se atenúa y no responde. */
  enVuelo?: boolean;
  className?: string;
}) {
  const [menu, setMenu] = useState(false);
  const vencida = estaVencida(tarea.vence);
  const destinos = (columnas ?? []).filter((c) => c.id !== tarea.columna);

  return (
    <article
      aria-busy={enVuelo || undefined}
      className={cn(
        "rounded-rel-card border border-rel-border bg-rel-surface p-3 text-left shadow-rel-soft",
        "transition-[translate,box-shadow,opacity] duration-enter ease-rel-out motion-reduce:transition-none",
        "hover:shadow-rel-card",
        arrastrando && "rotate-2 cursor-grabbing border-rel-primary/50 shadow-rel-floating",
        enVuelo && "pointer-events-none opacity-60",
        className
      )}
    >
      <div className="flex items-center gap-2">
        {tarea.clave ? (
          <span className="text-xs font-semibold tabular-nums text-rel-muted">{tarea.clave}</span>
        ) : null}
        {tarea.prioridad ? <IndicadorPrioridad prioridad={tarea.prioridad} /> : null}
        {tarea.bloqueada ? (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-rel-danger">
            <Lock className="h-3.5 w-3.5" aria-hidden="true" />
            Bloqueada
          </span>
        ) : null}

        {destinos.length > 0 && alMover ? (
          <Popover open={menu} onOpenChange={setMenu}>
            <PopoverTrigger asChild>
              <button
                type="button"
                aria-label={`Más acciones para ${tarea.titulo}`}
                className="ml-auto grid h-8 w-8 shrink-0 place-items-center rounded-rel-control text-rel-muted transition-colors duration-exit hover:bg-rel-neutral-subtle hover:text-rel-dark focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-rel-primary"
              >
                <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
              </button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-52 rounded-rel-card border-rel-border bg-rel-surface p-1.5 shadow-rel-floating">
              <p className="px-2.5 pb-1 pt-1.5 text-xs font-bold uppercase tracking-[0.12em] text-rel-muted">
                Mover a
              </p>
              <ul>
                {destinos.map((c) => (
                  <li key={c.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setMenu(false);
                        alMover(tarea, c);
                      }}
                      className="flex min-h-11 w-full items-center rounded-rel-control px-2.5 text-left text-sm font-medium text-rel-dark transition-colors duration-exit hover:bg-rel-surface-subtle focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-rel-primary"
                    >
                      {c.titulo}
                    </button>
                  </li>
                ))}
              </ul>
            </PopoverContent>
          </Popover>
        ) : null}
      </div>

      {alAbrir ? (
        <button
          type="button"
          onClick={() => alAbrir(tarea)}
          className="-mx-1 mt-2 line-clamp-3 w-[calc(100%+8px)] rounded-rel-control px-1 text-left text-sm font-semibold leading-snug text-rel-dark hover:text-rel-primary focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-rel-primary"
        >
          {tarea.titulo}
        </button>
      ) : (
        <p className="mt-2 line-clamp-3 text-sm font-semibold leading-snug text-rel-dark">{tarea.titulo}</p>
      )}

      {tarea.etiquetas && tarea.etiquetas.length > 0 ? (
        <ul className="mt-2.5 flex flex-wrap gap-1.5">
          {tarea.etiquetas.map((e) => (
            <li key={e.texto}>
              <Pill tono={e.tono ?? "neutro"} punto={false}>
                {e.texto}
              </Pill>
            </li>
          ))}
        </ul>
      ) : null}

      <div className="mt-3 flex items-center gap-3 text-xs text-rel-muted">
        {tarea.vence ? (
          <span
            className={cn("inline-flex items-center gap-1 font-medium", vencida && "text-rel-danger")}
            title={vencida ? "Vencida" : "Fecha límite"}
          >
            <CalendarClock className="h-3.5 w-3.5" aria-hidden="true" />
            {formatearVence(tarea.vence)}
            {vencida ? <span className="sr-only"> (vencida)</span> : null}
          </span>
        ) : null}
        {tarea.comentarios ? (
          <span className="inline-flex items-center gap-1" title="Comentarios">
            <MessageSquare className="h-3.5 w-3.5" aria-hidden="true" />
            {tarea.comentarios}
            <span className="sr-only"> comentarios</span>
          </span>
        ) : null}
        {tarea.adjuntos ? (
          <span className="inline-flex items-center gap-1" title="Adjuntos">
            <Paperclip className="h-3.5 w-3.5" aria-hidden="true" />
            {tarea.adjuntos}
            <span className="sr-only"> adjuntos</span>
          </span>
        ) : null}
        {tarea.responsables && tarea.responsables.length > 0 ? (
          <span className="ml-auto">
            <GrupoAvatares personas={tarea.responsables} />
          </span>
        ) : null}
      </div>
    </article>
  );
}
