// src/shared/ui/Caja.tsx
//
// LA caja de ABRIL-360: borde, fondo y esquina. La pieza más repetida del
// producto y la que no tenía definición.
//
// ## Lo que medí
//
// 66 cajas dibujadas a mano en el perímetro, en **47 formas distintas**. Casi
// cada caja era su propia caja. Y la divergencia no estaba en el color ni en
// el radio —esos ya se cerraron—, estaba en las dos cosas que se notan al
// poner dos cajas una al lado de la otra:
//
//   - **El aire por dentro, en siete valores:** `p-2`, `p-3`, `p-4`, `p-5`,
//     `p-6`, `p-8` y sin relleno. Dos cajas contiguas con 16 y 24 px de aire
//     no se leen como dos cajas del mismo producto.
//   - **El relieve, en cuatro:** 49 sin sombra, 11 con `shadow-sm`, 5 con
//     `shadow-card` y 1 con `shadow-floating`. `shadow-sm` era media sombra,
//     elegida once veces sin criterio.
//
// ## Los tres papeles
//
// El arreglo no es «una caja con parámetros para todo», que es como se llegó a
// 47 formas. Es que la caja tiene **tres papeles**, y el papel decide el radio,
// el relieve y el aire JUNTOS. No se eligen por separado porque no son
// decisiones independientes: una caja que se levanta de la página necesita más
// aire que una fila de lista, y a la inversa.
//
//   - **`panel`** — una sección de la página. Se levanta: tiene sombra.
//   - **`caja`** — una caja dentro de un panel. No se levanta de nada, porque
//     ya está encima de algo: sin sombra.
//   - **`fila`** — una caja dentro de una lista. Radio de control, aire
//     apretado, sin sombra.
//
// ## Por qué `Panel` sigue existiendo
//
// No es una segunda definición: `Panel` CONSUME esto. Lo suyo es el
// encabezado —título, descripción, acción— y ser una `<section>`, que es
// información de estructura, no de estilo. La caja la pide aquí.
//
// Por eso el papel `panel` reproduce exactamente las clases que `Panel` ya
// tenía, `border-border/80` incluido. Esa opacidad del 80 % es la tercera
// fuerza de borde del producto y no la eligió nadie; se queda porque cambiarla
// movería el borde de cada `Panel` y cada `Card` del producto, y eso es una
// decisión aparte de esta. Vive aquí, en un sitio, en vez de repetida.

import { forwardRef, type ElementType, type HTMLAttributes, type ReactNode } from "react";

import { cn } from "@/lib/utils";

export type PapelCaja = "panel" | "caja" | "fila";

/** El aire por dentro. Tres valores y «ninguno». Siete eran seis de más. */
export type AireCaja = "ajustado" | "normal" | "amplio" | "ninguno";

const AIRE: Record<AireCaja, string> = {
  ajustado: "p-4",
  normal: "p-5",
  amplio: "p-6",
  ninguno: "",
};

/**
 * El papel, completo. Radio + relieve + aire por defecto, de una pieza.
 *
 * `panel` repite las clases de `Panel` tal cual estaban para que ni un `Panel`
 * del producto cambie de aspecto al pasar por aquí.
 */
const PAPEL: Record<PapelCaja, { forma: string; aire: AireCaja }> = {
  panel: {
    forma: "rounded-rel-panel border border-border/80 bg-card text-card-foreground shadow-rel-card",
    aire: "normal",
  },
  caja: {
    forma: "rounded-rel-card border border-rel-border bg-rel-surface",
    aire: "ajustado",
  },
  fila: {
    forma: "rounded-rel-control border border-rel-border bg-rel-surface px-3 py-2",
    aire: "ninguno",
  },
};

/**
 * El fondo y el borde cuando el papel no bastan.
 *
 * Son los cuatro que el producto ya usaba con sentido, no una paleta abierta:
 * la caja normal, la hundida (un bloque de apoyo dentro de un panel), la
 * discontinua (un hueco que se puede rellenar) y la de peligro.
 */
export type TonoCaja = "superficie" | "hundida" | "discontinua" | "peligro";

const TONO: Record<TonoCaja, string> = {
  superficie: "",
  hundida: "border-rel-border bg-rel-surface-subtle",
  discontinua: "border-dashed border-rel-border-strong bg-rel-surface-subtle",
  peligro: "border-rel-danger bg-rel-danger-subtle",
};

type Props = {
  children?: ReactNode;
  papel?: PapelCaja;
  /** Solo cuando el papel no acierta. Si lo escribes, di por qué. */
  aire?: AireCaja;
  tono?: TonoCaja;
  /**
   * El elemento. Por defecto `div`.
   *
   * Importa: una caja no es una `<section>` salvo que tenga nombre. Marcar
   * cada caja como sección mete regiones sin título en el árbol de
   * accesibilidad, y quien navega por regiones se encuentra una lista de
   * «sección, sección, sección».
   */
  como?: ElementType;
  className?: string;
} & Omit<HTMLAttributes<HTMLElement>, "children">;

export const Caja = forwardRef<HTMLElement, Props>(function Caja(
  { children, papel = "caja", aire, tono = "superficie", como, className, ...resto },
  referencia
) {
  const Elemento = (como ?? "div") as ElementType;
  const def = PAPEL[papel];
  return (
    <Elemento
      ref={referencia}
      className={cn(def.forma, AIRE[aire ?? def.aire], TONO[tono], className)}
      {...resto}
    >
      {children}
    </Elemento>
  );
});
