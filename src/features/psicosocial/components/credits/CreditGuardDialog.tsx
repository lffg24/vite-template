import { ExternalLink, WalletCards } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  CREDIT_PURCHASE_WHATSAPP_URL,
  type CreditGuardInfo,
} from "@/features/psicosocial/utils/creditGuard";

type CreditGuardDialogProps = {
  info: CreditGuardInfo | null;
  onClose: () => void;
};

export function CreditGuardDialog({ info, onClose }: CreditGuardDialogProps) {
  if (!info?.isInsufficient) return null;

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="rel-scope max-h-[90vh] overflow-y-auto rounded-rel-panel border-rel-border bg-rel-surface p-6 shadow-floating sm:max-w-xl sm:p-8">
        <div className="grid gap-6 sm:grid-cols-[176px_1fr] sm:items-center">
          <CreditStateIllustration />

          <div className="min-w-0">
            <DialogHeader>
              <div className="inline-flex w-fit items-center gap-2 rounded-full border border-rel-warning/30 bg-rel-warning-subtle px-3 py-1 text-xs font-bold uppercase tracking-wide text-rel-warning">
                <WalletCards className="h-4 w-4" aria-hidden="true" />
                Control de créditos
              </div>
              <DialogTitle className="pt-2 font-rel-heading text-2xl font-black text-rel-dark">
                Créditos insuficientes
              </DialogTitle>
              <DialogDescription className="font-rel-body leading-6 text-rel-muted">
                {info.message}
              </DialogDescription>
            </DialogHeader>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <Metric label="Disponibles" value={info.saldoActual ?? 0} />
              <Metric label="Requeridos" value={info.requeridos ?? 1} />
            </div>

            <DialogFooter className="mt-6 gap-2 sm:space-x-0">
              <DialogClose asChild>
                <Button type="button" variant="relOutline">
                  Cerrar
                </Button>
              </DialogClose>
              <Button asChild variant="rel">
                <a href={CREDIT_PURCHASE_WHATSAPP_URL} target="_blank" rel="noreferrer">
                  Comprar créditos
                  <ExternalLink aria-hidden="true" />
                </a>
              </Button>
            </DialogFooter>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-rel-control border border-rel-border bg-rel-canvas px-4 py-3">
      <p className="text-xs font-bold uppercase tracking-wide text-rel-muted">{label}</p>
      <p className="mt-1 font-rel-heading text-2xl font-black text-rel-dark">
        {Number(value || 0).toLocaleString("es-CO")}
      </p>
    </div>
  );
}

function CreditStateIllustration() {
  return (
    <svg
      viewBox="0 0 220 220"
      aria-hidden="true"
      className="mx-auto h-44 w-44 text-rel-primary"
    >
      <rect x="16" y="18" width="188" height="184" rx="38" className="fill-rel-canvas" />
      <circle cx="68" cy="82" r="31" fill="currentColor" opacity="0.15" />
      <circle cx="155" cy="158" r="34" className="fill-rel-success" opacity="0.16" />
      <path d="M61 64c14-16 40-10 45 10 4 18-11 36-30 34-22-3-29-28-15-44Z" className="fill-rel-dark" />
      <circle cx="82" cy="82" r="22" fill="#FFC19A" />
      <path d="M65 83c9 1 20-8 24-19 8 5 12 14 11 24 10-14 1-36-21-38-18-2-31 14-28 31 3 1 8 2 14 2Z" className="fill-rel-dark" />
      <path d="M55 129c3-21 18-34 39-34h5c22 0 39 15 42 36l5 39H51l4-41Z" fill="currentColor" />
      <path d="M129 103c13 8 20 17 26 30" stroke="#FFC19A" strokeWidth="12" strokeLinecap="round" />
      <path d="M155 132c12-6 20-13 25-23" stroke="#FFC19A" strokeWidth="12" strokeLinecap="round" />
      <path d="M107 115h60" stroke="currentColor" strokeWidth="5" strokeLinecap="round" strokeDasharray="8 8" opacity="0.75" />
      <rect x="138" y="41" width="36" height="30" rx="12" className="fill-rel-accent-subtle" />
      <circle cx="156" cy="56" r="10" fill="currentColor" />
      <rect x="138" y="89" width="36" height="30" rx="12" className="fill-rel-success-subtle" />
      <circle cx="156" cy="104" r="10" className="fill-rel-success" />
      <rect x="151" y="136" width="44" height="34" rx="13" className="fill-rel-warning-subtle stroke-rel-warning" strokeWidth="2" strokeDasharray="6 5" />
      <circle cx="173" cy="153" r="10" className="fill-rel-warning" />
      <circle cx="167" cy="184" r="18" fill="currentColor" opacity="0.95" />
      <circle cx="184" cy="178" r="18" fill="currentColor" opacity="0.75" />
      <path d="M101 164l18 12 34-43" fill="none" stroke="currentColor" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M101 164l18 12 34-43" fill="none" stroke="white" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" opacity="0.92" />
    </svg>
  );
}
