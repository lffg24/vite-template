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
  const buttonTone = tone === "amber" ? "bg-warning text-warning-foreground hover:brightness-95" : "bg-primary text-primary-foreground hover:bg-primary-hover";
  const badgeTone = tone === "amber" ? "bg-warning/15 text-warning ring-warning/20" : "bg-accent text-brand-primary ring-brand-primary/10";
  const Icon = tone === "amber" ? AlertTriangle : ShieldCheck;

  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg overflow-hidden rounded-[30px] border border-border/80 bg-surface shadow-floating">
        <div className="flex items-start gap-4 p-6">
          <div className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl ring-1 ${badgeTone}`}>
            <Icon className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-xl font-black tracking-tight text-foreground">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
              </div>
              <button type="button" onClick={onCancel} className="rounded-xl p-1.5 text-muted-foreground transition hover:bg-surface-subtle hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <button type="button" onClick={onCancel} className="rounded-2xl border border-border px-5 py-3 text-sm font-bold text-foreground-soft transition hover:bg-surface-subtle">
                {cancelLabel}
              </button>
              <button type="button" onClick={onConfirm} className={`rounded-2xl px-5 py-3 text-sm font-bold shadow-card transition ${buttonTone}`}>
                {confirmLabel}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
