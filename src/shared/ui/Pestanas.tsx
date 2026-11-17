// src/shared/ui/Pestanas.tsx
//
// Cambiar entre vistas de la MISMA pantalla sin recargar nada.
//
// ## Por qué hacía falta crearla y no migrar nada
//
// Es la única pieza del inventario que no existía en ninguna parte. Lo que
// había eran tres imitaciones, las tres en `SuperAdminRolesPermisosPage`, y
// ninguna estaba terminada:
//
//   1. Un `<nav aria-label="Administración de acceso">` con `aria-current="page"`.
//      `page` significa «estás en esta página». No son páginas: son tres
//      vistas de la misma, y la dirección del navegador no cambia. A quien usa
//      un lector de pantalla se le estaba diciendo algo que no es cierto.
//   2. y 3. Dos `role="tablist"` con `role="tab"` dentro… y ningún
//      `role="tabpanel"` en toda la pantalla. `role="tab"` es una promesa: «hay
//      un panel ahí debajo, y este botón lo gobierna». Sin el panel, el lector
//      anuncia «pestaña 2 de 3» y después no encuentra qué cambió. Tampoco
//      tenían navegación con flechas, que es justo lo que un usuario de teclado
//      espera al oír «pestaña».
//
// Esta pieza cumple las tres cosas que aquellas prometían: el panel existe, las
// flechas funcionan y el foco va donde debe.
//
// ## Tabulador y flechas: por qué solo una pestaña recibe foco
//
// Un grupo de pestañas es UNA parada del tabulador, no una por pestaña. Con
// cinco módulos, lo contrario obliga a pulsar Tab cinco veces para llegar al
// contenido. Dentro del grupo se mueve con ← y → (Inicio y Fin van a los
// extremos). Eso es `tabIndex={0}` en la activa y `-1` en el resto.
//
// Al moverse con flecha, la pestaña se activa a la vez que recibe el foco.
// Esto solo es correcto porque aquí los paneles ya están en memoria y cambiar
// no cuesta nada; si alguna vez un panel tuviera que pedir datos al servidor,
// habría que activar con Enter y no con la flecha, o cada pasada del teclado
// dispararía tres peticiones.
//
// ## Un solo panel para todas
//
// Todas las pestañas apuntan con `aria-controls` al MISMO panel. La
// alternativa —un panel por pestaña— obliga a tener los tres en el documento
// aunque dos estén ocultos, y entonces el texto de las vistas que no se ven
// sigue apareciendo al buscar en la página y en las pruebas. Varias pestañas
// pueden gobernar un mismo elemento; lo que no puede es apuntar a un `id` que
// no está en el documento.

import type { LucideIcon } from "lucide-react";
import { useId, useRef, type ReactNode } from "react";

import { cn } from "@/lib/utils";

export type Pestana<T extends string> = {
  id: T;
  nombre: string;
  /** Decorativo. Ayuda a reconocer la vista de un vistazo, no la nombra. */
  icono?: LucideIcon;
  /** Cuántos elementos hay dentro. Se anuncia junto al nombre. */
  cuenta?: number;
};

/** Cómo se dibuja el grupo. No cambia el comportamiento, solo el aspecto. */
type Aspecto =
  /** Subrayado bajo una línea. Para las vistas principales de la pantalla. */
  | "subrayado"
  /** Píldoras sueltas. Para acotar dentro de un panel que ya tiene su marco. */
  | "pildora";

export function Pestanas<T extends string>({
  etiqueta,
  pestanas,
  valor,
  alCambiar,
  aspecto = "subrayado",
  className,
  claseLista,
  children,
}: {
  /** Qué distingue a este grupo de otro de la misma pantalla. */
  etiqueta: string;
  pestanas: readonly Pestana<T>[];
  valor: T;
  alCambiar: (id: T) => void;
  aspecto?: Aspecto;
  className?: string;
  claseLista?: string;
  /** El contenido de la vista elegida. Lo decide quien llama, con `valor`. */
  children: ReactNode;
}) {
  const base = useId();
  const idPanel = `${base}-panel`;
  const botones = useRef(new Map<T, HTMLButtonElement>());

  const mover = (desde: number, salto: number | "inicio" | "fin") => {
    const ultima = pestanas.length - 1;
    const destino =
      salto === "inicio"
        ? 0
        : salto === "fin"
          ? ultima
          : // Da la vuelta: desde la última, → lleva a la primera. Es lo que
            // hace el navegador con sus propias pestañas.
            (desde + salto + pestanas.length) % pestanas.length;
    const siguiente = pestanas[destino];
    if (!siguiente || siguiente.id === valor) return;
    alCambiar(siguiente.id);
    botones.current.get(siguiente.id)?.focus();
  };

  return (
    <div className={className}>
      <div
        role="tablist"
        aria-label={etiqueta}
        className={cn(
          "flex min-w-0",
          aspecto === "subrayado"
            ? "flex-col gap-1 border-b border-border/80 sm:flex-row sm:flex-wrap"
            : "flex-wrap gap-2",
          claseLista
        )}
      >
        {pestanas.map((p, i) => {
          const activa = p.id === valor;
          const Icono = p.icono;
          return (
            <button
              key={p.id}
              ref={(el) => {
                if (el) botones.current.set(p.id, el);
                else botones.current.delete(p.id);
              }}
              type="button"
              role="tab"
              id={`${base}-tab-${p.id}`}
              aria-selected={activa}
              aria-controls={idPanel}
              /* Con cifra, el nombre se declara entero —«Roles, 12»— en vez de
                 dejar que se componga de los dos trozos de texto. Compuesto
                 sale «Roles 12»: un número suelto detrás de un nombre, que no
                 dice de qué es. */
              aria-label={typeof p.cuenta === "number" ? `${p.nombre}, ${p.cuenta}` : undefined}
              tabIndex={activa ? 0 : -1}
              onClick={() => alCambiar(p.id)}
              onKeyDown={(e) => {
                const salto =
                  e.key === "ArrowRight"
                    ? 1
                    : e.key === "ArrowLeft"
                      ? -1
                      : e.key === "Home"
                        ? ("inicio" as const)
                        : e.key === "End"
                          ? ("fin" as const)
                          : null;
                if (salto === null) return;
                e.preventDefault();
                mover(i, salto);
              }}
              className={cn(
                "flex min-w-0 items-center gap-2 text-left text-sm font-semibold",
                "transition-colors duration-enter ease-rel-out",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                aspecto === "subrayado"
                  ? cn(
                      "border-b-2 px-2 py-3 sm:px-4",
                      activa
                        ? "border-primary text-primary-ink"
                        : "border-transparent text-muted-foreground hover:border-border-strong hover:text-foreground"
                    )
                  : cn(
                      "rounded-lg border px-4 py-2",
                      activa
                        ? "border-primary bg-accent text-primary-ink"
                        : "border-border bg-surface text-muted-foreground hover:bg-surface-subtle hover:text-foreground"
                    )
              )}
            >
              {Icono ? <Icono className="h-4 w-4 shrink-0" aria-hidden="true" /> : null}
              <span className="min-w-0 break-words">{p.nombre}</span>
              {typeof p.cuenta === "number" ? (
                <span
                  aria-hidden="true"
                  className={cn(
                    "shrink-0 rounded-full px-2 py-0.5 text-xs font-bold tabular-nums",
                    activa ? "bg-accent text-primary-ink" : "bg-muted text-muted-foreground"
                  )}
                >
                  {p.cuenta}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      <div
        role="tabpanel"
        id={idPanel}
        aria-labelledby={`${base}-tab-${valor}`}
        /* El panel entra al tabulador porque puede contener solo texto: sin
           esto, una vista sin controles no se podría desplazar con el teclado. */
        tabIndex={0}
        /* `key`: fuerza a React a reemplazar el nodo al cambiar de vista, y así
           la animación de entrada vuelve a correr. Sin ella el contenido se
           sustituye en el sitio y el cambio pasa desapercibido. */
        key={valor}
        className="mt-6 focus-visible:outline-none motion-safe:animate-entrada"
      >
        {children}
      </div>
    </div>
  );
}
