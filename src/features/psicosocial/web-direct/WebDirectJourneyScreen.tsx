import { AlertCircle, ArrowRight, Check, Circle, ClipboardList } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

import { WebDirectContentFrame } from "./WebDirectContentFrame";
import { getJourneyCompletion } from "./webDirectFlow";
import type { WebDirectForm, WebDirectInstrumentCode, WebDirectJourneyStage } from "./types";

type WebDirectJourneyScreenProps = {
  form: WebDirectForm;
  stages: WebDirectJourneyStage[];
  missingInstrumentCodes?: WebDirectInstrumentCode[];
  onStartStage: (stage: WebDirectJourneyStage) => void;
  onBack: () => void;
};

const statusLabel = {
  pending: "Pendiente",
  current: "Siguiente",
  completed: "Completado",
} as const;

export function WebDirectJourneyScreen({
  form,
  stages,
  missingInstrumentCodes = [],
  onStartStage,
  onBack,
}: WebDirectJourneyScreenProps) {
  const current = stages.find((stage) => stage.status === "current") ?? stages.find((stage) => stage.status === "pending");
  const completion = getJourneyCompletion(stages);
  const blocked = missingInstrumentCodes.length > 0 || !current;

  return (
    <WebDirectContentFrame
      stepLabel="Tu batería"
      progress={{ current: 6, total: 6, label: "Preparación completada" }}
      eyebrow="Recorrido asignado"
      title="Tu batería"
      description={`Responderás el cuestionario intralaboral Forma ${form}, extralaboral, estrés y al final tus datos generales.`}
      illustration="psicoWebRecorrido"
      aside={
        <div className="rounded-2xl border border-border bg-surface p-5">
          <div className="flex items-center justify-between gap-4 text-sm font-bold">
            <span>Progreso de este intento</span>
            <span className="text-primary">{completion}%</span>
          </div>
          <Progress value={completion} className="mt-3" aria-label={`${completion}% del intento completado`} />
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Completa la batería en esta sesión. Si sales antes de enviarla, deberás comenzar de nuevo.
          </p>
        </div>
      }
      actions={
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Button type="button" variant="outline" onClick={onBack}>Volver</Button>
          <Button type="button" size="lg" disabled={blocked} onClick={() => current && onStartStage(current)}>
            <span className="sm:hidden">{current ? "Comenzar" : "Completado"}</span>
            <span className="hidden sm:inline">{current ? `Comenzar ${current.title.toLocaleLowerCase("es")}` : "Recorrido completado"}</span>
            {current ? <ArrowRight aria-hidden="true" /> : <Check aria-hidden="true" />}
          </Button>
        </div>
      }
    >
      {missingInstrumentCodes.length > 0 ? (
        <div role="alert" className="mb-5 flex gap-3 rounded-2xl border border-destructive/25 bg-destructive/5 p-4 text-sm text-foreground">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" aria-hidden="true" />
          <div>
            <p className="font-bold">No es posible iniciar la batería.</p>
            <p className="mt-1 leading-6 text-muted-foreground">
              La aplicación no tiene configurados todos los instrumentos requeridos. Contacta al profesional responsable.
            </p>
          </div>
        </div>
      ) : null}

      <ol className="space-y-3" aria-label="Orden de la batería">
        {stages.map((stage, index) => {
          const isComplete = stage.status === "completed";
          const isCurrent = stage === current;
          return (
            <li
              key={stage.code}
              className={cn(
                "flex items-center gap-4 rounded-2xl border border-border bg-surface p-4",
                isCurrent && "border-primary/35 bg-primary/5",
              )}
              aria-current={isCurrent ? "step" : undefined}
            >
              <span
                className={cn(
                  "grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-surface-subtle text-sm font-black text-foreground",
                  isComplete && "bg-success/10 text-success",
                  isCurrent && "bg-accent text-accent-foreground",
                )}
                aria-hidden="true"
              >
                {isComplete ? <Check className="h-5 w-5" /> : index + 1}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-heading text-sm font-bold text-foreground sm:text-base">{stage.title}</span>
                <span className="mt-1 block text-xs leading-5 text-muted-foreground sm:text-sm">
                  {stage.totalQuestions ? `${stage.totalQuestions} preguntas · ` : ""}{stage.description}
                </span>
              </span>
              <span className={cn(
                "hidden items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 text-xs font-bold text-muted-foreground sm:inline-flex",
                isComplete && "bg-success/10 text-success",
                isCurrent && "bg-accent text-accent-foreground",
              )}>
                {isComplete ? <Check className="h-3.5 w-3.5" /> : isCurrent ? <ClipboardList className="h-3.5 w-3.5" /> : <Circle className="h-3 w-3" />}
                {statusLabel[stage.status]}
              </span>
            </li>
          );
        })}
      </ol>
    </WebDirectContentFrame>
  );
}
