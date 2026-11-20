import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

/* La base la comparten TODAS las variantes, incluidas las `rel*`. Antes cada
   familia repetia su propio anillo de foco y solo la casa declaraba curva de
   movimiento, asi que un boton de CX y uno de Psicosocial respondian distinto
   al mismo gesto. Lo comun —foco, transicion, estado presionado, desactivado—
   se decide una vez aqui; las variantes solo aportan color.

   `active:scale-[0.98]` da la confirmacion tactil al pulsar. Es lo que mas
   barato hace sentir viva una interfaz, y como se dispara en cada clic va en
   la duracion mas corta. `motion-reduce:` lo anula en las pantallas que aun no
   estan dentro de `.rel-scope`, que es donde vive la regla global.

   La transicion enumera propiedades en vez de usar `transition-all`: con
   `all`, el navegador vigila tambien `width`, `height` y `top`, de modo que
   cualquier recalculo de layout entra animado y produce ese arrastre elastico
   que delata una interfaz mal ajustada. */
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg border border-transparent font-heading text-sm font-semibold tracking-[0.01em] transition-[background-color,border-color,color,box-shadow,transform] duration-rel-micro ease-rel-out active:scale-[0.98] motion-reduce:transition-none motion-reduce:active:scale-100 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-card hover:bg-primary-hover active:bg-primary-active",
        destructive:
          "bg-destructive text-destructive-foreground shadow-card hover:bg-destructive/90",
        outline:
          "border-border bg-surface text-foreground shadow-xs hover:border-primary/30 hover:bg-surface-subtle hover:text-foreground",
        secondary:
          "border-border bg-secondary text-secondary-foreground shadow-xs hover:bg-muted",
        tertiary:
          "bg-accent text-accent-foreground shadow-xs hover:bg-accent-hover",
        ghost: "text-foreground-soft hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        // Variantes REL (constitucion §16 y §24: extender antes de duplicar).
        // Aditivas: ninguna variante existente cambia, asi que Psicosocial se
        // ve exactamente igual despues de este cambio.
        // El anillo de foco ya NO se repite en cada variante: `--rel-focus-ring`
        // y `--ring` son hoy el mismo token, asi que la base lo resuelve para
        // todas. Repetirlo aqui solo garantizaba que las dos familias se
        // separasen en cuanto una de las dos cambiara.
        rel: "bg-rel-accent text-rel-dark shadow-rel-card hover:bg-rel-accent/90",
        relOutline:
          "border border-rel-border-strong bg-rel-surface text-rel-dark shadow-xs hover:border-rel-primary/40 hover:bg-rel-surface-subtle",
        relGhost: "text-rel-dark hover:bg-rel-surface-subtle",
        // Destructiva: rojo semantico, NUNCA el azul corporativo (§16). Esta si
        // conserva anillo propio, porque el foco debe avisar del peligro.
        relDanger:
          "bg-rel-danger text-rel-danger-foreground shadow-rel-card hover:bg-rel-danger/90 focus-visible:ring-rel-danger",
      },
      // El alto sigue al del control, porque un boton y un campo comparten
      // fila constantemente --buscador y boton Buscar, campo y Guardar-- y
      // cuatro pixeles de diferencia entre dos cosas de la misma fila es
      // exactamente el defecto que este trabajo vino a quitar.
      //
      // `sm` se queda en 36 px a proposito: vive dentro de filas de tabla, de
      // paginadores y de tarjetas densas, donde 44 no cabe sin cambiar la
      // densidad de la pantalla entera. El minimo exigible (WCAG 2.5.8) son
      // 24 px; los 44 son la recomendacion para el pulgar, y la cumple todo
      // lo que se toca en una pantalla de movil.
      size: {
        default: "h-11 px-4 py-2.5",
        sm: "h-9 px-3 text-xs",
        lg: "h-12 px-8 text-sm",
        icon: "h-11 w-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
