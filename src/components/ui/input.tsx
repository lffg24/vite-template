import * as React from "react"

import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          /* Tres cambios sobre lo que habia:
             - `hover:border-border-strong`: el campo no daba ninguna senal
               antes de recibir el foco, asi que en un formulario denso no se
               distinguia de una etiqueta con borde.
             - anillo de foco de 4 px al 25 %: el de 2 px al 20 % apenas se
               veia sobre fondo blanco, y el foco visible es requisito, no
               adorno.
             - `aria-invalid`: el error se pinta desde el atributo que el
               lector de pantalla ya anuncia, en lugar de pedir a cada
               formulario que recuerde anadir una clase roja. */
          "flex h-10 w-full rounded-lg border border-input bg-surface px-3 py-2 font-body text-base text-foreground shadow-sm transition-[border-color,box-shadow,background-color] duration-rel-micro ease-rel-out file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground hover:border-border-strong focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-input-focus/25 focus-visible:border-input-focus aria-[invalid=true]:border-danger aria-[invalid=true]:focus-visible:ring-danger/25 disabled:cursor-not-allowed disabled:bg-muted/60 disabled:opacity-50 motion-reduce:transition-none md:text-sm",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
