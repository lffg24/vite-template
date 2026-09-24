import { CheckCircle2, Clock3, FileCheck2, ShieldCheck } from "lucide-react";

import { WebDirectContentFrame } from "./WebDirectContentFrame";
import { WebDirectResponsibleContact } from "./WebDirectResponsibleContact";
import type { WebDirectResponsible } from "./types";

type WebDirectSubmittedScreenProps = {
  completedAt?: string | null;
  receiptReference?: string | null;
  responsible?: WebDirectResponsible | null;
};

export function WebDirectSubmittedScreen({
  completedAt,
  receiptReference,
  responsible,
}: WebDirectSubmittedScreenProps) {
  return (
    <WebDirectContentFrame
      stepLabel="Presentación recibida"
      progress={{ current: 6, total: 6, label: "Proceso completado" }}
      eyebrow="Proceso completado"
      title="Tu presentación fue recibida"
      description="Gracias por completar la batería. Tu participación contribuye a construir entornos laborales más saludables."
      illustration="psicoWebEnvioCompletado"
      aside={
        <div className="space-y-3">
          {(completedAt || receiptReference) ? (
            <div className="rounded-2xl border border-border bg-surface p-4 text-sm">
              <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Constancia de recepción</p>
              {completedAt ? <p className="mt-3 flex items-center gap-2 font-semibold"><Clock3 className="h-4 w-4 text-primary" aria-hidden="true" /> {completedAt}</p> : null}
              {receiptReference ? <p className="mt-2 flex items-center gap-2 break-all font-semibold"><FileCheck2 className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" /> {receiptReference}</p> : null}
            </div>
          ) : null}
          <WebDirectResponsibleContact responsible={responsible} />
        </div>
      }
    >
      <div role="status" className="rounded-2xl border border-success/25 bg-success/5 p-5 sm:p-6">
        <div className="flex gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-success/10 text-success">
            <CheckCircle2 className="h-6 w-6" aria-hidden="true" />
          </span>
          <div>
            <h2 className="font-heading text-xl font-black">Información registrada correctamente</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">La presentación quedó disponible para el profesional responsable del proceso.</p>
          </div>
        </div>
      </div>
      <div className="mt-4 flex gap-3 rounded-2xl border border-info/20 bg-info/5 p-4 text-sm leading-6 text-muted-foreground">
        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-info" aria-hidden="true" />
        Esta pantalla confirma únicamente la recepción. No muestra puntajes, resultados, dimensiones ni niveles de riesgo.
      </div>
    </WebDirectContentFrame>
  );
}
