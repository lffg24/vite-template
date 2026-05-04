import type { ReactNode } from "react";
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
    <div className={`fixed right-5 top-5 z-[120] w-full max-w-[420px] overflow-hidden rounded-[26px] border backdrop-blur ${theme.wrapper}`}>
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-violet-500 via-fuchsia-500 to-cyan-400 opacity-80" />
      <div className="flex gap-4 p-5">
        <div className={`mt-0.5 grid h-11 w-11 shrink-0 place-items-center rounded-2xl ${theme.accent}`}>
          {toast.icon || <Icon className="h-5 w-5" />}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-base font-black tracking-tight">{toast.title}</p>
              {toast.message && <p className="mt-1 text-sm leading-6 text-slate-600">{toast.message}</p>}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              aria-label="Cerrar notificación"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          {!!toast.details?.length && (
            <div className="mt-3 rounded-2xl border border-slate-200/80 bg-slate-50/80 px-4 py-3">
              <ul className="space-y-1.5 text-sm text-slate-700">
                {toast.details.map((detail) => (
                  <li key={detail} className="flex gap-2 leading-5">
                    <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-violet-500" />
                    <span>{detail}</span>
                  </li>
                ))}
              </ul>
              {!!toast.moreCount && (
                <p className="mt-2 text-xs font-semibold text-slate-500">y {toast.moreCount} más…</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
