import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center whitespace-nowrap rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground shadow hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground shadow hover:bg-destructive/80",
        outline: "text-foreground",
        // Semantica de estado REL. Separada de la marca a proposito (§5): el
        // turquesa corporativo no significa "exito" ni el azul "informacion".
        relSuccess:
          "border-transparent bg-rel-success-subtle text-rel-success",
        relInfo: "border-transparent bg-rel-info-subtle text-rel-info",
        relWarning:
          "border-transparent bg-rel-warning-subtle text-rel-warning",
        relDanger: "border-transparent bg-rel-danger-subtle text-rel-danger",
        relNeutral:
          "border-transparent bg-rel-neutral-subtle text-rel-neutral",
        relBrand: "border-rel-border bg-rel-canvas text-rel-dark",
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
