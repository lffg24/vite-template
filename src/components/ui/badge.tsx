import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

/* La etiqueta de estado del producto.
 *
 * Dos cambios de fondo en la homologacion:
 *
 *   - `rounded-full` como forma base. `Pill` ya la forzaba en cada uso, asi
 *     que la pildora era la forma real del producto y `rounded-md` era solo lo
 *     que quedaba cuando alguien usaba `Badge` directamente. Ahora la decision
 *     esta en un sitio.
 *   - `focus-visible` en vez de `focus`. Con `focus`, una etiqueta dentro de un
 *     elemento enfocable mostraba anillo tambien al hacer clic con el raton.
 *
 * Las variantes semanticas pasan a nombrarse por lo que significan —`success`,
 * `warning`, `danger`, `info`, `neutral`— y consumen los tokens de la casa.
 * Las `rel*` se conservan como alias exactos porque hay 90 pantallas que las
 * nombran; no son otra familia, son el mismo estilo con el nombre viejo. */
const badgeVariants = cva(
  "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-0.5 font-heading text-xs font-semibold transition-colors duration-rel-micro ease-rel-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background motion-reduce:transition-none",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground shadow-sm hover:bg-primary-hover",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-muted",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
        outline: "border-border text-foreground",
        accent: "border-transparent bg-accent text-accent-foreground",

        /* Semantica de estado, INDEPENDIENTE de la marca (constitucion §5): el
           turquesa corporativo no significa "exito" ni el azul "informacion".
           Fondo en el tinte de la familia y texto en el color solido de la
           misma familia, que es la combinacion que mantiene contraste en los
           dos temas. */
        success: "border-transparent bg-success-subtle text-success",
        info: "border-transparent bg-info-subtle text-info",
        warning: "border-transparent bg-warning-subtle text-warning",
        danger: "border-transparent bg-danger-subtle text-danger",
        neutral: "border-transparent bg-muted text-muted-foreground",
        brand: "border-border bg-background text-foreground",

        /* Alias heredados. Mismo estilo, nombre anterior. Preferir los de
           arriba en codigo nuevo. */
        relSuccess: "border-transparent bg-success-subtle text-success",
        relInfo: "border-transparent bg-info-subtle text-info",
        relWarning: "border-transparent bg-warning-subtle text-warning",
        relDanger: "border-transparent bg-danger-subtle text-danger",
        relNeutral: "border-transparent bg-muted text-muted-foreground",
        relBrand: "border-border bg-background text-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
