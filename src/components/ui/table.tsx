import * as React from "react"

import { cn } from "@/lib/utils"

/* LA tabla de ABRIL-360. Antes de este cambio habia tres dialectos vivos:
   este componente (7 pantallas), la carcasa de `shared/ui/Panel` que consume
   `TablaDatos` (8 pantallas) y marcado a mano en 25 pantallas mas. Entre esas
   25 se contaron DIEZ `<thead>` distintos —ocho de ellos sobre `slate`, que
   difieren entre si en `text-left`, `tracking-wide`, `font-black` o nada— y
   VEINTIUNA combinaciones de relleno para `<th>`: `px-4 py-3` en 48 celdas,
   `px-5 py-4` en 18, `px-3 py-2`, `px-2 py-2`...

   De ahi la sensacion de que cada pantalla es un producto distinto: una tabla
   se reconoce por su ritmo vertical y por como responde al puntero, y aqui no
   habia dos iguales. Este archivo es la unica definicion; `shared/ui/Panel`
   delega en el, de modo que arreglarlo una vez lo arregla en todas partes.

   Escala elegida: cabecera `h-11 px-4`, celda `px-4 py-3.5`. `px-4` era ya el
   consenso de hecho (48 celdas frente a 18); el alto de fila se fija aqui para
   que dos tablas contiguas tengan el mismo ritmo. */

/* Las clases de la carcasa salen exportadas porque `shared/ui/Panel` tiene que
   pintar la MISMA caja: alli la tabla comparte borde con la paginacion, asi que
   no puede reusar `<Table>` entero. Exportar la cadena es lo que evita que las
   dos cajas vuelvan a separarse en cuanto una de las dos cambie. */
export const CLASES_CARCASA_TABLA =
  "overflow-hidden rounded-xl border border-border bg-surface"
export const CLASES_SCROLL_TABLA = "relative w-full overflow-x-auto"

const Table = React.forwardRef<
  HTMLTableElement,
  React.HTMLAttributes<HTMLTableElement> & { contenedorClassName?: string }
>(({ className, contenedorClassName, ...props }, ref) => (
  /* DOS cajas, no una: la exterior recorta las esquinas, la interior desborda
     en horizontal. Con una sola, una tabla ancha empuja el `body` entero y
     aparece scroll horizontal en toda la pagina. `relative` evita que lo que
     va en posicion absoluta dentro de la tabla —textos para lector de
     pantalla— escape del recorte. */
  <div
    className={cn(CLASES_CARCASA_TABLA, contenedorClassName)}
  >
    <div className={CLASES_SCROLL_TABLA}>
      <table
        ref={ref}
        className={cn("w-full min-w-full caption-bottom text-left text-sm text-foreground", className)}
        {...props}
      />
    </div>
  </div>
))
Table.displayName = "Table"

/* `sticky` como propiedad y no como clase suelta: dos pantallas ya lo
   intentaban por su cuenta y solo una recordaba el `z-10`, asi que en la otra
   las filas pasaban por encima de la cabecera al desplazar. */
const TableHeader = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement> & { sticky?: boolean }
>(({ className, sticky, ...props }, ref) => (
  <thead
    ref={ref}
    className={cn(
      "bg-surface-subtle [&_tr]:border-b [&_tr]:border-border",
      sticky && "sticky top-0 z-10 shadow-[0_1px_0_0_hsl(var(--border))]",
      className
    )}
    {...props}
  />
))
TableHeader.displayName = "TableHeader"

const TableBody = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tbody
    ref={ref}
    className={cn("divide-y divide-border [&_tr:last-child]:border-0", className)}
    {...props}
  />
))
TableBody.displayName = "TableBody"

const TableFooter = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tfoot
    ref={ref}
    className={cn(
      "border-t border-border bg-surface-subtle font-semibold last:[&>tr]:border-b-0",
      className
    )}
    {...props}
  />
))
TableFooter.displayName = "TableFooter"

/* `focus-within` ademas de `hover`: casi todas estas filas llevan un enlace en
   la primera celda, y quien navega con teclado no tenia ninguna senal de en
   que fila esta. El realce de fila completa es esa senal. */
const TableRow = React.forwardRef<
  HTMLTableRowElement,
  React.HTMLAttributes<HTMLTableRowElement>
>(({ className, ...props }, ref) => (
  <tr
    ref={ref}
    className={cn(
      "border-b border-border transition-colors duration-rel-micro ease-rel-out hover:bg-surface-subtle/70 focus-within:bg-surface-subtle/70 data-[state=selected]:bg-accent/60 motion-reduce:transition-none",
      className
    )}
    {...props}
  />
))
TableRow.displayName = "TableRow"

/* `align="right"` en lugar de `className="text-right"` repetido 22 veces:
   alinear una columna a la derecha implica TAMBIEN cifras de ancho fijo, y
   acordarse de las dos cosas por separado es lo que produce columnas de
   numeros que bailan al cambiar de pagina. */
type Alineacion = "left" | "right" | "center"

const ALINEACION: Record<Alineacion, string> = {
  left: "text-left",
  right: "text-right",
  center: "text-center",
}

const TableHead = React.forwardRef<
  HTMLTableCellElement,
  Omit<React.ThHTMLAttributes<HTMLTableCellElement>, "align"> & { align?: Alineacion }
>(({ className, align = "left", ...props }, ref) => (
  <th
    ref={ref}
    scope="col"
    className={cn(
      "h-11 whitespace-nowrap px-4 align-middle font-heading text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground has-[[role=checkbox]]:pr-0 *:[[role=checkbox]]:translate-y-[2px]",
      ALINEACION[align],
      className
    )}
    {...props}
  />
))
TableHead.displayName = "TableHead"

const TableCell = React.forwardRef<
  HTMLTableCellElement,
  Omit<React.TdHTMLAttributes<HTMLTableCellElement>, "align"> & { align?: Alineacion }
>(({ className, align = "left", ...props }, ref) => (
  <td
    ref={ref}
    className={cn(
      "px-4 py-3.5 align-middle has-[[role=checkbox]]:pr-0 *:[[role=checkbox]]:translate-y-[2px]",
      ALINEACION[align],
      align === "right" && "tabular-nums",
      className
    )}
    {...props}
  />
))
TableCell.displayName = "TableCell"

const TableCaption = React.forwardRef<
  HTMLTableCaptionElement,
  React.HTMLAttributes<HTMLTableCaptionElement>
>(({ className, ...props }, ref) => (
  <caption
    ref={ref}
    className={cn("mt-4 text-sm text-muted-foreground", className)}
    {...props}
  />
))
TableCaption.displayName = "TableCaption"

/**
 * La fila de «no hay nada». Existe porque cada pantalla la escribia a mano y
 * ninguna igual: unas ponian «Sin datos» en gris pequeno, otras una celda
 * vacia, y una tabla vacia sin explicacion se lee como un error de carga.
 *
 * `colSpan` es obligatorio: sin el, la celda ocupa una columna y el mensaje
 * queda pegado al borde izquierdo de una tabla ancha.
 */
function TableEmpty({
  colSpan,
  children,
  className,
}: {
  colSpan: number
  children: React.ReactNode
  className?: string
}) {
  return (
    <tr>
      <td
        colSpan={colSpan}
        className={cn("px-4 py-12 text-center text-sm text-muted-foreground", className)}
      >
        {children}
      </td>
    </tr>
  )
}

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
  TableEmpty,
}
