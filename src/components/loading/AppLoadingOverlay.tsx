import { Loader2 } from "lucide-react";

export function AppLoadingOverlay({ show, title = "Cargando información…", message }: { show: boolean; title?: string; message?: string }) {
  if (!show) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/20 p-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-[28px] border border-white/60 bg-white/95 p-6 text-center shadow-2xl shadow-violet-900/10">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-3xl bg-violet-50 text-violet-700 ring-8 ring-violet-100/60">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
        <h2 className="mt-5 text-lg font-black text-slate-950">{title}</h2>
        {message && <p className="mt-2 text-sm leading-relaxed text-slate-500">{message}</p>}
      </div>
    </div>
  );
}

export function ButtonSpinner({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-2">
      <Loader2 className="h-4 w-4 animate-spin" /> {label}
    </span>
  );
}

export function PageSkeleton({ title = "Preparando vista…" }: { title?: string }) {
  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-[1540px] space-y-5">
        <div className="h-28 animate-pulse rounded-[30px] border border-slate-200 bg-white" />
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="h-36 animate-pulse rounded-3xl border border-slate-200 bg-white" />
          <div className="h-36 animate-pulse rounded-3xl border border-slate-200 bg-white" />
          <div className="h-36 animate-pulse rounded-3xl border border-slate-200 bg-white" />
        </div>
        <div className="grid min-h-[360px] place-items-center rounded-3xl border border-slate-200 bg-white text-slate-600 shadow-sm">
          <div className="text-center">
            <Loader2 className="mx-auto h-10 w-10 animate-spin text-violet-700" />
            <p className="mt-3 text-sm font-black">{title}</p>
          </div>
        </div>
      </div>
    </main>
  );
}
