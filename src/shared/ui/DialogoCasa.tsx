// src/shared/ui/DialogoCasa.tsx
//
// El modal de ABRIL-360: la forma que ya usa Psicosocial
// (`ApplicationLinkModal`), extraída para que deje de copiarse.
//
// Velo oscuro con desenfoque, tarjeta de esquinas grandes, sombra profunda,
// antetítulo en mayúsculas sobre el título, y la equis arriba a la derecha.
// Todo eso estaba escrito a mano en cada modal del producto, y por eso no había
// dos iguales.
//
// Lo que añade respecto de aquél:
//
//   - **Una escena opcional.** Un aviso importante sin ilustración se lee como
//     un error del sistema; con una, como algo que alguien escribió para ti.
//   - **`tono`**, que decide el color del antetítulo y del borde del aviso. Es
//     semántico, no decorativo: un modal que confirma algo irreversible no
//     puede verse igual que uno que informa.
//   - **Cierre por `Escape` y por el velo**, que en los modales escritos a mano
//     faltaba la mitad de las veces.
//
// Accesibilidad: `role="dialog"` + `aria-modal` + el título referenciado por
// `aria-labelledby`. El foco entra en la tarjeta al abrirse; sin eso, quien
// navega con teclado sigue en la página de detrás mientras el modal tapa todo.

import { useEffect, useId, useRef, type ReactNode } from "react";
import { X } from "lucide-react";

import { cn } from "@/lib/utils";
import { Escena, type NombreEscena } from "./Escena";

type Tono = "neutro" | "aviso" | "peligro" | "exito";

const ANTETITULO: Record<Tono, string> = {
  neutro: "text-rel-primary",
  aviso: "text-rel-warning",
  peligro: "text-rel-danger",
  exito: "text-rel-success",
};

export function DialogoCasa({
  abierto,
  alCerrar,
  antetitulo,
  titulo,
  descripcion,
  escena,
  visual,
  tono = "neutro",
  acciones,
  children,
  ancho = "md",
  cierreRapido = true,
}: {
  abierto: boolean;
  alCerrar: () => void;
  /** Encima del título, en mayúsculas. Dice de qué trata, no qué pasa. */
  antetitulo?: string;
  titulo: string;
  /** La frase que explica. Va bajo el título, no dentro del cuerpo. */
  descripcion?: ReactNode;
  escena?: NombreEscena;
  /**
   * Alternativa a `escena` para usar el catálogo VECTORIAL.
   *
   * Existe porque las escenas con personajes son material de ilustrador y no
   * hay una para cada situación. Antes de inventar una que no dice lo que pasa,
   * es mejor un dibujo del catálogo que sí lo dice. Se ignora si hay `escena`.
   */
  visual?: ReactNode;
  tono?: Tono;
  /** Botones del pie. El primario va último, a la derecha. */
  acciones?: ReactNode;
  children?: ReactNode;
  ancho?: "sm" | "md" | "lg";
  /**
   * La equis, el velo y `Escape`. Se apagan los tres juntos.
   *
   * Casi siempre debe estar encendido: un modal del que no se puede salir es
   * una trampa. La excepción es el diálogo que muestra algo **que se pierde al
   * cerrarlo** —un token que el servidor no guarda—: ahí salir tiene que ser un
   * acto deliberado, y el pie ofrece «Ya lo copié» en vez de «Cerrar». Una
   * equis al lado convertiría esa decisión en un adorno.
   */
  cierreRapido?: boolean;
}) {
  const idTitulo = useId();
  const tarjeta = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!abierto) return;
    tarjeta.current?.focus();
    if (!cierreRapido) return;
    function alPulsar(e: KeyboardEvent) {
      if (e.key === "Escape") alCerrar();
    }
    document.addEventListener("keydown", alPulsar);
    return () => document.removeEventListener("keydown", alPulsar);
  }, [abierto, alCerrar, cierreRapido]);

  if (!abierto) return null;

  const anchos = { sm: "max-w-md", md: "max-w-xl", lg: "max-w-3xl" };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-rel-dark/40 p-4 backdrop-blur-sm"
      // Cerrar al pulsar el velo, pero NO al pulsar dentro de la tarjeta: sin
      // la comprobación, soltar el ratón fuera tras seleccionar texto dentro
      // cierra el modal y se pierde lo que se estaba leyendo.
      onMouseDown={(e) => {
        if (cierreRapido && e.target === e.currentTarget) alCerrar();
      }}
    >
      <div
        ref={tarjeta}
        role="dialog"
        aria-modal="true"
        aria-labelledby={idTitulo}
        tabIndex={-1}
        className={cn(
          "max-h-[90vh] w-full overflow-y-auto rounded-rel-panel bg-rel-surface shadow-2xl focus:outline-none",
          anchos[ancho]
        )}
      >
        <div className="relative p-6 sm:p-8">
          {cierreRapido ? (
            <button
              type="button"
              onClick={alCerrar}
              aria-label="Cerrar"
              className="absolute right-4 top-4 rounded-rel-control p-2 text-rel-muted transition-colors hover:bg-rel-surface-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rel-primary"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          ) : null}

          <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:items-start sm:gap-6 sm:text-left">
            {escena ? (
              <Escena nombre={escena} tamano="md" className="shrink-0" />
            ) : visual ? (
              <div className="shrink-0">{visual}</div>
            ) : null}

            <div className="min-w-0 flex-1">
              {antetitulo ? (
                <p
                  className={cn(
                    "text-xs font-bold uppercase tracking-wide",
                    ANTETITULO[tono]
                  )}
                >
                  {antetitulo}
                </p>
              ) : null}
              <h2
                id={idTitulo}
                className="mt-1 font-rel-heading text-xl font-black text-rel-dark sm:text-2xl"
              >
                {titulo}
              </h2>
              {descripcion ? (
                <div className="mt-2 font-rel-body text-sm leading-relaxed text-rel-muted">
                  {descripcion}
                </div>
              ) : null}
            </div>
          </div>

          {children ? <div className="mt-6">{children}</div> : null}

          {acciones ? (
            <div className="mt-8 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              {acciones}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
