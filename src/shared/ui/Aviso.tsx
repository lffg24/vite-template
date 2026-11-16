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
import { AlertTriangle, CheckCircle2, Info, XCircle } from "lucide-react";

import { cn } from "@/lib/utils";

export type TonoAviso = "peligro" | "atencion" | "info" | "exito";

const TONO: Record<TonoAviso, { caja: string; icono: typeof Info }> = {
  peligro: { caja: "border-danger/30 bg-danger-subtle text-danger", icono: XCircle },
  atencion: { caja: "border-warning/30 bg-warning-subtle text-warning", icono: AlertTriangle },
  info: { caja: "border-info/30 bg-info-subtle text-info", icono: Info },
  exito: { caja: "border-success/30 bg-success-subtle text-success", icono: CheckCircle2 },
};

export function Aviso({
  tono = "peligro",
  titulo,
  children,
  acciones,
  className,
}: {
  tono?: TonoAviso;
  /** Qué pasó, en una línea. Sin esto, el cuerpo hace de título. */
  titulo?: ReactNode;
  children?: ReactNode;
  /** Qué puede hacer el usuario al respecto: reintentar, volver, revisar. */
  acciones?: ReactNode;
  className?: string;
}) {
  const { caja, icono: Icono } = TONO[tono];
  return (
    <div
      // `alert` y no `status`: estos mensajes interrumpen a propósito. Un
      // `aria-live` suave aquí es lo mismo que no decir nada.
      role="alert"
      className={cn("flex items-start gap-3 rounded-xl border p-4 text-sm", caja, className)}
    >
      <Icono className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
      <div className="min-w-0 flex-1">
        {titulo ? <p className="font-heading font-semibold">{titulo}</p> : null}
        {/* El cuerpo en color de texto normal y no en el del tono: un párrafo
            entero en rojo se lee peor, y lo que tiene que resaltar es que la
            caja es roja, no cada palabra. */}
        {children ? (
          <div className={cn("text-foreground/90", titulo && "mt-1")}>{children}</div>
        ) : null}
        {acciones ? <div className="mt-3 flex flex-wrap gap-2">{acciones}</div> : null}
      </div>
    </div>
  );
}
