// src/shared/ui/tablero/AvatarPersona.tsx
//
// Las iniciales de alguien, en un círculo de color estable: la misma persona
// es del mismo color en toda pantalla, sin que nadie lo configure.
//
// El color sale de un hash del `id`, repartido entre los tonos del sistema (los
// mismos que `AzulejoIcono`), nunca de un valor suelto. El nombre completo va
// como nombre accesible: las iniciales solas no dicen quién es.

import { cn } from "@/lib/utils";
import type { PersonaTarea } from "./modelo";

const COLORES = [
  "bg-rel-accent-subtle text-rel-primary",
  "bg-rel-info-subtle text-rel-info",
  "bg-rel-warning-subtle text-rel-warning",
  "bg-rel-success-subtle text-rel-success",
  "bg-rel-neutral-subtle text-rel-dark",
] as const;

const TAMANO = {
  sm: "h-6 w-6 text-[10px]",
  md: "h-8 w-8 text-xs",
} as const;

export function iniciales(nombre: string): string {
  const partes = nombre.trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) return "?";
  const primera = partes[0][0];
  const ultima = partes.length > 1 ? partes[partes.length - 1][0] : "";
  return (primera + ultima).toUpperCase();
}

function colorDe(id: string): string {
  let h = 0;
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return COLORES[h % COLORES.length];
}

export function AvatarPersona({
  persona,
  tamano = "sm",
  className,
}: {
  persona: PersonaTarea;
  tamano?: keyof typeof TAMANO;
  className?: string;
}) {
  return (
    <span
      role="img"
      aria-label={persona.nombre}
      title={persona.nombre}
      className={cn(
        "grid shrink-0 place-items-center rounded-full font-bold ring-2 ring-rel-surface",
        TAMANO[tamano],
        colorDe(persona.id),
        className
      )}
    >
      <span aria-hidden="true">{iniciales(persona.nombre)}</span>
    </span>
  );
}

/** Varias personas solapadas; pasado `max`, un «+N». */
export function GrupoAvatares({
  personas,
  max = 3,
  tamano = "sm",
}: {
  personas: PersonaTarea[];
  max?: number;
  tamano?: keyof typeof TAMANO;
}) {
  if (personas.length === 0) return null;
  const visibles = personas.slice(0, max);
  const resto = personas.length - visibles.length;
  return (
    <span className="flex items-center -space-x-2">
      {visibles.map((p) => (
        <AvatarPersona key={p.id} persona={p} tamano={tamano} />
      ))}
      {resto > 0 ? (
        <span
          role="img"
          aria-label={`y ${resto} más`}
          className={cn(
            "grid shrink-0 place-items-center rounded-full bg-rel-neutral-subtle font-bold text-rel-muted ring-2 ring-rel-surface",
            TAMANO[tamano]
          )}
        >
          <span aria-hidden="true">+{resto}</span>
        </span>
      ) : null}
    </span>
  );
}
