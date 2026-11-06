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
import {
  Illustration,
  type IllustrationName,
} from "./illustration";

export type PageHeaderProps = {
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
  /** Cabecera operativa normal o cabecera institucional de entrada a sección. */
  variant?: "standard" | "dark-illustrated";
  /** Clave semántica del registro oficial. Nunca una ruta de archivo. */
  illustration?: IllustrationName;
  breadcrumbs?: ReactNode;
  status?: ReactNode;
  className?: string;
};

export function PageHeader({
  titulo,
  antetitulo,
  descripcion,
  icono: Icono,
  accion,
  variant = "standard",
  illustration,
  breadcrumbs,
  status,
  className,
}: PageHeaderProps) {
  if (variant === "dark-illustrated") {
    return (
      <section
        className={cn(
          "relative isolate min-h-[8rem] overflow-hidden rounded-rel-panel border border-white/10 bg-rel-dark px-5 py-6 text-white shadow-card sm:px-7 md:min-h-[9rem] md:py-7",
          className,
        )}
      >
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -right-16 -top-24 -z-10 h-72 w-72 rounded-full bg-rel-primary/15 blur-3xl"
        />
        <div className="grid min-w-0 items-center gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(13rem,30%)_auto]">
          <div className="min-w-0">
            {breadcrumbs ? <div className="mb-3 text-xs text-white/70">{breadcrumbs}</div> : null}
            <div className="flex min-w-0 items-start gap-3 sm:gap-4">
              {Icono ? (
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-rel-control border border-white/15 bg-white/10 text-rel-turquoise sm:h-14 sm:w-14">
                  <Icono className="h-6 w-6" aria-hidden="true" />
                </span>
              ) : null}
              <div className="min-w-0">
                {antetitulo ? (
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-rel-turquoise">
                    {antetitulo}
                  </p>
                ) : null}
                <h1 className="break-words font-rel-heading text-2xl font-black tracking-tight text-white sm:text-3xl">
                  {titulo}
                </h1>
                {descripcion ? (
                  <p className="mt-1 max-w-2xl font-rel-body text-sm leading-6 text-white/75">
                    {descripcion}
                  </p>
                ) : null}
                {status ? <div className="mt-3">{status}</div> : null}
              </div>
            </div>
          </div>

          <div className="pointer-events-none hidden h-28 items-center justify-center xl:flex" aria-hidden="true">
            {illustration ? (
              <Illustration
                name={illustration}
                variant="hero"
                size="full"
                decorative
                priority
                className="max-h-36 w-full object-contain object-center"
              />
            ) : null}
          </div>
          {accion ? <div className="flex w-full shrink-0 items-center xl:w-auto">{accion}</div> : null}
        </div>
      </section>
    );
  }

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
        {accion ? <div className="flex w-full shrink-0 items-center gap-2 sm:w-auto">{accion}</div> : null}
      </div>
    </section>
  );
}
