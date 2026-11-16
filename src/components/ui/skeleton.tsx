import { cn } from "@/lib/utils"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      /* Neutro, no turquesa. `bg-primary/10` llevaba el color de marca, asi
         que una pantalla cargando parecia una pantalla llena de contenido
         destacado. Un esqueleto es ausencia de contenido y debe leerse como
         tal.

         `aria-hidden` + `motion-safe`: un lector de pantalla no debe anunciar
         cajas vacias, y quien pide menos movimiento no necesita ver latir la
         pagina entera mientras carga. */
      aria-hidden="true"
      className={cn("rounded-md bg-muted motion-safe:animate-pulse", className)}
      {...props}
    />
  )
}

export { Skeleton }
