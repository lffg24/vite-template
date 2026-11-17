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

const TOAST_THEME: Record<ToastType, { wrapper: string; accent: string; Icon: any }> = {
  success: {
    wrapper: "border-emerald-200/80 bg-white/95 text-emerald-950 shadow-[0_18px_48px_rgba(16,185,129,0.18)]",
    accent: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100",
    Icon: CheckCircle2,
  },
  warning: {
    wrapper: "border-amber-200/80 bg-white/95 text-amber-950 shadow-[0_18px_48px_rgba(245,158,11,0.18)]",
    accent: "bg-amber-50 text-amber-700 ring-1 ring-amber-100",
    Icon: AlertTriangle,
  },
  error: {
    wrapper: "border-rose-200/80 bg-white/95 text-rose-950 shadow-[0_18px_48px_rgba(244,63,94,0.18)]",
    accent: "bg-rose-50 text-rose-700 ring-1 ring-rose-100",
    Icon: XCircle,
  },
  info: {
    wrapper: "border-sky-200/80 bg-white/95 text-sky-950 shadow-[0_18px_48px_rgba(59,130,246,0.18)]",
    accent: "bg-sky-50 text-sky-700 ring-1 ring-sky-100",
    Icon: Info,
  },
};

export function ToastCard({ toast, onClose }: { toast: ToastPayload; onClose: () => void }) {
  const theme = TOAST_THEME[toast.type];
  const Icon = theme.Icon;
  return (
    <div className={`fixed right-5 top-5 z-[120] w-full max-w-[420px] overflow-hidden rounded-2xl border backdrop-blur ${theme.wrapper}`}>
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-brand-primary via-brand-sky to-brand-turquoise opacity-90" />
      <div className="flex gap-4 p-5">
        <div className={`mt-0.5 grid h-11 w-11 shrink-0 place-items-center rounded-xl ${theme.accent}`}>
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
              className="rounded-xl p-1.5 text-muted-foreground transition hover:bg-surface-subtle hover:text-foreground"
              aria-label="Cerrar notificación"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
          {!!toast.details?.length && (
            <div className="mt-3 rounded-xl border border-border/80 bg-surface-subtle/80 px-4 py-3">
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
                className="mt-4 inline-flex items-center justify-center rounded-lg bg-violet-700 px-4 py-2.5 text-sm font-black text-white transition hover:bg-violet-800"
              >
                {toast.action.label}
              </a>
            ) : (
              <button
                type="button"
                onClick={toast.action.onClick}
                style={toast.action.style}
                className="mt-4 inline-flex items-center justify-center rounded-lg bg-violet-700 px-4 py-2.5 text-sm font-black text-white transition hover:bg-violet-800"
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
