import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow hover:bg-primary/90",
        destructive:
          "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
        outline:
          "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        // Variantes REL (constitucion §16 y §24: extender antes de duplicar).
        // Aditivas: ninguna variante existente cambia, asi que Psicosocial se
        // ve exactamente igual despues de este cambio.
        rel: "bg-rel-primary text-rel-primary-foreground shadow-sm hover:bg-rel-primary/90 focus-visible:ring-2 focus-visible:ring-rel-primary focus-visible:ring-offset-2",
        relOutline:
          "border border-rel-border-strong bg-rel-surface text-rel-dark shadow-sm hover:bg-rel-surface-subtle focus-visible:ring-2 focus-visible:ring-rel-primary focus-visible:ring-offset-2",
        relGhost:
          "text-rel-dark hover:bg-rel-surface-subtle focus-visible:ring-2 focus-visible:ring-rel-primary focus-visible:ring-offset-2",
        // Destructiva: rojo semantico, NUNCA el azul corporativo (§16).
        relDanger:
          "bg-rel-danger text-rel-danger-foreground shadow-sm hover:bg-rel-danger/90 focus-visible:ring-2 focus-visible:ring-rel-danger focus-visible:ring-offset-2",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        icon: "h-9 w-9",
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
