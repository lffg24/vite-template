import * as React from "react"
import * as ToastPrimitives from "@radix-ui/react-toast"
import { cva, type VariantProps } from "class-variance-authority"
import { X } from "lucide-react"

import { cn } from "@/lib/utils"

const ToastProvider = ToastPrimitives.Provider

const ToastViewport = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Viewport>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Viewport>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Viewport
    ref={ref}
    className={cn(
      "pointer-events-none fixed right-0 top-0 z-rel-aviso flex max-h-screen w-full flex-col gap-3 p-4 sm:max-w-[440px]",
      className
    )}
    {...props}
  />
))
ToastViewport.displayName = ToastPrimitives.Viewport.displayName

const toastVariants = cva(
  "group pointer-events-auto relative flex w-full items-start gap-4 overflow-hidden rounded-2xl border p-5 pr-10 backdrop-blur-sm transition-all data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-(--radix-toast-swipe-end-x) data-[swipe=move]:translate-x-(--radix-toast-swipe-move-x) data-[swipe=move]:transition-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-top-full sm:data-[state=open]:slide-in-from-right-full",
  {
    variants: {
      // Los cuatro tonos que ya usaba Psicosocial en `ToastCard`, traidos aqui
      // para que TODOS los modulos avisen igual. El aviso era una caja plana con
      // borde gris y no se parecia en nada al resto de la casa.
      //
      // Fondo claro con sombra de color, no fondo de color: un panel rojo entero
      // se lee como una alarma del sistema, y la mayoria de estos avisos son
      // «se guardo».
      variant: {
        default:
          "border-border bg-card/95 text-foreground shadow-[0_18px_48px_hsl(var(--foreground)/0.14)]",
        success:
          "border-success/40 bg-card/95 text-foreground shadow-[0_18px_48px_hsl(var(--success)/0.18)]",
        warning:
          "border-warning/40 bg-card/95 text-foreground shadow-[0_18px_48px_hsl(var(--warning)/0.18)]",
        // Se llama `destructive` y no `error` porque es el nombre que ya usan
        // las llamadas repartidas por el producto. Cambiarlo obligaria a tocar
        // cada una para ganar una palabra.
        destructive:
          "destructive group border-danger/40 bg-card/95 text-foreground shadow-[0_18px_48px_hsl(var(--danger)/0.18)]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

const Toast = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Root> &
    VariantProps<typeof toastVariants>
>(({ className, variant, ...props }, ref) => {
  return (
    <ToastPrimitives.Root
      ref={ref}
      className={cn(toastVariants({ variant }), className)}
      {...props}
    />
  )
})
Toast.displayName = ToastPrimitives.Root.displayName

const ToastAction = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Action>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Action>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Action
    ref={ref}
    className={cn(
      // Mismo foco y misma curva que el resto de los controles pulsables.
      "inline-flex h-9 shrink-0 items-center justify-center rounded-lg border border-border bg-transparent px-3 font-heading text-sm font-semibold transition-colors duration-rel-micro ease-rel-out hover:bg-surface-subtle focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 motion-reduce:transition-none hover:group-[.destructive]:border-danger/40 hover:group-[.destructive]:bg-danger hover:group-[.destructive]:text-danger-foreground focus-visible:group-[.destructive]:ring-danger",
      className
    )}
    {...props}
  />
))
ToastAction.displayName = ToastPrimitives.Action.displayName

const ToastClose = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Close>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Close>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Close
    ref={ref}
    className={cn(
      // Visible SIEMPRE, no solo al pasar el raton: con `opacity-0` no habia
      // forma de cerrarlo desde un telefono, donde no hay hover.
      "absolute right-3 top-3 rounded-lg p-1.5 text-muted-foreground transition-colors duration-rel-micro ease-rel-out hover:bg-surface-subtle hover:text-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background motion-reduce:transition-none",
      className
    )}
    toast-close=""
    {...props}
  >
    <X className="h-4 w-4" aria-hidden="true" />
  </ToastPrimitives.Close>
))
ToastClose.displayName = ToastPrimitives.Close.displayName

const ToastTitle = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Title>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Title>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Title
    ref={ref}
    className={cn("font-rel-heading text-base font-black tracking-tight", className)}
    {...props}
  />
))
ToastTitle.displayName = ToastPrimitives.Title.displayName

const ToastDescription = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Description>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Description>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Description
    ref={ref}
    className={cn("mt-1 text-sm leading-6 text-foreground-soft", className)}
    {...props}
  />
))
ToastDescription.displayName = ToastPrimitives.Description.displayName

type ToastProps = React.ComponentPropsWithoutRef<typeof Toast>

type ToastActionElement = React.ReactElement<typeof ToastAction>

export {
  type ToastProps,
  type ToastActionElement,
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastClose,
  ToastAction,
}
