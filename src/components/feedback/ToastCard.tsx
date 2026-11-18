import type { CSSProperties, ReactNode } from "react";
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from "lucide-react";

export type ToastType = "success" | "error" | "warning" | "info";
export type ToastPayload = {
  id: number;
  type: ToastType;
  title: string;
  message?: string;
  details?: string[];
  moreCount?: number;
  icon?: ReactNode;
  action?: { label: string; href?: string; onClick?: () => void; style?: CSSProperties };
  durationMs?: number;
};

/**
 * El aviso tenia su propio sistema de color, y era el ultimo que quedaba.
 *
 * Los cuatro tonos se escribian con la paleta cruda de Tailwind —emerald,
 * amber, rose, sky— mas una sombra arbitraria tintada a mano por tono
 * (`shadow-[0_18px_48px_rgba(16,185,129,0.18)]` y tres mas). Dos problemas, y
 * el segundo es el grave:
 *
 *   - **No es la paleta del producto.** El verde de exito de la casa es
 *     `--rel-success`, no `emerald-50`. Dos verdes distintos para la misma
 *     idea, y el del aviso no lo eligio nadie.
 *   - **No responde al tema.** `bg-white/95` con `text-emerald-950` encima es,
 *     en tema oscuro, una caja blanca con texto casi negro sobre una pagina
 *     oscura. Es exactamente el defecto que ya se arreglo en las banderas de
 *     error, en la pieza que avisa de si algo funciono o fallo.
 *
 * Los tonos de aqui son los mismos cuatro que usa `Aviso`, con sus tokens.
 */
const TOAST_THEME: Record<ToastType, { wrapper: string; accent: string; Icon: any }> = {
  success: {
    wrapper: "border-success/30 bg-success-subtle text-foreground",
    accent: "bg-success/15 text-success ring-1 ring-success/20",
    Icon: CheckCircle2,
  },
  warning: {
    wrapper: "border-warning/30 bg-warning-subtle text-foreground",
    accent: "bg-warning/15 text-warning ring-1 ring-warning/20",
    Icon: AlertTriangle,
  },
  error: {
    wrapper: "border-danger/30 bg-danger-subtle text-foreground",
    accent: "bg-danger/15 text-danger ring-1 ring-danger/20",
    Icon: XCircle,
  },
  info: {
    wrapper: "border-info/30 bg-info-subtle text-foreground",
    accent: "bg-info/15 text-info ring-1 ring-info/20",
    Icon: Info,
  },
};

export function ToastCard({ toast, onClose }: { toast: ToastPayload; onClose: () => void }) {
  const theme = TOAST_THEME[toast.type];
  const Icon = theme.Icon;
  return (
    <div className={`fixed right-5 top-5 z-rel-aviso w-full max-w-[420px] overflow-hidden rounded-rel-panel border shadow-rel-floating backdrop-blur ${theme.wrapper}`}>
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-brand-primary via-brand-sky to-brand-turquoise opacity-90" />
      <div className="flex gap-4 p-5">
        <div className={`mt-0.5 grid h-11 w-11 shrink-0 place-items-center rounded-rel-card ${theme.accent}`}>
          {toast.icon || <Icon className="h-5 w-5" />}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-base font-black tracking-tight">{toast.title}</p>
              {toast.message && <p className="mt-1 text-sm leading-6 text-foreground-soft">{toast.message}</p>}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-rel-card p-1.5 text-muted-foreground transition hover:bg-surface-subtle hover:text-foreground"
              aria-label="Cerrar notificación"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
          {!!toast.details?.length && (
            <div className="mt-3 rounded-rel-card border border-border/80 bg-surface-subtle/80 px-4 py-3">
              <ul className="space-y-1.5 text-sm text-foreground-soft">
                {toast.details.map((detail) => (
                  <li key={detail} className="flex gap-2 leading-5">
                    <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-brand-primary" />
                    <span>{detail}</span>
                  </li>
                ))}
              </ul>
              {!!toast.moreCount && (
                <p className="mt-2 text-xs font-semibold text-muted-foreground">y {toast.moreCount} más…</p>
              )}
            </div>
          )}
          {toast.action && (
            toast.action.href ? (
              <a
                href={toast.action.href}
                target="_blank"
                rel="noreferrer"
                style={toast.action.style}
                className="mt-4 inline-flex items-center justify-center rounded-rel-control bg-primary px-4 py-2.5 text-sm font-black text-primary-foreground transition hover:bg-primary-hover"
              >
                {toast.action.label}
              </a>
            ) : (
              <button
                type="button"
                onClick={toast.action.onClick}
                style={toast.action.style}
                className="mt-4 inline-flex items-center justify-center rounded-rel-control bg-primary px-4 py-2.5 text-sm font-black text-primary-foreground transition hover:bg-primary-hover"
              >
                {toast.action.label}
              </button>
            )
          )}
        </div>
      </div>
    </div>
  );
}
