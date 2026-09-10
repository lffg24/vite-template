// src/features/capacitaciones/components/EstadoPantalla.tsx
//
// Los estados que la constitución §26 exige diseñar y que casi nunca se
// diseñan: carga, vacío, error recuperable, error bloqueante y permisos
// insuficientes. Viven en un solo sitio para que las seis pantallas del módulo
// no inventen cada una su propio «Ocurrió un error».

import type { ReactNode } from "react";
import { RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Ilustracion, type NombreIlustracion } from "@/shared/ui/ilustraciones";
import { Skeleton } from "@/components/ui/skeleton";
import type { ErrorApi } from "@/types/capacitaciones";

/**
 * Esqueleto de tabla.
 *
 * Se usa un esqueleto y no un spinner porque conserva la forma de lo que va a
 * llegar: el salto de layout al aparecer los datos es lo que hace sentir lenta
 * una pantalla que no lo es.
 */
export function CargandoTabla({ filas = 4 }: { filas?: number }) {
  return (
    <div
      className="space-y-3"
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label="Cargando"
    >
      <span className="sr-only">Cargando información…</span>
      {Array.from({ length: filas }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 rounded-rel-card border border-rel-border bg-rel-surface p-4"
        >
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="ml-auto h-4 w-16" />
        </div>
      ))}
    </div>
  );
}

export function CargandoPanel({ etiqueta = "Cargando información…" }: { etiqueta?: string }) {
  return (
    <div
      className="space-y-4 rounded-rel-panel border border-rel-border bg-rel-surface p-6"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <span className="sr-only">{etiqueta}</span>
      <Skeleton className="h-6 w-1/2" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-2/3" />
    </div>
  );
}

/**
 * Vacío legítimo: no hay nada todavía y eso está bien.
 *
 * Lleva siempre la acción que lo resuelve. Un vacío sin salida deja al usuario
 * mirando una ilustración sin saber qué hacer.
 *
 * `ilustracion` se elige por pantalla porque el vacío de Participantes y el de
 * Constancias no son el mismo vacío. El defecto genérico existe para que nadie
 * tenga que pensarlo cuando da igual.
 */
export function SinDatos({
  titulo,
  descripcion,
  accion,
  ilustracion = "vacio",
}: {
  titulo: string;
  descripcion: string;
  accion?: ReactNode;
  ilustracion?: NombreIlustracion;
}) {
  return (
    <div className="rounded-rel-panel border border-dashed border-rel-border-strong bg-rel-surface-subtle px-6 py-12 text-center">
      <Ilustracion nombre={ilustracion} tamano="md" className="mx-auto" />
      <h3 className="mt-4 font-rel-heading text-lg font-bold text-rel-dark">{titulo}</h3>
      <p className="mx-auto mt-2 max-w-prose font-rel-body text-sm text-rel-muted">
        {descripcion}
      </p>
      {accion ? <div className="mt-6 flex justify-center">{accion}</div> : null}
    </div>
  );
}

/** Búsqueda o filtro sin resultados. NO es lo mismo que no tener datos. */
export function SinResultados({ limpiar }: { limpiar: () => void }) {
  return (
    <div className="rounded-rel-card border border-rel-border bg-rel-surface px-6 py-10 text-center">
      <Ilustracion nombre="busqueda" tamano="sm" className="mx-auto mb-4" />
      <h3 className="font-rel-heading text-base font-bold text-rel-dark">
        Ningún curso coincide con el filtro
      </h3>
      <p className="mt-1 font-rel-body text-sm text-rel-muted">
        Hay cursos en el catálogo; ninguno cumple lo que estás buscando.
      </p>
      <Button variant="relGhost" size="sm" className="mt-4" onClick={limpiar}>
        Quitar los filtros
      </Button>
    </div>
  );
}

/**
 * Error recuperable: se puede reintentar sin perder nada.
 *
 * Se muestra el mensaje del backend porque está redactado para leerse. Los
 * mensajes de este módulo dicen qué pasó y cómo se arregla, no «Error 500».
 */
export function ErrorConsulta({
  error,
  reintentar,
}: {
  error: ErrorApi;
  reintentar: () => void;
}) {
  const esPermiso = error.status === 403;

  if (esPermiso) return <SinPermiso mensaje={error.message} />;

  return (
    <div
      role="alert"
      className="rounded-rel-panel border border-rel-danger/30 bg-rel-danger-subtle p-6"
    >
      <div className="flex items-start gap-3">
        <Ilustracion nombre="error" tamano="sm" className="shrink-0" />
        <div className="min-w-0">
          <h3 className="font-rel-heading text-base font-bold text-rel-dark">
            No pudimos cargar esta información
          </h3>
          <p className="mt-1 font-rel-body text-sm text-rel-dark/80">{error.message}</p>
          <Button variant="relOutline" size="sm" className="mt-4" onClick={reintentar}>
            <RefreshCw aria-hidden="true" />
            Reintentar
          </Button>
        </div>
      </div>
    </div>
  );
}

/**
 * Permisos insuficientes, o módulo no habilitado.
 *
 * Manda a A-08 en vez de repetir «no tienes permiso», porque el 403 del backend
 * cubre tres causas que se arreglan de formas distintas: no está contratado, la
 * bandera está apagada, o a este usuario le falta el permiso. La pantalla de
 * estado las separa; aquí solo se sabe que alguna se cumplió.
 */
export function SinPermiso({ mensaje }: { mensaje?: string }) {
  return (
    <div
      role="alert"
      className="rounded-rel-panel border border-rel-warning/30 bg-rel-warning-subtle p-6"
    >
      <div className="flex items-start gap-3">
        <Ilustracion nombre="bloqueado" tamano="sm" className="shrink-0" />
        <div className="min-w-0">
          <h3 className="font-rel-heading text-base font-bold text-rel-dark">
            Esta acción no está disponible
          </h3>
          <p className="mt-1 font-rel-body text-sm text-rel-dark/80">
            {mensaje ?? "El módulo no está habilitado para esta empresa o tu rol no incluye esta operación."}
          </p>
          <p className="mt-3 font-rel-body text-sm text-rel-muted">
            Revisa el estado del módulo para ver cuál de las tres condiciones falta:
            contrato, habilitación técnica o permiso.
          </p>
          <Button variant="relOutline" size="sm" className="mt-4" asChild>
            <a href="/capacitaciones/estado">Ver estado del módulo</a>
          </Button>
        </div>
      </div>
    </div>
  );
}
