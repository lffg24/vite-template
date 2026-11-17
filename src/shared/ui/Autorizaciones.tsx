// src/shared/ui/Autorizaciones.tsx
//
// El bloque de autorizaciones del recorrido del participante: una casilla por
// finalidad, con el texto legal completo detrás de un botón.
//
// ## Por qué es una pieza y no dos bloques parecidos
//
// Estaba escrito DOS veces, casi idéntico, en la identificación y en la
// invitación. Casi: una de las dos le daba 44 px de alto al botón que despliega
// el texto y la otra no, así que la misma pantalla legal se podía pulsar bien
// en un sitio y mal en el otro. Esa es la forma en que se degrada una copia:
// nadie la rompe, se arregla una sola.
//
// Lo que se duplicaba no era adorno. Era la pantalla donde alguien consiente
// el tratamiento de sus datos, y de ella depende que la aceptación quede
// registrada con su versión.
//
// ## El `aria-describedby` condicional
//
// El texto completo se oculta con `hidden`, no se desmonta, para que abrirlo
// no cueste un renderizado. Pero `hidden` lo saca del árbol de accesibilidad:
// apuntar ahí estando colapsado deja una referencia que no resuelve a nada, y
// entonces el lector no anuncia ninguna descripción. Colapsado, la descripción
// ES la etiqueta; para leer el texto está el botón, que dice a cuál pertenece.

import { useState } from "react";

import { cn } from "@/lib/utils";
import type { TextoPresentado } from "@/types/participacion";

import { Casilla } from "./Casilla";

export function Autorizaciones({
  textos,
  marcados,
  alCambiar,
  idError,
  refPrimera,
  className,
  children,
}: {
  textos: TextoPresentado[];
  marcados: Record<string, boolean>;
  alCambiar: (actualizar: (m: Record<string, boolean>) => Record<string, boolean>) => void;
  /** El `id` del aviso de error, cuando lo hay. */
  idError?: string;
  /** Para llevar el foco a la primera casilla cuando falta alguna. */
  refPrimera?: (el: HTMLInputElement | null) => void;
  className?: string;
  /** El aviso de error, si va dentro del recuadro. */
  children?: React.ReactNode;
}) {
  const [abierto, setAbierto] = useState<string | null>(null);

  return (
    <fieldset
      className={cn("rounded-rel-card border border-rel-border bg-rel-surface p-4", className)}
      aria-describedby={idError}
    >
      <legend className="px-1 text-sm font-semibold">Autorizaciones</legend>
      <div className="space-y-4">
        {textos.map((t, i) => {
          const finalidad = t.finalidad ?? "Autorizo el tratamiento de mis datos.";
          const desplegado = abierto === t.clave;

          return (
            <div key={t.clave}>
              <Casilla
                etiqueta={<span className="leading-relaxed">{finalidad}</span>}
                marcada={Boolean(marcados[t.clave])}
                alCambiar={(valor) => alCambiar((m) => ({ ...m, [t.clave]: valor }))}
                referencia={i === 0 ? refPrimera : undefined}
                aria-describedby={desplegado ? `texto-${t.clave}` : undefined}
              />
              <button
                type="button"
                onClick={() => setAbierto(desplegado ? null : t.clave)}
                className="mt-1 min-h-[2.75rem] pl-7 text-sm font-semibold text-rel-primary underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rel-primary"
                aria-expanded={desplegado}
                aria-controls={`texto-${t.clave}`}
                // El texto visible dice lo mismo en todos los botones. Quien
                // navega por botones con un lector de pantalla oiría «Leer el
                // texto completo» dos veces y no sabría cuál abre cuál.
                aria-label={`${desplegado ? "Ocultar" : "Leer"} el texto completo de: ${finalidad}`}
              >
                {desplegado ? "Ocultar el texto" : "Leer el texto completo"}
              </button>
              <div
                id={`texto-${t.clave}`}
                hidden={!desplegado}
                className="mt-2 max-h-64 overflow-y-auto rounded-rel-control bg-rel-surface-subtle p-3 text-sm leading-relaxed text-rel-muted"
              >
                <p className="whitespace-pre-line">{t.contenido}</p>
                <p className="mt-2 text-xs">Versión {t.version}</p>
              </div>
            </div>
          );
        })}
      </div>
      {children}
    </fieldset>
  );
}
