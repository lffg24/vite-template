import * as React from "react"

import { cn } from "@/lib/utils"

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentProps<"textarea">
>(({ className, ...props }, ref) => {
  return (
    <textarea
      /* Mismo tratamiento que `Input`, caracter por caracter. Antes divergian
         en TODO lo que se percibe: `rounded-md` frente a `rounded-lg`, fondo
         transparente frente a `bg-surface`, anillo de foco de 1 px frente a 4,
         y ninguna senal al pasar el puntero. En un formulario con un campo de
         texto y un area de texto contiguos, los dos controles se veian de
         productos distintos. */
      className={cn(
        "flex min-h-[80px] w-full rounded-lg border border-input bg-surface px-3 py-2 font-body text-base text-foreground shadow-sm transition-[border-color,box-shadow,background-color] duration-rel-micro ease-rel-out placeholder:text-muted-foreground hover:border-border-strong focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-input-focus/25 focus-visible:border-input-focus aria-[invalid=true]:border-danger aria-[invalid=true]:focus-visible:ring-danger/25 disabled:cursor-not-allowed disabled:bg-muted/60 disabled:opacity-50 motion-reduce:transition-none md:text-sm",
        className
      )}
      ref={ref}
      {...props}
    />
  )
})
Textarea.displayName = "Textarea"

export { Textarea }
