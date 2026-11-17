import type { ButtonHTMLAttributes, ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Variante = "principal" | "secundaria";

/**
 * Acción táctil del núcleo para los recorridos de participante.
 *
 * Define el TAMAÑO, no el color ni el comportamiento. Lo demás —el acento, el
 * anillo de foco, la curva de movimiento, el hundido al pulsar, el estado
 * desactivado— sale de las variantes `rel` y `relOutline` del botón de la casa.
 *
 * Antes este archivo repetía esos colores por su cuenta, así que el botón del
 * participante era el único del producto que no se hundía al pulsarse y el
 * único que apagaba su foco de otra manera: dos botones del mismo tono que
 * respondían distinto al mismo gesto.
 *
 * Lo que sí es suyo, y por eso sigue aquí: 56 px de alto y todo el ancho. Se
 * pulsa con el pulgar, de pie, quizá con guantes; los objetivos táctiles
 * pequeños son la primera causa de que un formulario móvil se sienta roto.
 */
export function BotonAccion({
  children,
  variante = "principal",
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variante?: Variante;
}) {
  return (
    <Button
      {...props}
      variant={variante === "principal" ? "rel" : "relOutline"}
      className={cn(
        "min-h-[3.5rem] w-full px-6 py-3 font-rel-heading text-base font-bold",
        className
      )}
    >
      {children}
    </Button>
  );
}

export function BarraAccionesMovil({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "sticky bottom-0 z-30 -mx-4 mt-6 border-t border-rel-border bg-rel-surface/95 px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-4 shadow-[0_-10px_30px_rgba(12,22,44,0.08)] backdrop-blur",
        "sm:-mx-6 sm:px-6 lg:static lg:mx-0 lg:border-0 lg:bg-transparent lg:p-0 lg:shadow-none lg:backdrop-blur-none",
        className
      )}
    >
      {children}
    </div>
  );
}
