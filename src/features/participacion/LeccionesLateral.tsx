// src/features/participacion/LeccionesLateral.tsx · D-05
//
// El índice del curso, al lado de la lección que se lee. Solo en pantallas
// anchas: en el teléfono no hay lado, y ahí «Volver al curso» cumple.
//
// Sirve para saber DÓNDE se está sin salir de la lección: cuántas hay, cuál es
// esta, cuáles ya pasaron. No es navegación libre. Lo bloqueado es texto, igual
// que en `RutaAprendizaje`, y por la misma razón: un botón inactivo se tabula y
// promete algo que no cumple. El servidor decide `desbloqueada`; aquí no se
// recalcula.

import { Link } from "react-router-dom";
import { Check, Lock } from "lucide-react";

import { cn } from "@/lib/utils";
import type { LeccionEnCurso } from "@/types/participacion";

export function LeccionesLateral({
  lecciones,
  actualId,
}: {
  lecciones: LeccionEnCurso[];
  actualId: string;
}) {
  return (
    <nav aria-label="Lecciones del curso">
      <p className="text-xs font-bold uppercase tracking-[0.12em] text-rel-muted">Tu curso</p>
      <ol className="mt-3 space-y-1">
        {lecciones.map((l, i) => {
          const esta = l.leccion_id === actualId;
          const bloqueada = !l.desbloqueada && !l.completada;
          const contenido = (
            <>
              <span
                aria-hidden="true"
                className={cn(
                  "grid h-6 w-6 shrink-0 place-items-center rounded-full text-xs font-bold",
                  l.completada
                    ? "bg-rel-success text-success-foreground"
                    : esta
                      ? "bg-rel-primary text-rel-primary-foreground"
                      : "bg-rel-neutral-subtle text-rel-muted"
                )}
              >
                {l.completada ? <Check className="h-3.5 w-3.5" aria-hidden="true" /> : i + 1}
              </span>
              <span className="min-w-0 flex-1 wrap-break-word text-sm">{l.titulo}</span>
              {bloqueada ? (
                <>
                  <Lock className="h-3.5 w-3.5 shrink-0 text-rel-muted" aria-hidden="true" />
                  <span className="sr-only">Bloqueada</span>
                </>
              ) : null}
            </>
          );
          const base = "flex items-center gap-3 rounded-rel-control px-3 py-2.5";
          return (
            <li key={l.leccion_id}>
              {bloqueada ? (
                <div className={cn(base, "text-rel-muted")}>{contenido}</div>
              ) : (
                <Link
                  to={`/c/sesion/leccion/${l.leccion_id}`}
                  aria-current={esta ? "step" : undefined}
                  className={cn(
                    base,
                    "transition-colors duration-exit hover:bg-rel-surface-subtle focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-rel-primary",
                    esta ? "bg-rel-accent-subtle font-semibold text-rel-dark" : "text-rel-dark"
                  )}
                >
                  {contenido}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
