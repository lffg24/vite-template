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
            <AzulejoIcono
              icono={Icono}
              tono={l.completada ? "exito" : bloqueada ? "neutro" : "marca"}
              tamano="md"
              className="hidden sm:grid"
            />
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-rel-muted">
                Lección {i + 1}
              </p>
              <p className="break-words font-semibold text-rel-dark">{l.titulo}</p>
              <p className="text-sm text-rel-muted">{detalle(l)}</p>
            </div>
            <div className="flex shrink-0 flex-col items-start gap-1 sm:items-end">
              {l.completada ? (
                <Pill tono="exito">Completada</Pill>
              ) : enCurso ? (
                <Pill tono="marca">{l.bloques_vistos > 0 ? "En curso" : "Siguiente"}</Pill>
              ) : bloqueada ? (
                <>
                  <Pill tono="neutro" punto={false}>
                    <Lock className="h-3 w-3" aria-hidden="true" /> Bloqueada
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
          <li key={l.leccion_id} className="relative flex gap-3 sm:gap-4">
            {/* El riel: número o check, y la línea hasta la siguiente. */}
            <div className="flex flex-col items-center" aria-hidden="true">
              <span
                className={cn(
                  "grid h-9 w-9 shrink-0 place-items-center rounded-full text-sm font-bold",
                  l.completada
                    ? "bg-rel-success text-white"
                    : enCurso
                      ? "bg-rel-primary text-white"
                      : "bg-rel-neutral-subtle text-rel-muted"
                )}
              >
                {l.completada ? <Check className="h-4 w-4" /> : i + 1}
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
              <div className="mb-1 flex min-w-0 flex-1 rounded-rel-card border border-rel-border bg-rel-surface p-4 opacity-75">
                {tarjeta}
              </div>
            ) : (
              <Link
                to={`/c/sesion/leccion/${l.leccion_id}`}
                aria-current={enCurso ? "step" : undefined}
                className={cn(
                  "mb-1 flex min-w-0 flex-1 rounded-rel-card border bg-rel-surface p-4 transition-colors duration-rel-micro hover:bg-rel-surface-subtle",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rel-primary focus-visible:ring-offset-2",
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
