import { ArrowRight, Check, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";

import { WebDirectContentFrame } from "./WebDirectContentFrame";

type WebDirectInstrumentCompleteScreenProps = {
  instrumentLabel: string;
  answeredQuestions: number;
  nextComponentLabel: string;
  progress: { current: number; total: number };
  onContinue: () => void;
};

export function WebDirectInstrumentCompleteScreen({
  instrumentLabel,
  answeredQuestions,
  nextComponentLabel,
  progress,
  onContinue,
}: WebDirectInstrumentCompleteScreenProps) {
  return (
    <WebDirectContentFrame
      stepLabel={`Componente ${progress.current} de ${progress.total}`}
      progress={{ ...progress, label: `${instrumentLabel} completado` }}
      eyebrow="Sección completada"
      title="Completaste este instrumento"
      description={`Terminaste ${instrumentLabel}. Puedes continuar con el siguiente componente de la batería.`}
      illustration="psicoWebInstrumentoCompletado"
      aside={
        <div className="rounded-2xl border border-border bg-surface p-5">
          <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Siguiente componente</p>
          <p className="mt-2 font-heading text-lg font-black">{nextComponentLabel}</p>
        </div>
      }
      actions={
        <div className="flex justify-end">
          <Button type="button" size="lg" onClick={onContinue}>
            <span className="sm:hidden">Continuar</span>
            <span className="hidden sm:inline">Continuar con {nextComponentLabel.toLocaleLowerCase("es")}</span>
            <ArrowRight aria-hidden="true" />
          </Button>
        </div>
      }
    >
      <div className="rounded-2xl border border-success/25 bg-success/5 p-5">
        <div className="flex gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-success/10 text-success"><Check className="h-5 w-5" aria-hidden="true" /></span>
          <div>
            <h2 className="font-heading text-xl font-black">{answeredQuestions} respuestas completadas</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">Esta sección permanece en la sesión actual y se enviará únicamente cuando finalices toda la batería.</p>
          </div>
        </div>
      </div>
      <div className="mt-4 flex gap-3 rounded-2xl border border-info/20 bg-info/5 p-4 text-sm leading-6 text-muted-foreground">
        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-info" aria-hidden="true" />
        No se muestran puntajes, resultados ni niveles de riesgo durante el diligenciamiento.
      </div>
    </WebDirectContentFrame>
  );
}
