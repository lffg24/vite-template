// src/features/participacion/RutaAprendizaje.tsx · D-03
//
// Las lecciones de un curso como un camino: número, línea que las une y, para
// cada una, qué es, en qué va y si se puede abrir.
//
// ## Qué lección está «en curso»
//
// La primera desbloqueada que no está completa. No se inventa aquí: el
// servidor ya decide `desbloqueada` y `completada`, y este componente solo
// elige cuál de las abiertas es la siguiente. Es la misma regla que usa el
// botón «Continuar», y por eso se exporta: si cada uno eligiera la suya, la
// ruta resaltaría una lección y el botón llevaría a otra.
//
// ## Lo bloqueado no es un botón
//
// Un botón deshabilitado sigue recibiendo el foco al tabular y promete algo
// que no cumple. La lección bloqueada es texto, y dice qué hacer para abrirla.

import { Link } from "react-router-dom";
import {
  Check,
  FileText,
  HelpCircle,
  Link2,
  Lock,
  PlayCircle,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { AzulejoIcono } from "@/shared/ui/AzulejoIcono";
import { Pill } from "@/shared/ui/Pill";
import type { LeccionEnCurso } from "@/types/participacion";
import { Caja, CLASES_CAJA_VIVA } from "@/shared/ui/Caja";

const ICONO_TIPO: Record<string, LucideIcon> = {
  NATIVA: FileText,
  VIDEO: PlayCircle,
  DOCUMENTO: FileText,
  RECURSO_EXTERNO: Link2,
  EVALUACION: HelpCircle,
};

const ETIQUETA_TIPO: Record<string, string> = {
  NATIVA: "Lectura",
  VIDEO: "Video",
  DOCUMENTO: "Documento",
  RECURSO_EXTERNO: "Recurso externo",
  EVALUACION: "Evaluación",
};

/** La siguiente lección que toca: la primera abierta sin terminar. */
export function siguienteLeccion(lecciones: LeccionEnCurso[]): LeccionEnCurso | undefined {
  return lecciones.find((l) => l.desbloqueada && !l.completada);
}

function detalle(l: LeccionEnCurso): string {
  const tipo = ETIQUETA_TIPO[l.tipo] ?? "Lección";
  if (l.completada) return tipo;
  if (l.bloques_vistos > 0) return `${tipo} · vas por ${l.bloques_vistos} de ${l.bloques_totales}`;
  return `${tipo} · ${l.bloques_totales} ${l.bloques_totales === 1 ? "parte" : "partes"}`;
}

export function RutaAprendizaje({ lecciones }: { lecciones: LeccionEnCurso[] }) {
  const actual = siguienteLeccion(lecciones);

  return (
    <ol className="space-y-3">
      {lecciones.map((l, i) => {
        const bloqueada = !l.desbloqueada && !l.completada;
        const enCurso = actual?.leccion_id === l.leccion_id;
        const ultima = i === lecciones.length - 1;
        const Icono = ICONO_TIPO[l.tipo] ?? FileText;

        const tarjeta = (
          <div className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:items-center">
            {/* El icono del tipo se ve también en el teléfono: «video»,
                «lectura», «evaluación» se reconocen antes de leer. */}
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <AzulejoIcono
                icono={Icono}
                tono={l.completada ? "exito" : bloqueada ? "neutro" : "marca"}
                tamano="md"
              />
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-rel-muted">
                  Lección {i + 1}
                </p>
                <p className="wrap-break-word font-semibold text-rel-dark">{l.titulo}</p>
                <p className="text-sm text-rel-muted">{detalle(l)}</p>
              </div>
            </div>
            <div className="flex shrink-0 flex-row flex-wrap items-center gap-2 sm:flex-col sm:items-end sm:gap-1">
              {l.completada ? (
                <Pill tono="exito">Completada</Pill>
              ) : enCurso ? (
                <Pill tono="marca">{l.bloques_vistos > 0 ? "En curso" : "Siguiente"}</Pill>
              ) : bloqueada ? (
                <>
                  <Pill tono="neutro" punto={false}>
                    <Lock className="h-3.5 w-3.5" aria-hidden="true" /> Bloqueada
                  </Pill>
                  <span className="text-xs text-rel-muted">Termina la lección anterior</span>
                </>
              ) : null}
              {!l.obligatoria ? (
                <Pill tono="info" punto={false} title="No cuenta para terminar el curso">
                  Complementaria
                </Pill>
              ) : null}
            </div>
          </div>
        );

        return (
          // Entran en cascada, una tras otra: el camino se despliega en vez de
          // aparecer entero de golpe. Tope de 6 para que una ruta larga no
          // haga esperar la última casi un segundo.
          <li
            key={l.leccion_id}
            className="relative flex gap-3 animate-in fade-in slide-in-from-bottom-[0.5rem] fill-mode-backwards duration-enter ease-rel-out motion-reduce:animate-none sm:gap-4"
            style={{ animationDelay: `${Math.min(i, 6) * 50}ms` }}
          >
            {/* El riel: número o check, y la línea hasta la siguiente. */}
            <div className="flex flex-col items-center" aria-hidden="true">
              <span
                className={cn(
                  "grid h-8 w-8 shrink-0 place-items-center rounded-full text-sm font-bold",
                  l.completada
                    ? "bg-rel-success text-white"
                    : enCurso
                      ? "bg-rel-primary text-white"
                      : "bg-rel-neutral-subtle text-rel-muted"
                )}
              >
                {l.completada ? <Check className="h-4 w-4" aria-hidden="true" /> : i + 1}
              </span>
              {!ultima ? (
                <span
                  className={cn(
                    "mt-1 w-0.5 flex-1",
                    l.completada ? "bg-rel-success/40" : "bg-rel-border"
                  )}
                />
              ) : null}
            </div>

            {bloqueada ? (
              <Caja className="mb-1 flex min-w-0 flex-1 opacity-75">
                {tarjeta}
              </Caja>
            ) : (
              <Link
                to={`/c/sesion/leccion/${l.leccion_id}`}
                aria-current={enCurso ? "step" : undefined}
                className={cn(
                  // La tarjeta ES la acción: se levanta al pasar el puntero (solo
                  // donde hay puntero) y la sombra crece. Ver `Caja viva`.
                  "mb-1 flex min-w-0 flex-1 rounded-rel-card border bg-rel-surface p-4 hover:bg-rel-surface-subtle",
                  CLASES_CAJA_VIVA,
                  "focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-rel-primary focus-visible:ring-offset-2",
                  enCurso ? "border-rel-primary bg-rel-accent-subtle/40" : "border-rel-border"
                )}
              >
                {tarjeta}
              </Link>
            )}
          </li>
        );
      })}
    </ol>
  );
}
