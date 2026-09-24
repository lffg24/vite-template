import { ArrowLeft, ArrowRight, HelpCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

import { WebDirectParticipantShell } from "./WebDirectParticipantShell";
import type { WebDirectConditionalRule } from "./types";

type WebDirectConditionalQuestionScreenProps = {
  instrumentLabel: string;
  rule: WebDirectConditionalRule;
  value: boolean | null;
  onChange: (ruleCode: string, value: boolean) => void;
  onBack: () => void;
  onContinue: () => void;
};

export function WebDirectConditionalQuestionScreen({
  instrumentLabel,
  rule,
  value,
  onChange,
  onBack,
  onContinue,
}: WebDirectConditionalQuestionScreenProps) {
  if (!rule.label) {
    return (
      <WebDirectParticipantShell stepLabel={instrumentLabel}>
        <Card role="alert" className="mx-auto max-w-2xl rounded-3xl border-destructive/25 p-6 sm:p-8">
          <h1 className="font-heading text-xl font-black">Pregunta condicional incompleta</h1>
          <p className="mt-2 leading-6 text-muted-foreground">La configuración no incluye el texto que debe responder el participante.</p>
        </Card>
      </WebDirectParticipantShell>
    );
  }

  return (
    <WebDirectParticipantShell stepLabel={`${instrumentLabel} · Pregunta de contexto`} className="max-w-4xl">
      <Card className="rounded-[1.5rem] border-border bg-surface p-5 shadow-soft sm:rounded-[2rem] sm:p-9 lg:p-11">
        <div className="flex items-center gap-3 text-primary">
          <span className="grid h-10 w-10 place-items-center rounded-full bg-info/10"><HelpCircle className="h-5 w-5" aria-hidden="true" /></span>
          <p className="text-xs font-extrabold uppercase tracking-[0.16em]">Antes de continuar</p>
        </div>

        <fieldset className="mt-6" aria-labelledby="conditional-question-title">
          <legend className="sr-only">Pregunta de contexto</legend>
          <h1 id="conditional-question-title" className="max-w-3xl font-heading text-2xl font-black leading-tight sm:text-3xl lg:text-4xl">{rule.label}</h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">Esta respuesta determina qué preguntas corresponden a tu situación.</p>
          <div className="mt-7 grid gap-3 sm:grid-cols-2" role="radiogroup" aria-required="true">
            {[
              { label: "Sí", selectedValue: true },
              { label: "No", selectedValue: false },
            ].map((option) => {
              const id = `conditional-${rule.code}-${option.selectedValue ? "yes" : "no"}`;
              const selected = value === option.selectedValue;
              return (
                <label key={id} htmlFor={id} className={cn(
                  "flex min-h-16 cursor-pointer items-center gap-4 rounded-2xl border border-border px-5 py-4 text-lg font-bold focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2",
                  selected && "border-accent-foreground/40 bg-accent text-accent-foreground",
                )}>
                  <input
                    id={id}
                    type="radio"
                    name={`conditional-${rule.code}`}
                    checked={selected}
                    onChange={() => onChange(rule.code, option.selectedValue)}
                    className="h-5 w-5 accent-[hsl(var(--accent-foreground))]"
                  />
                  {option.label}
                </label>
              );
            })}
          </div>
        </fieldset>

        <div className="mt-8 flex items-center justify-between gap-3">
          <Button type="button" variant="outline" size="lg" onClick={onBack}><ArrowLeft aria-hidden="true" /> Anterior</Button>
          <Button type="button" size="lg" disabled={value === null} onClick={onContinue}>Continuar <ArrowRight aria-hidden="true" /></Button>
        </div>
      </Card>
    </WebDirectParticipantShell>
  );
}
