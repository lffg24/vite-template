// src/shared/ui/Casilla.tsx
//
// UNA casilla con su etiqueta. La pieza atómica, no la lista.
//
// ## Por qué hacía falta
//
// `OpcionesMultiples` ya resuelve «elige las que apliquen» cuando son pocas y
// cada una necesita una frase: tarjetas con borde, todas a la vista. Lo que no
// resolvía nadie era la casilla suelta —una autorización, una confirmación— ni
// la fila de una lista larga, donde cada línea es un nombre y nada más.
//
// Por eso nueve pantallas la dibujaban a mano, y entre las nueve había cinco
// formas distintas de la MISMA casilla: `h-4` o `h-5`; `accent-rel-primary`,
// `accent-[hsl(var(--rel-primary))]` o ningún acento; con anillo de foco o sin
// él; con alto mínimo para el pulgar o sin él.
//
// ## El tamaño: caja de 16 px, fila de 44 px
//
// Dos de esas nueve subieron la caja a 20 px, y la razón que escribieron era
// buena: 13 px no se da con el pulgar. Pero el blanco táctil no es la caja, es
// la FILA: la etiqueta está unida al control, así que pulsar el texto marca la
// casilla. Agrandar la caja arregla el síntoma en un sitio; garantizar los
// 44 px de fila lo arregla en todos, y deja la caja del mismo tamaño que en
// `OpcionesMultiples` y `OpcionesExcluyentes`, que es el tamaño que el
// recorrido del participante ya usa en todas sus preguntas.
//
// Los 44 px se escriben como valor explícito —`min-h-11`— y no con
// la clase numérica de la escala: en la versión de Tailwind de este proyecto
// esa clase no genera nada. Hay una prueba que lo vigila, y acaba de cazar
// este mismo comentario cuando nombraba la clase prohibida.

import { useId, type InputHTMLAttributes, type ReactNode } from "react";

import { cn } from "@/lib/utils";

type AtributosInput = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "type" | "checked" | "onChange" | "id" | "className" | "disabled"
>;

export function Casilla({
  etiqueta,
  descripcion,
  marcada,
  alCambiar,
  deshabilitada,
  id,
  className,
  claseEtiqueta,
  referencia,
  ...resto
}: {
  etiqueta: ReactNode;
  /**
   * Qué implica marcarla. Se ata con `aria-describedby`, no se deja suelta al
   * lado: puesta al lado la lee quien ve la pantalla y no quien la escucha.
   */
  descripcion?: ReactNode;
  marcada: boolean;
  alCambiar: (marcada: boolean) => void;
  deshabilitada?: boolean;
  id?: string;
  /** Va en la fila entera, no en la caja. */
  className?: string;
  claseEtiqueta?: string;
  referencia?: (el: HTMLInputElement | null) => void;
} & AtributosInput) {
  const generado = useId();
  const idCasilla = id ?? generado;
  const idDescripcion = descripcion ? `${idCasilla}-desc` : undefined;

  // `aria-describedby` propio Y el de quien llama. Hay pantallas que apuntan a
  // un texto legal que se despliega aparte, y perder el suyo o perder el
  // nuestro deja a alguien sin la mitad de la explicación.
  const descritaPor =
    [resto["aria-describedby"], idDescripcion].filter(Boolean).join(" ") || undefined;

  return (
    <div className={cn("min-w-0", className)}>
      <label
        htmlFor={idCasilla}
        className={cn(
          "flex min-h-11 gap-3 py-1",
          // Con descripción la fila crece y la caja tiene que quedarse arriba,
          // junto a la primera línea. Sin ella, la fila es de una línea y
          // centrar es lo que hace que no quede un hueco debajo.
          descripcion ? "items-start" : "items-center",
          deshabilitada ? "cursor-not-allowed opacity-60" : "cursor-pointer",
          claseEtiqueta
        )}
      >
        <input
          {...resto}
          ref={referencia}
          type="checkbox"
          id={idCasilla}
          checked={marcada}
          disabled={deshabilitada}
          onChange={(e) => alCambiar(e.target.checked)}
          aria-describedby={descritaPor}
          className={cn(
            "h-4 w-4 shrink-0 accent-rel-primary",
            descripcion && "mt-1",
            "focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-rel-primary focus-visible:ring-offset-2"
          )}
        />
        {/* `grow`: en una fila de lista, lo que va a la derecha —un numero de
            documento, un estado— llega al borde con `ml-auto` solo si la
            etiqueta ocupa el ancho que sobra. */}
        <span className="min-w-0 grow">
          <span className="block font-rel-body text-sm text-rel-dark">{etiqueta}</span>
          {/* La descripción va DENTRO de la etiqueta, no debajo. Es lo que hace
              que el blanco táctil sea la tarjeta entera y no solo su primera
              línea, y es lo que permite que una tarjeta con borde encierre de
              verdad todo su contenido. */}
          {descripcion ? (
            <span
              id={idDescripcion}
              className="mt-1 block font-rel-body text-sm leading-5 text-rel-muted"
            >
              {descripcion}
            </span>
          ) : null}
        </span>
      </label>
    </div>
  );
}
