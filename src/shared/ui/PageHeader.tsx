// src/shared/ui/PageHeader.tsx
//
// La cabecera de pantalla de ABRIL-360: tarjeta blanca, azulejo con el icono
// del módulo, título grueso, subtítulo gris y la acción principal a la derecha.
//
// No es un diseño nuevo. Es el marcado que Psicosocial ya repite pantalla por
// pantalla (`EmpresasPsicoPage.tsx:29-36` es el ejemplar más limpio), extraído
// para que exista un sitio del que consumirlo. Ese era el problema de fondo:
// los patrones de la casa estaban copiados y pegados dentro de las páginas, así
// que un módulo nuevo no tenía de dónde tomarlos y acababa inventando los
// suyos — que es exactamente lo que le pasó a Capacitaciones.
//
// Psicosocial no se toca en este cambio. Se migrará cuando haya con qué
// comparar el resultado; hasta entonces este componente y su marcado son la
// misma cosa escrita dos veces, a propósito.

import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type PageHeaderProps = {
  titulo: string;
  /** Una línea. Si necesita dos, probablemente pertenece a la pantalla. */
  descripcion?: ReactNode;
  icono?: LucideIcon;
  /** La acción principal. Va a la derecha y hay como mucho una. */
  accion?: ReactNode;
  className?: string;
};

export function PageHeader({
  titulo,
  descripcion,
  icono: Icono,
  accion,
  className,
}: PageHeaderProps) {
  return (
    <section
      className={cn(
        "rounded-rel-panel border border-rel-border bg-rel-surface p-6 shadow-sm",
        className
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-4">
          {Icono ? (
            <div className="grid h-14 w-14 shrink-0 place-items-center rounded-rel-card bg-rel-accent-subtle text-rel-primary">
              <Icono className="h-7 w-7" aria-hidden="true" />
            </div>
          ) : null}
          <div className="min-w-0">
            <h1 className="font-rel-heading text-3xl font-black tracking-tight text-rel-dark">
              {titulo}
            </h1>
            {descripcion ? (
              <p className="max-w-prose font-rel-body text-sm text-rel-muted">{descripcion}</p>
            ) : null}
          </div>
        </div>
        {accion ? <div className="flex shrink-0 items-center gap-2">{accion}</div> : null}
      </div>
    </section>
  );
}
