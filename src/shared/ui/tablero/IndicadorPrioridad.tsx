// src/shared/ui/tablero/IndicadorPrioridad.tsx
//
// La prioridad como símbolo: un gesto de flechas que se reconoce de un vistazo.
// Forma Y color dicen lo mismo (no solo color), y siempre hay un nombre
// accesible: «Prioridad alta», no «flecha arriba».

import { ChevronDown, ChevronUp, ChevronsUp, Equal, type LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { ETIQUETA_PRIORIDAD, type PrioridadTarea } from "./modelo";

const CONFIG: Record<PrioridadTarea, { Icono: LucideIcon; color: string }> = {
  critica: { Icono: ChevronsUp, color: "text-rel-danger" },
  alta: { Icono: ChevronUp, color: "text-rel-warning" },
  media: { Icono: Equal, color: "text-rel-info" },
  baja: { Icono: ChevronDown, color: "text-rel-muted" },
};

export function IndicadorPrioridad({
  prioridad,
  conTexto = false,
  className,
}: {
  prioridad: PrioridadTarea;
  /** En la lista y el detalle se escribe; en la tarjeta basta el símbolo. */
  conTexto?: boolean;
  className?: string;
}) {
  const { Icono, color } = CONFIG[prioridad];
  const nombre = ETIQUETA_PRIORIDAD[prioridad];
  return (
    <span
      className={cn("inline-flex items-center gap-1 text-sm font-medium", color, className)}
      title={`Prioridad ${nombre.toLowerCase()}`}
    >
      <Icono className="h-4 w-4 shrink-0" aria-hidden="true" />
      {conTexto ? (
        <span className="text-rel-dark">{nombre}</span>
      ) : (
        <span className="sr-only">Prioridad {nombre.toLowerCase()}</span>
      )}
    </span>
  );
}
