import { ArrowLeft, ArrowRight, Check, Clock3, ListChecks, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";

import { WebDirectContentFrame } from "./WebDirectContentFrame";
import type { WebDirectForm } from "./types";

type WebDirectInstrumentIntroScreenProps = {
  instrumentLabel: string;
  form?: WebDirectForm;
  questionCount: number;
  estimatedMinutes?: string;
  guidance: string[];
  progress: { current: number; total: number };
  onBack: () => void;
  onStart: () => void;
};

const guidanceIcons = [Check, ShieldCheck, ListChecks];

export function WebDirectInstrumentIntroScreen({
  instrumentLabel,
  form,
  questionCount,
  estimatedMinutes,
  guidance,
  progress,
  onBack,
  onStart,
}: WebDirectInstrumentIntroScreenProps) {
  return (
    <WebDirectContentFrame
      stepLabel={`Componente ${progress.current} de ${progress.total}`}
      progress={{ ...progress, label: `Componente ${progress.current} de ${progress.total}` }}
      eyebrow="Antes de comenzar"
      title={instrumentLabel}
      description={form ? `Tienes asignada la Forma ${form}. Esta asignación no puede modificarse durante el proceso.` : "Lee estas recomendaciones antes de responder."}
      illustration="psicoWebInstrumento"
      aside={
        <div className="grid grid-cols-2 gap-3 rounded-2xl border border-border bg-surface p-4 text-sm">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Preguntas</p>
            <p className="mt-1 font-heading text-xl font-black">{questionCount}</p>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Tiempo estimado</p>
            <p className="mt-1 inline-flex items-center gap-2 font-heading text-xl font-black">
              <Clock3 className="h-4 w-4 text-primary" aria-hidden="true" /> {estimatedMinutes ?? "Variable"}
            </p>
          </div>
        </div>
      }
      actions={
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
          <Button type="button" variant="outline" onClick={onBack}><ArrowLeft aria-hidden="true" /> Volver al recorrido</Button>
          <Button type="button" size="lg" onClick={onStart}>Comenzar cuestionario <ArrowRight aria-hidden="true" /></Button>
        </div>
      }
    >
      <div className="rounded-2xl border border-border bg-surface-subtle p-4 sm:p-5">
        <h2 className="font-heading text-lg font-black">Ten presente</h2>
        <ul className="mt-4 space-y-3">
          {guidance.map((item, index) => {
            const Icon = guidanceIcons[index % guidanceIcons.length];
            return (
              <li key={item} className="flex gap-3 rounded-xl border border-border bg-surface p-3.5 text-sm font-semibold leading-6">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-accent text-accent-foreground">
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </span>
                <span className="pt-1">{item}</span>
              </li>
            );
          })}
        </ul>
      </div>
    </WebDirectContentFrame>
  );
}
