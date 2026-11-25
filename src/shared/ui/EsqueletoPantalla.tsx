// src/shared/ui/EsqueletoPantalla.tsx
//
// Esqueletos que tienen la FORMA de la pantalla que se está cargando.
//
// ## Por qué no basta una barra gris
//
// Un esqueleto genérico dice «espera». Uno con la forma de la pantalla dice
// «esto es lo que viene»: el ojo ya sabe dónde irá el título, dónde la lista y
// dónde el botón, y cuando llega el contenido NADA se mueve. Esa estabilidad
// —que la página no salte— es lo que se siente como velocidad, aunque la
// espera sea la misma.
//
// ## Regla de oro
//
// Cada esqueleto copia **la rejilla real** de su pantalla (mismas columnas,
// mismos anchos máximos, mismos huecos). Si la pantalla cambia de forma y el
// esqueleto no, el salto vuelve: por eso viven juntos, en un solo archivo, y se
// mencionan en la cabecera de la pantalla que imitan.
//
// ## Cómo se usan
//
// Siempre dentro de `Cargando` (recorrido del participante) o `ZonaCargando`
// (el resto): ambos retrasan 300 ms el primer pintado, y por debajo de eso no
// se ve nada. El `aria-busy` y el texto para lectores los pone el contenedor,
// no el esqueleto: aquí todo es decoración.
//
//   CURSO · LECCIÓN · ATERRIZAJE    → recorrido del participante
//   PAGINA_LISTA · DETALLE · FORM   → administración
//   TABLERO                         → el tablero de tareas

import { Esqueleto } from "@/shared/ui/Esqueleto";
import { cn } from "@/lib/utils";

/** Un bloque que entra con el escalonado de la casa, para que no aparezca de golpe. */
function Entra({ i = 0, className, children }: { i?: number; className?: string; children: React.ReactNode }) {
  return (
    <div
      className={cn("motion-safe:animate-entrada", className)}
      style={{ animationDelay: `calc(${i} * var(--motion-stagger))` }}
    >
      {children}
    </div>
  );
}

/** El curso del participante: titular + tarjeta de progreso + ruta de lecciones. */
export function EsqueletoCurso() {
  return (
    <div className="space-y-8" aria-hidden="true">
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_24rem]">
        <Entra className="space-y-3 py-2">
          <Esqueleto className="h-3 w-32" />
          <Esqueleto className="h-9 w-4/5 max-w-xl" />
          <Esqueleto className="h-9 w-2/3 max-w-md" />
          <Esqueleto className="mt-2 h-4 w-full max-w-2xl" />
          <div className="flex gap-6 pt-2">
            <Esqueleto className="h-4 w-24" />
            <Esqueleto className="h-4 w-28" />
          </div>
        </Entra>
        <Entra i={1} className="flex items-center gap-5 rounded-rel-panel border border-rel-border bg-rel-surface p-5">
          <Esqueleto className="h-28 w-28 shrink-0 rounded-full" />
          <div className="min-w-0 flex-1 space-y-3">
            <Esqueleto className="h-3 w-24" />
            <Esqueleto className="h-1.5 w-full rounded-full" />
            <Esqueleto className="h-3 w-3/4" />
          </div>
        </Entra>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="space-y-3">
          <Esqueleto className="h-6 w-48" />
          {Array.from({ length: 4 }).map((_, i) => (
            <Entra key={i} i={i + 2} className="flex gap-3 sm:gap-4">
              <Esqueleto className="h-8 w-8 shrink-0 rounded-full" />
              <div className="flex min-w-0 flex-1 items-center gap-3 rounded-rel-card border border-rel-border bg-rel-surface p-4">
                <Esqueleto className="h-11 w-11 shrink-0 rounded-rel-card" />
                <div className="min-w-0 flex-1 space-y-2">
                  <Esqueleto className="h-3 w-16" />
                  <Esqueleto className="h-4 w-3/4" />
                  <Esqueleto className="h-3 w-24" />
                </div>
                <Esqueleto className="hidden h-6 w-20 rounded-full sm:block" />
              </div>
            </Entra>
          ))}
        </div>
        <Entra i={3} className="hidden space-y-4 rounded-rel-panel border border-rel-border bg-rel-surface p-5 lg:block">
          <Esqueleto className="aspect-4/3 w-full rounded-rel-card" />
          <Esqueleto className="h-5 w-1/2" />
          <Esqueleto className="h-3 w-full" />
          <Esqueleto className="h-11 w-full rounded-rel-control" />
        </Entra>
      </div>
    </div>
  );
}

/** Una lección: volver, etiqueta, título, raya de partes y la tarjeta de lectura. */
export function EsqueletoLeccion() {
  return (
    <div className="mx-auto w-full max-w-6xl space-y-4" aria-hidden="true">
      <Esqueleto className="h-4 w-32" />
      <Esqueleto className="h-3 w-24" />
      <Esqueleto className="h-9 w-2/3 max-w-xl" />
      <div className="flex max-w-md gap-1.5">
        {Array.from({ length: 4 }).map((_, i) => (
          <Esqueleto key={i} className="h-2 flex-1 rounded-full" />
        ))}
      </div>
      <div className="grid gap-5 pt-1 lg:grid-cols-[minmax(0,1fr)_16rem]">
        <Entra className="space-y-3 rounded-rel-card border border-rel-border bg-rel-surface p-6 lg:p-10">
          <Esqueleto className="h-5 w-40" />
          <Esqueleto className="h-4 w-full" />
          <Esqueleto className="h-4 w-11/12" />
          <Esqueleto className="h-4 w-full" />
          <Esqueleto className="h-4 w-4/5" />
          <Esqueleto className="mt-4 h-4 w-full" />
          <Esqueleto className="h-4 w-2/3" />
        </Entra>
        <div className="hidden space-y-2 lg:block">
          <Esqueleto className="h-3 w-20" />
          {Array.from({ length: 4 }).map((_, i) => (
            <Esqueleto key={i} className="h-10 w-full rounded-rel-control" />
          ))}
        </div>
      </div>
    </div>
  );
}

/** La portada de un enlace: empresa, titular, datos, ilustración y botón. */
export function EsqueletoAterrizaje() {
  return (
    <div className="overflow-hidden rounded-rel-panel border border-rel-border bg-rel-surface" aria-hidden="true">
      <div className="grid items-center gap-6 p-5 sm:p-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(20rem,0.9fr)] lg:p-10">
        <div className="space-y-4">
          <Esqueleto className="h-7 w-56 rounded-full" />
          <Esqueleto className="h-10 w-full max-w-xl" />
          <Esqueleto className="h-10 w-3/4 max-w-md" />
          <Esqueleto className="h-4 w-full max-w-2xl" />
          <div className="flex flex-wrap gap-3 pt-2">
            <Esqueleto className="h-12 w-32 rounded-rel-control" />
            <Esqueleto className="h-12 w-40 rounded-rel-control" />
            <Esqueleto className="h-12 w-36 rounded-rel-control" />
          </div>
        </div>
        <Esqueleto className="mx-auto aspect-4/3 w-full max-w-md rounded-rel-card" />
      </div>
      <div className="border-t border-rel-border bg-rel-surface-subtle p-5 sm:p-6 lg:px-10">
        <Esqueleto className="h-14 w-full rounded-rel-control sm:ml-auto sm:w-56" />
      </div>
    </div>
  );
}

/** Una pantalla de administración con listado: encabezado, filtros y tabla. */
export function EsqueletoPaginaLista({ filas = 6 }: { filas?: number }) {
  return (
    <div className="space-y-6" aria-hidden="true">
      <div className="flex items-center gap-4">
        <Esqueleto className="h-14 w-14 shrink-0 rounded-rel-card" />
        <div className="flex-1 space-y-2">
          <Esqueleto className="h-3 w-28" />
          <Esqueleto className="h-7 w-64 max-w-full" />
        </div>
        <Esqueleto className="hidden h-11 w-36 rounded-rel-control sm:block" />
      </div>
      <div className="flex flex-wrap gap-3">
        <Esqueleto className="h-11 w-full max-w-xs rounded-rel-control" />
        <Esqueleto className="h-11 w-40 rounded-rel-control" />
        <Esqueleto className="h-10 w-24 rounded-full" />
        <Esqueleto className="h-10 w-24 rounded-full" />
      </div>
      <div className="overflow-hidden rounded-rel-panel border border-rel-border bg-rel-surface">
        <div className="flex gap-4 border-b border-rel-border bg-rel-surface-subtle px-4 py-3.5">
          <Esqueleto className="h-3 w-1/4" />
          <Esqueleto className="h-3 flex-1" />
          <Esqueleto className="h-3 flex-1" />
          <Esqueleto className="h-3 w-20" />
        </div>
        {Array.from({ length: filas }).map((_, i) => (
          <Entra key={i} i={i} className="flex items-center gap-4 border-b border-rel-border px-4 py-4 last:border-b-0">
            <div className="w-1/4 space-y-2">
              <Esqueleto className="h-4 w-full" />
              <Esqueleto className="h-3 w-2/3" />
            </div>
            <Esqueleto className="h-4 flex-1" />
            <Esqueleto className="h-6 flex-1 max-w-28 rounded-full" />
            <Esqueleto className="h-4 w-20" />
          </Entra>
        ))}
      </div>
    </div>
  );
}

/** El detalle de algo: cabecera y una rejilla de datos en dos columnas. */
export function EsqueletoDetalle() {
  return (
    <div className="space-y-6" aria-hidden="true">
      <div className="space-y-3">
        <Esqueleto className="h-3 w-24" />
        <Esqueleto className="h-8 w-2/3 max-w-lg" />
        <div className="flex gap-2">
          <Esqueleto className="h-6 w-24 rounded-full" />
          <Esqueleto className="h-6 w-20 rounded-full" />
        </div>
      </div>
      <div className="grid gap-5 rounded-rel-panel border border-rel-border bg-rel-surface p-6 sm:grid-cols-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Entra key={i} i={i} className="space-y-2">
            <Esqueleto className="h-3 w-24" />
            <Esqueleto className="h-5 w-3/4" />
          </Entra>
        ))}
      </div>
    </div>
  );
}

/** Un formulario: campos apilados con su etiqueta y el botón al final. */
export function EsqueletoFormulario({ campos = 4 }: { campos?: number }) {
  return (
    <div className="max-w-2xl space-y-5" aria-hidden="true">
      {Array.from({ length: campos }).map((_, i) => (
        <Entra key={i} i={i} className="space-y-2">
          <Esqueleto className="h-3 w-28" />
          <Esqueleto className="h-11 w-full rounded-rel-control" />
        </Entra>
      ))}
      <Esqueleto className="h-11 w-36 rounded-rel-control" />
    </div>
  );
}

/** El tablero: columnas con tarjetas de alturas distintas, como en la vida real. */
export function EsqueletoTablero({ columnas = 4 }: { columnas?: number }) {
  const alturas = [["h-28", "h-24", "h-32"], ["h-32", "h-24"], ["h-24"], ["h-28", "h-28"]];
  return (
    <div className="flex gap-3 overflow-hidden" aria-hidden="true">
      {Array.from({ length: columnas }).map((_, c) => (
        <div key={c} className="w-72 shrink-0 space-y-2 rounded-rel-card bg-rel-neutral-subtle/60 p-3">
          <div className="flex items-center gap-2 pb-1">
            <Esqueleto className="h-2.5 w-2.5 rounded-full" />
            <Esqueleto className="h-3 flex-1" />
          </div>
          {alturas[c % alturas.length].map((alto, i) => (
            <Entra key={i} i={c + i}>
              <Esqueleto className={cn(alto, "w-full rounded-rel-card")} />
            </Entra>
          ))}
        </div>
      ))}
    </div>
  );
}
