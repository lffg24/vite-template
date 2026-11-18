import * as React from "react"

import { cn } from "@/lib/utils"
import { CLASE_CONTROL } from "@/shared/ui/controles"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        /* El aspecto sale de `CLASE_CONTROL`, no de aqui. Lo que queda es lo
           propio del campo de una linea: su alto y el tratamiento del boton
           de archivo. Antes esta cadena era la definicion del aspecto del
           control, y homologar el area de texto consistio en copiarla
           caracter por caracter; el desplegable se quedo fuera y la copia se
           multiplico por cinco. */
        className={cn(
          CLASE_CONTROL,
          "flex h-10 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
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
