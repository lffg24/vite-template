// src/shared/ui/PanelLateral.tsx
//
// El cajón lateral de ABRIL-360: la hoja que entra por la derecha para crear o
// editar algo sin perder de vista la lista de detrás.
//
// Estaba escrito a mano once veces. No había dos iguales, y la diferencia no
// era de estilo: unas cerraban con `Escape` y otras no, unas movían el foco al
// abrirse y otras dejaban al teclado navegando la página tapada, y ninguna se
// anunciaba como diálogo. Un formulario del que no se puede salir con el
// teclado no es un detalle de acabado.
//
// Es hermano de `DialogoCasa`, no un sustituto: el diálogo interrumpe para
// decir algo corto y centrado; el panel acompaña mientras se rellena algo
// largo. Comparten velo, cierre y accesibilidad; cambian el sitio y el ancho.

import { useEffect, useId, useRef, type FormEvent, type ReactNode } from "react";
import { X } from "lucide-react";

import { cn } from "@/lib/utils";

const ANCHOS = {
  sm: "max-w-md",
  md: "max-w-xl",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
} as const;

export function PanelLateral({
  abierto,
  alCerrar,
  antetitulo,
  titulo,
  descripcion,
  acciones,
  children,
  ancho = "md",
  /**
   * Si se pasa, el panel ENTERO es un formulario: cuerpo y pie dentro del
   * mismo `<form>`. Es lo que hace que Enter envíe desde cualquier campo y que
   * el botón del pie pueda ser `type="submit"` sin el baile del atributo
   * `form=` apuntando a un id.
   */
  alEnviar,
  className,
}: {
  abierto: boolean;
  alCerrar: () => void;
  /** Encima del título, en mayúsculas. Dice de qué trata, no qué pasa. */
  antetitulo?: ReactNode;
  titulo: string;
  descripcion?: ReactNode;
  /** Botones del pie. El primario va último, a la derecha. */
  acciones?: ReactNode;
  children?: ReactNode;
  ancho?: keyof typeof ANCHOS;
  alEnviar?: (evento: FormEvent<HTMLFormElement>) => void;
  className?: string;
}) {
  const idTitulo = useId();
  const hoja = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!abierto) return;
    hoja.current?.focus();
    function alPulsar(evento: KeyboardEvent) {
      if (evento.key === "Escape") alCerrar();
    }
    document.addEventListener("keydown", alPulsar);
    return () => document.removeEventListener("keydown", alPulsar);
  }, [abierto, alCerrar]);

  if (!abierto) return null;

  const cuerpo = (
    <>
      <div className="flex-1 overflow-y-auto px-6 py-6">{children}</div>
      {acciones ? (
        <div className="flex flex-col-reverse gap-2 border-t border-border/70 bg-surface px-6 py-4 sm:flex-row sm:justify-end">
          {acciones}
        </div>
      ) : null}
    </>
  );

  return (
    <div
      /* El velo entra con una atenuacion y la hoja se desliza. Sin esto el
         panel APARECE de golpe, que es lo que separa una interfaz cara de una
         barata: el ojo no entiende de donde salio y lee el salto como un
         fallo. Entrada en 220 ms con `ease-out` —sale deprisa y aterriza
         despacio, como cualquier objeto real—, y anulada para quien pide
         menos movimiento. */
      className="fixed inset-0 z-rel-modal flex justify-end bg-rel-dark/40 backdrop-blur-sm animate-in fade-in duration-enter motion-reduce:animate-none"
      // Cerrar al pulsar el velo, pero NO al soltar el ratón fuera tras haber
      // seleccionado texto dentro: eso borraría lo que se estaba rellenando.
      onMouseDown={(evento) => {
        if (evento.target === evento.currentTarget) alCerrar();
      }}
    >
      <aside
        ref={hoja}
        role="dialog"
        aria-modal="true"
        aria-labelledby={idTitulo}
        tabIndex={-1}
        className={cn(
          "flex h-full w-full flex-col bg-surface shadow-2xl focus:outline-none",
          "animate-in slide-in-from-right duration-enter ease-rel-out motion-reduce:animate-none",
          ANCHOS[ancho],
          className
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-border/70 px-6 py-5">
          <div className="min-w-0">
            {antetitulo ? (
              <p className="font-heading text-xs font-bold uppercase tracking-widest text-primary">
                {antetitulo}
              </p>
            ) : null}
            <h2
              id={idTitulo}
              className="mt-1 font-heading text-xl font-black text-foreground sm:text-2xl"
            >
              {titulo}
            </h2>
            {descripcion ? (
              <p className="mt-1 text-sm text-muted-foreground">{descripcion}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={alCerrar}
            aria-label="Cerrar"
            className="shrink-0 rounded-lg border border-border p-2 text-muted-foreground transition-colors duration-rel-micro hover:bg-surface-subtle hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        {alEnviar ? (
          <form onSubmit={alEnviar} className="flex min-h-0 flex-1 flex-col">
            {cuerpo}
          </form>
        ) : (
          cuerpo
        )}
      </aside>
    </div>
  );
}
