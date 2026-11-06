import { AlertTriangle, CheckCircle2, Info, XCircle } from "lucide-react"

import { useToast } from "@/hooks/use-toast"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"

/**
 * El azulejo del icono y su color, por tono.
 *
 * Es el mismo lenguaje que Psicosocial ya usaba en `ToastCard`. Estaba escrito
 * allí y en ningún sitio compartido, así que el resto del producto avisaba con
 * una caja gris que no se parecía a nada de la casa — que es justo la queja.
 */
const TONO = {
  default: { clases: "bg-rel-accent-subtle text-rel-primary ring-1 ring-rel-border", Icono: Info },
  success: { clases: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100", Icono: CheckCircle2 },
  warning: { clases: "bg-amber-50 text-amber-700 ring-1 ring-amber-100", Icono: AlertTriangle },
  destructive: { clases: "bg-rose-50 text-rose-700 ring-1 ring-rose-100", Icono: XCircle },
} as const

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, variant, ...props }) {
        const tono = TONO[(variant ?? "default") as keyof typeof TONO] ?? TONO.default
        const Icono = tono.Icono
        return (
          <Toast key={id} variant={variant} {...props}>
            {/* La cinta de marca. Es lo que hace que el aviso se lea como parte
                del producto y no como un cuadro del navegador. */}
            <span
              aria-hidden="true"
              className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-brand-primary via-brand-sky to-brand-turquoise opacity-90"
            />
            <span
              aria-hidden="true"
              className={`mt-0.5 grid h-11 w-11 shrink-0 place-items-center rounded-2xl ${tono.clases}`}
            >
              <Icono className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && <ToastDescription>{description}</ToastDescription>}
              {action ? <div className="mt-3">{action}</div> : null}
            </div>
            <ToastClose />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}
