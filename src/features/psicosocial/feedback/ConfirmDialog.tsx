import { AlertTriangle, ShieldCheck, X } from "lucide-react";

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  tone = "violet",
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "violet" | "amber";
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!open) return null;
  const buttonTone = tone === "amber" ? "bg-amber-500 hover:bg-amber-600 shadow-amber-100" : "bg-violet-700 hover:bg-violet-800 shadow-violet-200";
  const badgeTone = tone === "amber" ? "bg-amber-50 text-amber-700 ring-amber-100" : "bg-violet-50 text-violet-700 ring-violet-100";
  const Icon = tone === "amber" ? AlertTriangle : ShieldCheck;

  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.28)]">
        <div className="flex items-start gap-4 p-6">
          <div className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl ring-1 ${badgeTone}`}>
            <Icon className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-xl font-black tracking-tight text-slate-950">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
              </div>
              <button type="button" onClick={onCancel} className="rounded-xl p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <button type="button" onClick={onCancel} className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50">
                {cancelLabel}
              </button>
              <button type="button" onClick={onConfirm} className={`rounded-2xl px-5 py-3 text-sm font-bold text-white shadow-lg transition ${buttonTone}`}>
                {confirmLabel}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
