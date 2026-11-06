// src/shared/ui/AzulejoIcono.tsx
//
// El azulejo: un icono dentro de un cuadrado redondeado de fondo suave. Es la
// pieza que más se repite en el diseño —cabeceras, indicadores, lecciones,
// alertas— y vivía copiada dentro de `PageHeader` y de cada pantalla.
//
// El tono sigue la misma regla que `Pill`: semántico o de marca, nunca un color
// suelto. Un azulejo rojo dice «vencido» igual que una píldora roja.

import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

export type TonoAzulejo = "marca" | "exito" | "atencion" | "peligro" | "info" | "neutro";

const TONO: Record<TonoAzulejo, string> = {
  marca: "bg-rel-accent-subtle text-rel-primary",
  exito: "bg-rel-success-subtle text-rel-success",
  atencion: "bg-rel-warning-subtle text-rel-warning",
  peligro: "bg-rel-danger-subtle text-rel-danger",
  info: "bg-rel-info-subtle text-rel-info",
  neutro: "bg-rel-neutral-subtle text-rel-muted",
};

const TAMANO = {
  sm: { caja: "h-9 w-9 rounded-rel-control", icono: "h-4 w-4" },
  md: { caja: "h-11 w-11 rounded-rel-card", icono: "h-5 w-5" },
  lg: { caja: "h-10 w-10 rounded-rel-card sm:h-14 sm:w-14", icono: "h-5 w-5 sm:h-7 sm:w-7" },
} as const;

export function AzulejoIcono({
  icono: Icono,
  tono = "marca",
  tamano = "md",
  className,
}: {
  icono: LucideIcon;
  tono?: TonoAzulejo;
  tamano?: keyof typeof TAMANO;
  className?: string;
}) {
  const t = TAMANO[tamano];
  return (
    <span aria-hidden="true" className={cn("grid shrink-0 place-items-center", t.caja, TONO[tono], className)}>
      <Icono className={t.icono} />
    </span>
  );
}
