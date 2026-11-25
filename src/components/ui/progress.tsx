import * as React from "react"
import * as ProgressPrimitive from "@radix-ui/react-progress"

import { cn } from "@/lib/utils"

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root>
>(({ className, value, ...props }, ref) => (
  <ProgressPrimitive.Root
    ref={ref}
    className={cn(
      "relative h-2.5 w-full overflow-hidden rounded-full bg-muted",
      className
    )}
    {...props}
  >
    <ProgressPrimitive.Indicator
      /* `bg-primary`, no `bg-brand-turquoise`: la barra sigue al token de
         accion de la casa y no a un color de marca fijo, que en modo oscuro
         no cambia. `transition-transform` en vez de `transition-all`: lo que
         se mueve es el `translateX` de abajo, y con `all` el navegador
         animaba tambien cualquier recalculo de ancho del contenedor. */
      className="h-full w-full flex-1 rounded-full bg-primary transition-transform duration-rel-panel ease-rel-out motion-reduce:transition-none"
      style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
    />
  </ProgressPrimitive.Root>
))
Progress.displayName = ProgressPrimitive.Root.displayName

export { Progress }
