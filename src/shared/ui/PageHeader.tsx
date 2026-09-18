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
// En un telefono el menu ocupa un riel de 96 px y al titulo le quedan ~160.
// «Asignaciones» a 3xl mide 185 px de ancho minimo: una sola palabra que no
// cabe empuja la pagina entera y aparece scroll horizontal. De ahi el tamano
// menor en movil y el `break-words`, que es el que de verdad lo garantiza para
// cualquier titulo futuro, no solo para los de hoy.
//
// Psicosocial no se toca en este cambio. Se migrará cuando haya con qué
// comparar el resultado; hasta entonces este componente y su marcado son la
// misma cosa escrita dos veces, a propósito.

import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

import { AzulejoIcono } from "./AzulejoIcono";

type PageHeaderProps = {
  titulo: string;
  /**
   * La superficie o el módulo, sobre el título («Empresa»). Orienta a quien
   * cambia de pantalla sin tener que mirar el menú.
   */
  antetitulo?: string;
  /** Una línea. Si necesita dos, probablemente pertenece a la pantalla. */
  descripcion?: ReactNode;
  icono?: LucideIcon;
  /** La acción principal. Va a la derecha y hay como mucho una. */
  accion?: ReactNode;
  className?: string;
};

export function PageHeader({
  titulo,
  antetitulo,
  descripcion,
  icono: Icono,
  accion,
  className,
}: PageHeaderProps) {
  return (
    <section
      className={cn(
        "rounded-rel-panel border border-rel-border bg-rel-surface p-4 shadow-sm sm:p-6",
        className
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex min-w-0 flex-col items-start gap-3 sm:flex-row sm:items-center sm:gap-4">
          {Icono ? <AzulejoIcono icono={Icono} tamano="lg" /> : null}
          <div className="min-w-0">
            {antetitulo ? (
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-rel-accent">
                {antetitulo}
              </p>
            ) : null}
            <h1 className="break-words font-rel-heading text-xl font-black tracking-tight text-rel-dark sm:text-3xl">
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
