// src/shared/ui/Aviso.tsx
//
// El aviso de ABRIL-360: lo que la pantalla le dice al usuario cuando algo
// falló, algo requiere atención o algo salió bien.
//
// ## Por qué hacía falta
//
// No existía. Cincuenta archivos escriben su propia bandera de aviso, y el
// fondo del error se dice de cinco formas distintas en el mismo producto: el
// rojo crudo de Tailwind (33 veces), el tinte `rel` de peligro (23), el fondo
// destructivo de shadcn (18), el rosa crudo (3) y el tinte de la casa (2).
// Tres de esas cinco son color CRUDO de Tailwind, que no cambia en modo
// oscuro: en tema oscuro el aviso de error quedaba como una caja rosa claro
// con texto casi negro, encima de la página oscura.
//
// Y no es solo color. El radio va de `rounded-2xl` a `rounded-rel-control`, la
// mitad lleva `role="alert"` y la otra mitad no —así que un lector de pantalla
// anuncia unos errores y se calla otros—, y el icono aparece en algunas y en
// otras no.
//
// ## Lo que decide este componente
//
//   - **`role="alert"` siempre.** Un mensaje de error que el lector de pantalla
//     no anuncia es un error que el usuario no recibe. No es opcional y por eso
//     no es una prop.
//   - **Tono semántico, no color.** `peligro`, `atencion`, `info`, `exito`: lo
//     mismo que `Pill`, los mismos tokens, de modo que el rojo del aviso y el
//     rojo de la etiqueta de estado son el mismo rojo en los dos temas.
//   - **Icono por tono.** No se elige: el icono forma parte de lo que significa
//     el tono, y dejarlo a la pantalla es volver a tener cinco criterios.

import type { ReactNode } from "react";
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from "lucide-react";

import { cn } from "@/lib/utils";

export type TonoAviso = "peligro" | "atencion" | "info" | "exito";

const TONO: Record<TonoAviso, { caja: string; ficha: string; icono: typeof Info }> = {
  peligro: { caja: "border-danger/20 bg-danger-subtle/70", ficha: "text-danger ring-danger/25", icono: XCircle },
  atencion: { caja: "border-warning/25 bg-warning-subtle/70", ficha: "text-warning ring-warning/30", icono: AlertTriangle },
  info: { caja: "border-info/20 bg-info-subtle/70", ficha: "text-info ring-info/25", icono: Info },
  exito: { caja: "border-success/20 bg-success-subtle/70", ficha: "text-success ring-success/25", icono: CheckCircle2 },
};

export function Aviso({
  tono = "peligro",
  titulo,
  children,
  acciones,
  alCerrar,
  className,
}: {
  tono?: TonoAviso;
  /** Qué pasó, en una línea. Sin esto, el cuerpo hace de título. */
  titulo?: ReactNode;
  children?: ReactNode;
  /** Qué puede hacer el usuario al respecto: reintentar, volver, revisar. */
  acciones?: ReactNode;
  /** Si se da, aparece una X para descartarlo. Un error no debería ser descartable. */
  alCerrar?: () => void;
  className?: string;
}) {
  const { caja, ficha, icono: Icono } = TONO[tono];
  return (
    <div
      // `alert` y no `status`: estos mensajes interrumpen a propósito. Un
      // `aria-live` suave aquí es lo mismo que no decir nada.
      role="alert"
      className={cn(
        "relative flex items-start gap-3.5 rounded-rel-card border p-4 text-sm",
        "animate-in fade-in slide-in-from-top-[0.5rem] duration-enter ease-rel-out motion-reduce:animate-none",
        caja,
        className
      )}
    >
      {/* El icono en una ficha blanca con anillo del tono: el color queda en un
          punto y no en toda la caja, y se lee como parte de un sistema. */}
      <span
        aria-hidden="true"
        className={cn("grid h-9 w-9 shrink-0 place-items-center rounded-full bg-surface shadow-rel-soft ring-1", ficha)}
      >
        <Icono className="h-5 w-5" />
      </span>
      <div className={cn("min-w-0 flex-1 pt-0.5", alCerrar && "pr-8")}>
        {titulo ? <p className="font-heading text-[0.95rem] font-semibold text-foreground">{titulo}</p> : null}
        {/* El cuerpo en color de texto normal y no en el del tono: un párrafo
            entero en rojo se lee peor. */}
        {children ? (
          <div className={cn("leading-relaxed text-foreground/80", titulo && "mt-0.5")}>{children}</div>
        ) : null}
        {acciones ? <div className="mt-3 flex flex-wrap gap-2">{acciones}</div> : null}
      </div>
      {alCerrar ? (
        <button
          type="button"
          onClick={alCerrar}
          aria-label="Cerrar aviso"
          className="absolute right-2.5 top-2.5 grid h-8 w-8 place-items-center rounded-rel-control text-foreground/60 transition-colors duration-exit hover:bg-surface hover:text-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      ) : null}
    </div>
  );
}
