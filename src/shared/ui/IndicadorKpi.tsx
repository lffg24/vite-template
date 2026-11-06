// src/shared/ui/IndicadorKpi.tsx
//
// Un número que importa, con su nombre y su contexto: «Vencidas · 7 ·
// requieren atención inmediata».
//
// El contexto no es adorno. «132» sin «de 157 asignaciones» no dice si es
// mucho o poco, y una cifra que no se puede interpretar se ignora.
//
// El tono es semántico por la misma regla que `Pill`: el azulejo rojo lo lleva
// lo vencido, no lo que se quiera destacar.

import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

import { AzulejoIcono, type TonoAzulejo } from "./AzulejoIcono";

export function IndicadorKpi({
  etiqueta,
  valor,
  contexto,
  icono,
  tono = "marca",
  visual,
  className,
}: {
  etiqueta: string;
  valor: ReactNode;
  contexto?: ReactNode;
  icono?: LucideIcon;
  tono?: TonoAzulejo;
  /** En lugar del azulejo, p. ej. un `AnilloProgreso`. */
  visual?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex min-w-0 items-center gap-4 rounded-rel-panel border border-rel-border bg-rel-surface p-4 shadow-sm sm:p-5",
        className
      )}
    >
      {visual ?? (icono ? <AzulejoIcono icono={icono} tono={tono} tamano="lg" /> : null)}
      <div className="min-w-0">
        <p className="text-sm font-semibold text-rel-muted">{etiqueta}</p>
        <p className="font-rel-heading text-3xl font-black tabular-nums leading-tight text-rel-dark">
          {valor}
        </p>
        {contexto ? <p className="text-xs text-rel-muted">{contexto}</p> : null}
      </div>
    </div>
  );
}
