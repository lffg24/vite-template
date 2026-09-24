import { AlertCircle, ArrowLeft, ArrowRight, Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { WebDirectContentFrame } from "./WebDirectContentFrame";
import { getIncompleteWebDirectStages } from "./webDirectFlow";
import type { WebDirectForm, WebDirectJourneyStage } from "./types";

type WebDirectReviewScreenProps = {
  form: WebDirectForm;
  stages: WebDirectJourneyStage[];
  onBack: () => void;
  onContinue: () => void;
};

export function WebDirectReviewScreen({
  form,
  stages,
  onBack,
  onContinue,
}: WebDirectReviewScreenProps) {
  const incompleteStages = getIncompleteWebDirectStages(stages);
  const complete = stages.length > 0 && incompleteStages.length === 0;

  return (
    <WebDirectContentFrame
      stepLabel="Revisión final"
      progress={{ current: 5, total: 6, label: "Revisión final" }}
      eyebrow="Revisión final"
      title="Resumen de tu batería"
      description="Comprueba que todos los componentes estén completos antes de continuar con la declaración final."
      illustration="psicoWebResumen"
      aside={
        <div className={cn(
          "rounded-2xl border p-5",
          complete ? "border-success/25 bg-success/5" : "border-warning/30 bg-warning/10",
        )}>
          <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
            {complete ? `${stages.length} de ${stages.length} componentes` : "Revisión pendiente"}
          </p>
          <p className="mt-2 font-heading text-lg font-black">
            {complete ? "Todo está completo" : `${incompleteStages.length} componente(s) pendiente(s)`}
          </p>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {complete
              ? "Las respuestas permanecen en este intento y se enviarán únicamente después de tu confirmación."
              : "Completa los componentes pendientes antes de confirmar el envío."}
          </p>
        </div>
      }
      actions={
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
          <Button type="button" variant="outline" onClick={onBack}>
            <ArrowLeft aria-hidden="true" /> Volver al recorrido
          </Button>
          <Button type="button" size="lg" disabled={!complete} onClick={onContinue}>
            <span className="sm:hidden">Continuar</span>
            <span className="hidden sm:inline">Continuar a declaración final</span>
            <ArrowRight aria-hidden="true" />
          </Button>
        </div>
      }
    >
      {!complete ? (
        <div role="alert" className="mb-5 flex gap-3 rounded-2xl border border-warning/30 bg-warning/10 p-4 text-sm">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-warning-foreground" aria-hidden="true" />
          <div>
            <p className="font-bold">La batería todavía no está completa.</p>
            <p className="mt-1 leading-6 text-muted-foreground">Regresa al recorrido y completa cada componente aplicable.</p>
          </div>
        </div>
      ) : null}

      <ol className="space-y-3" aria-label="Componentes revisados">
        {stages.map((stage) => {
          const isComplete = stage.status === "completed";
          return (
            <li key={stage.code} className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-4">
              <span className={cn(
                "grid h-9 w-9 shrink-0 place-items-center rounded-full",
                isComplete ? "bg-success/10 text-success" : "bg-warning/10 text-warning-foreground",
              )} aria-hidden="true">
                {isComplete ? <Check className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-heading text-sm font-bold sm:text-base">{stage.title}</span>
                <span className="mt-1 block text-xs leading-5 text-muted-foreground">
                  {stage.code === "PSICO_INTRA_A" || stage.code === "PSICO_INTRA_B"
                    ? `Forma ${form} asignada`
                    : stage.description}
                </span>
              </span>
              <span className={cn(
                "hidden rounded-full px-3 py-1.5 text-xs font-bold sm:inline-flex",
                isComplete ? "bg-success/10 text-success" : "bg-warning/10 text-warning-foreground",
              )}>
                {isComplete ? "Completado" : "Pendiente"}
              </span>
            </li>
          );
        })}
      </ol>
    </WebDirectContentFrame>
  );
}
