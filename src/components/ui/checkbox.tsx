import * as React from "react"
import * as CheckboxPrimitive from "@radix-ui/react-checkbox"
import { Check } from "lucide-react"

import { cn } from "@/lib/utils"

const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>
>(({ className, ...props }, ref) => (
  <CheckboxPrimitive.Root
    ref={ref}
    className={cn(
      /* Tres correcciones:

         - 18 px en vez de 16. A 16 el objetivo tactil queda por debajo de
           cualquier umbral razonable, y en una tabla con una casilla por
           fila es el control que mas se falla.
         - Borde `border-input` en reposo. `border-primary` pintaba de
           turquesa TODAS las casillas sin marcar, asi que una casilla vacia
           se leia como activada.
         - Anillo de 2 px con separacion, el de los controles pulsables
           —boton, interruptor—, en lugar del de 1 px sin separacion. */
      "peer h-[18px] w-[18px] shrink-0 rounded-xs border border-input bg-surface shadow-sm transition-colors duration-rel-micro ease-rel-out hover:border-border-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground motion-reduce:transition-none",
      className
    )}
    {...props}
  >
    <CheckboxPrimitive.Indicator
      className={cn("flex items-center justify-center text-current")}
    >
      <Check className="h-3.5 w-3.5" strokeWidth={3} aria-hidden="true" />
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
))
Checkbox.displayName = CheckboxPrimitive.Root.displayName

export { Checkbox }
