import * as React from "react"

import { cn } from "@/lib/utils"
import { CLASE_CONTROL } from "@/shared/ui/controles"

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentProps<"textarea">
>(({ className, ...props }, ref) => {
  return (
    <textarea
      /* Mismo tratamiento que `Input`, y ahora por construccion y no por
         copia: los dos piden `CLASE_CONTROL`. Lo unico propio del area de
         texto es su alto minimo. */
      className={cn(CLASE_CONTROL, "flex min-h-[80px]", className)}
      ref={ref}
      {...props}
    />
  )
})
Textarea.displayName = "Textarea"

export { Textarea }
