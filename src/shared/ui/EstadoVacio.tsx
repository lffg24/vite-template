// src/shared/ui/EstadoVacio.tsx
//
// La pantalla vacía de la casa: «no hay nada todavía» y «tu filtro no encaja»,
// que no son lo mismo y confundirlos hace creer a alguien que perdió su
// información.
//
// ## Por qué se movió aquí
//
// Esta pieza existía y estaba bien hecha, pero vivía en
// `features/capacitaciones/components/EstadoPantalla.tsx`. El efecto de eso se
// medía solo: las doce pantallas de Capacitaciones tienen su vacío ilustrado,
// y ninguna de CX, superadmin o evaluaciones lo tenía, porque escribir
// `import … from "@/features/capacitaciones/…"` en una pantalla de CX es algo
// que nadie quiere escribir. Dos pantallas de evaluaciones lo escribieron de
// todos modos, que es la otra forma en que esto se paga.
//
// Y al mismo tiempo la casa tenía `IllustratedEmptyState`, bien colocado y
// usado por **nadie**. Dos vacíos: uno bueno en el sitio equivocado y otro en
// el sitio correcto sin usar. Por eso un producto con 75 ilustraciones
// producidas las mostraba en un solo módulo.
//
// ## La ilustración es opcional, y eso es del sistema
//
// El sistema de ilustración gradúa la intensidad por superficie: superadmin
// baja, empresa media-baja, colaborador media-alta. Un vacío ilustrado en cada
// tabla de superadmin no es más cuidado, es ruido en una herramienta de
// administración. Con `escena="ninguna"` la pieza da la misma estructura sin
// dibujo, así que la graduación se puede cumplir sin que nadie escriba un
// vacío a mano.
//
// El defecto sigue siendo `checklist`, el que ya tenía: las doce pantallas que
// no eligen escena se ven exactamente como se veían.

import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Illustration, type IllustrationName } from "./illustration";

/**
 * Vacío legítimo: no hay nada todavía y eso está bien.
 *
 * Lleva siempre la acción que lo resuelve, cuando existe. Un vacío sin salida
 * deja a alguien mirando un dibujo sin saber qué hacer.
 */
export function EstadoVacio({
  titulo,
  descripcion,
  accion,
  escena = "checklist",
  className,
}: {
  titulo: string;
  descripcion?: ReactNode;
  accion?: ReactNode;
  /**
   * Qué se dibuja en el hueco. Sale del registro único de ilustraciones.
   *
   * Se elige por pantalla porque el vacío de Participantes y el de Constancias
   * no son el mismo vacío. Sin escena no hay dibujo, y eso es una opción
   * legítima, no un olvido: ver la nota de intensidad por superficie arriba.
   */
  escena?: IllustrationName | "ninguna";
  className?: string;
}) {
  const dibujo = escena === "ninguna" ? null : escena;
  return (
    <div
      className={cn(
        "rounded-rel-panel border border-dashed border-rel-border-strong bg-rel-surface-subtle px-6 text-center",
        dibujo ? "py-12" : "py-10",
        className
      )}
    >
      {dibujo ? <Illustration name={dibujo} variant="spot" size="lg" className="mx-auto" /> : null}
      <h3
        className={cn(
          "font-rel-heading text-lg font-bold text-rel-dark",
          dibujo && "mt-4"
        )}
      >
        {titulo}
      </h3>
      {descripcion ? (
        <p className="mx-auto mt-2 max-w-prose font-rel-body text-sm text-rel-muted">
          {descripcion}
        </p>
      ) : null}
      {accion ? <div className="mt-6 flex justify-center">{accion}</div> : null}
    </div>
  );
}

/**
 * Búsqueda o filtro sin resultados. NO es lo mismo que no tener datos.
 *
 * Antes decía «Ningún curso coincide con el filtro», con la palabra «curso»
 * escrita dentro de la pieza. Eso la ataba a Capacitaciones: una lista de
 * áreas que la usara mentiría. Ahora el nombre de lo que se busca entra por
 * parámetro, y el defecto es genérico.
 */
export function SinResultados({
  limpiar,
  elemento = "registro",
  className,
}: {
  limpiar: () => void;
  /** En singular: «curso», «área», «participante». */
  elemento?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-rel-card border border-rel-border bg-rel-surface px-6 py-10 text-center",
        className
      )}
    >
      <Illustration name="buscar" variant="spot" size="sm" className="mx-auto mb-4" />
      <h3 className="font-rel-heading text-base font-bold text-rel-dark">
        Ningún {elemento} coincide con el filtro
      </h3>
      {/* «Hay más en la lista» y no «hay cursos en el catálogo»: pluralizar el
          nombre que entra por parámetro obliga a adivinar, y adivinar en
          castellano sale mal más veces de las que sale bien. Esta frase es
          correcta con cualquier nombre. */}
      <p className="mt-1 font-rel-body text-sm text-rel-muted">
        Hay más en la lista; ninguno cumple lo que estás buscando.
      </p>
      <Button variant="relGhost" size="sm" className="mt-4" onClick={limpiar}>
        Quitar los filtros
      </Button>
    </div>
  );
}

/**
 * El nombre con el que doce pantallas de Capacitaciones ya la llaman.
 *
 * Se mantiene como alias para no reescribir dieciséis bloques de importación
 * por un cambio de sitio. Es un alias, no una segunda definición: hay una
 * implementación y una prueba que lo vigila.
 */
export const SinDatos = EstadoVacio;
