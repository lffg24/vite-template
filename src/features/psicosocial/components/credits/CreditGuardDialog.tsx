import type { CSSProperties } from "react";
import { ExternalLink, WalletCards, X } from "lucide-react";
import { CREDIT_PURCHASE_WHATSAPP_URL, REL_PRIMARY_COLOR, type CreditGuardInfo } from "@/features/psicosocial/utils/creditGuard";

type CreditGuardDialogProps = {
  info: CreditGuardInfo | null;
  onClose: () => void;
};

export function CreditGuardDialog({ info, onClose }: CreditGuardDialogProps) {
  if (!info?.isInsufficient) return null;
  const primaryStyle = { backgroundColor: REL_PRIMARY_COLOR } satisfies CSSProperties;

  return (
    <div className="fixed inset-0 z-[130] grid place-items-center bg-slate-950/50 px-4 backdrop-blur-sm">
      <section className="relative w-full max-w-xl overflow-hidden rounded-[30px] border border-white/70 bg-white p-6 shadow-2xl shadow-slate-950/20 sm:p-7">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-2xl border border-slate-200 bg-white p-2 text-slate-500 transition hover:bg-slate-50 hover:text-slate-900"
          aria-label="Cerrar alerta de créditos"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="grid gap-6 sm:grid-cols-[190px_1fr] sm:items-center">
          <CreditStateIllustration />
          <div className="pr-8 sm:pr-0">
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-black uppercase tracking-wide text-amber-700">
              <WalletCards className="h-4 w-4" />
              Control de créditos
            </div>
            <h2 className="mt-4 text-2xl font-black tracking-tight text-slate-950">Créditos insuficientes</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">{info.message}</p>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <Metric label="Disponibles" value={info.saldoActual ?? 0} />
              <Metric label="Requeridos" value={info.requeridos ?? 1} />
            </div>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <a
                href={CREDIT_PURCHASE_WHATSAPP_URL}
                target="_blank"
                rel="noreferrer"
                style={primaryStyle}
                className="inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-black text-white transition hover:brightness-95"
              >
                Comprar créditos <ExternalLink className="h-4 w-4" />
              </a>
              <button
                type="button"
                onClick={onClose}
                className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-50"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-black text-slate-950">{Number(value || 0).toLocaleString("es-CO")}</p>
    </div>
  );
}

function CreditStateIllustration() {
  return (
    <svg
      viewBox="0 0 220 220"
      role="img"
      aria-label="Ilustración de control de créditos y estados"
      className="mx-auto h-48 w-48"
      style={{ "--rel-primary": REL_PRIMARY_COLOR } as CSSProperties}
    >
      <rect x="16" y="18" width="188" height="184" rx="38" fill="#F5F3FF" />
      <circle cx="68" cy="82" r="31" fill="var(--rel-primary)" opacity="0.15" />
      <circle cx="155" cy="158" r="34" fill="#10B981" opacity="0.16" />
      <path d="M61 64c14-16 40-10 45 10 4 18-11 36-30 34-22-3-29-28-15-44Z" fill="#0F172A" />
      <circle cx="82" cy="82" r="22" fill="#FFC19A" />
      <path d="M65 83c9 1 20-8 24-19 8 5 12 14 11 24 10-14 1-36-21-38-18-2-31 14-28 31 3 1 8 2 14 2Z" fill="#0F172A" />
      <path d="M55 129c3-21 18-34 39-34h5c22 0 39 15 42 36l5 39H51l4-41Z" fill="var(--rel-primary)" />
      <path d="M129 103c13 8 20 17 26 30" stroke="#FFC19A" strokeWidth="12" strokeLinecap="round" />
      <path d="M155 132c12-6 20-13 25-23" stroke="#FFC19A" strokeWidth="12" strokeLinecap="round" />
      <path d="M107 115h60" stroke="var(--rel-primary)" strokeWidth="5" strokeLinecap="round" strokeDasharray="8 8" opacity="0.75" />
      <rect x="138" y="41" width="36" height="30" rx="12" fill="#DDD6FE" />
      <circle cx="156" cy="56" r="10" fill="var(--rel-primary)" />
      <rect x="138" y="89" width="36" height="30" rx="12" fill="#DCFCE7" />
      <circle cx="156" cy="104" r="10" fill="#10B981" />
      <rect x="151" y="136" width="44" height="34" rx="13" fill="#FEF3C7" stroke="#F59E0B" strokeWidth="2" strokeDasharray="6 5" />
      <circle cx="173" cy="153" r="10" fill="#F59E0B" />
      <circle cx="167" cy="184" r="18" fill="var(--rel-primary)" opacity="0.95" />
      <circle cx="184" cy="178" r="18" fill="var(--rel-primary)" opacity="0.75" />
      <path d="M101 164l18 12 34-43" fill="none" stroke="var(--rel-primary)" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M101 164l18 12 34-43" fill="none" stroke="#FFFFFF" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" opacity="0.92" />
    </svg>
  );
}

