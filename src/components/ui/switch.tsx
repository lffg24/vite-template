import * as React from "react";
import * as SwitchPrimitive from "@radix-ui/react-switch";

import { cn } from "@/lib/utils";

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitive.Root>
>(({ className, ...props }, ref) => (
  <SwitchPrimitive.Root
    ref={ref}
    className={cn(
      /* Tokens de la casa y la curva compartida. El anillo apuntaba a
         `--rel-primary` mientras el resto de los controles usa `--ring`: hoy
         valen lo mismo, pero eran dos fuentes para una sola decision. */
      "peer inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent bg-muted-foreground/35 transition-colors duration-rel-micro ease-rel-out motion-reduce:transition-none",
      "focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
      "data-[state=checked]:bg-primary-active disabled:cursor-not-allowed disabled:opacity-50",
      className,
    )}
    {...props}
  >
    <SwitchPrimitive.Thumb
      /* `ease-rel-spring` solo aqui: el pulgar es el unico elemento del
         sistema que recorre una distancia, y el rebote minimo al final es lo
         que hace que el gesto se sienta mecanico en vez de plano. */
      className="pointer-events-none block h-5 w-5 rounded-full bg-white shadow-xs transition-transform duration-rel-micro ease-rel-spring data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0 motion-reduce:transition-none"
    />
  </SwitchPrimitive.Root>
));
Switch.displayName = SwitchPrimitive.Root.displayName;

export { Switch };
