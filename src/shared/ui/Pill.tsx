// src/shared/ui/Pill.tsx
//
// El estado como píldora: punto de color + texto. Es la forma que tienen todas
// las pantallas del diseño (Vigente, ≤ 30 días, Vencido, En curso…), y hasta
// ahora cada una la armaba con un `Badge` y un color elegido a mano.
//
// ## Semántica, no color
//
// La píldora recibe un TONO semántico —éxito, atención, peligro…— y no un
// color. Es la regla del sistema visual: verde es vigente, ámbar es atención,
// rojo es vencido o anulado, y el color de marca nunca los reemplaza. Si una
// pantalla pudiera pedir «violeta», tarde o temprano alguien pintaría un
// vencimiento con el color de la marca.
//
// ## El color nunca es la única señal
//
// El punto es decorativo (`aria-hidden`): lo que se lee es el texto. Una
// píldora sin texto no existe en esta API.

import type { ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type TonoPill = "exito" | "atencion" | "peligro" | "neutro" | "info" | "marca";

const VARIANTE = {
  exito: "relSuccess",
  atencion: "relWarning",
  peligro: "relDanger",
  neutro: "relNeutral",
  info: "relInfo",
  marca: "relBrand",
} as const;

const PUNTO: Record<TonoPill, string> = {
  exito: "bg-rel-success",
  atencion: "bg-rel-warning",
  peligro: "bg-rel-danger",
  neutro: "bg-rel-neutral",
  info: "bg-rel-info",
  marca: "bg-rel-primary",
};

export function Pill({
  tono,
  children,
  punto = true,
  title,
  className,
}: {
  tono: TonoPill;
  children: ReactNode;
  /** Sin punto para etiquetas que no son estado (una categoría, un tipo). */
  punto?: boolean;
  title?: string;
  className?: string;
}) {
  return (
    <Badge
      variant={VARIANTE[tono]}
      title={title}
      className={cn("gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1", className)}
    >
      {punto ? (
        <span aria-hidden="true" className={cn("h-2 w-2 shrink-0 rounded-full", PUNTO[tono])} />
      ) : null}
      {children}
    </Badge>
  );
}
