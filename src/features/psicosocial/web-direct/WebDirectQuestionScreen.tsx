import { AlertCircle, ArrowLeft, ArrowRight, Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

import { WebDirectParticipantShell } from "./WebDirectParticipantShell";
import { getApplicableWebDirectQuestions } from "./webDirectFlow";
import type {
  WebDirectAnswer,
  WebDirectConditionalRule,
  WebDirectForm,
  WebDirectInstrumentCode,
  WebDirectQuestion,
} from "./types";

type WebDirectQuestionScreenProps = {
  form: WebDirectForm;
  instrumentCode: WebDirectInstrumentCode;
  instrumentLabel: string;
  questions: WebDirectQuestion[];
  conditionalRules?: WebDirectConditionalRule[];
  currentQuestionId?: number;
  answers: Record<number, string>;
  onAnswer: (answer: WebDirectAnswer) => void;
  onPrevious: (question: WebDirectQuestion) => void;
  onNext: (question: WebDirectQuestion) => void;
  answerState?: "idle" | "selected";
};

const answerStateCopy = {
  idle: null,
  selected: { icon: Check, label: "Respuesta seleccionada", className: "text-success" },
} as const;

export function WebDirectQuestionScreen({
  form,
  instrumentCode,
  instrumentLabel,
  questions,
  conditionalRules = [],
  currentQuestionId,
  answers,
  onAnswer,
  onPrevious,
  onNext,
  answerState = "idle",
}: WebDirectQuestionScreenProps) {
  const applicableQuestions = getApplicableWebDirectQuestions(questions, conditionalRules);
  const currentIndex = Math.max(
    0,
    currentQuestionId
      ? applicableQuestions.findIndex((question) => question.questionId === currentQuestionId)
      : 0,
  );
  const question = applicableQuestions[currentIndex];

  if (!question) {
    return (
      <WebDirectParticipantShell stepLabel="Cuestionario">
        <Card role="alert" className="mx-auto max-w-2xl rounded-3xl border-destructive/25 p-6 sm:p-8">
          <div className="flex gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" aria-hidden="true" />
            <div>
              <h1 className="font-heading text-xl font-black">No hay preguntas disponibles</h1>
              <p className="mt-2 leading-6 text-muted-foreground">Contacta al profesional responsable para revisar la configuración del instrumento.</p>
            </div>
          </div>
        </Card>
      </WebDirectParticipantShell>
    );
  }

  const selectedValue = answers[question.questionId] ?? "";
  const percentage = Math.round(((currentIndex + 1) / applicableQuestions.length) * 100);
  const stateCopy = answerStateCopy[answerState];

  return (
    <WebDirectParticipantShell stepLabel={`${instrumentLabel} · Forma ${form}`} className="max-w-5xl">
      <section aria-labelledby="question-title">
        <div className="mb-5 rounded-2xl border border-border bg-surface px-4 py-4 shadow-sm sm:px-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.15em] text-primary">{instrumentLabel}</p>
              <p className="mt-1 text-sm font-semibold text-muted-foreground">Pregunta {currentIndex + 1} de {applicableQuestions.length}</p>
            </div>
            {stateCopy ? (
              <span role="status" className={cn("inline-flex items-center gap-2 text-sm font-bold", stateCopy.className)}>
                <stateCopy.icon className="h-4 w-4" aria-hidden="true" />
                {stateCopy.label}
              </span>
            ) : null}
          </div>
          <Progress className="mt-4" value={percentage} aria-label={`${percentage}% de ${instrumentLabel} completado`} />
        </div>

        <Card className="rounded-[1.5rem] border-border bg-surface p-5 shadow-soft sm:rounded-[2rem] sm:p-9 lg:p-11">
          <fieldset aria-labelledby="question-title">
            <legend className="sr-only">Pregunta {currentIndex + 1}</legend>
            <h1 id="question-title" className="max-w-4xl font-heading text-2xl font-black leading-tight text-foreground sm:text-3xl lg:text-4xl">
              {question.text}
            </h1>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">Selecciona la opción que mejor refleje tu experiencia.</p>

            <div className="mt-7 grid gap-3" role="radiogroup" aria-required={question.required ?? true}>
              {question.options.map((option) => {
                const inputId = `question-${question.questionId}-${option.value}`;
                const selected = selectedValue === option.value;
                return (
                  <label
                    key={option.value}
                    htmlFor={inputId}
                    className={cn(
                      "flex min-h-14 cursor-pointer items-center gap-4 rounded-2xl border border-border px-4 py-3 text-base font-semibold transition-colors focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2",
                      selected && "border-accent-foreground/40 bg-accent text-accent-foreground",
                    )}
                  >
                    <input
                      id={inputId}
                      type="radio"
                      name={`question-${question.questionId}`}
                      value={option.value}
                      checked={selected}
                      onChange={() => onAnswer({
                        questionId: question.questionId,
                        order: question.order,
                        value: option.value,
                        instrumentCode,
                        dimensionCode: question.dimensionCode,
                        domainCode: question.domainCode,
                      })}
                      className="h-5 w-5 shrink-0 accent-[hsl(var(--accent-foreground))]"
                    />
                    <span>{option.label}</span>
                  </label>
                );
              })}
            </div>
          </fieldset>

          <div className="mt-8 flex items-center justify-between gap-3">
            <Button type="button" variant="outline" size="lg" disabled={currentIndex === 0} onClick={() => onPrevious(question)}>
              <ArrowLeft aria-hidden="true" /> Anterior
            </Button>
            <Button type="button" size="lg" disabled={!selectedValue} onClick={() => onNext(question)}>
              {currentIndex === applicableQuestions.length - 1 ? "Completar instrumento" : "Siguiente"}
              {currentIndex === applicableQuestions.length - 1 ? <Check aria-hidden="true" /> : <ArrowRight aria-hidden="true" />}
            </Button>
          </div>
        </Card>
      </section>
    </WebDirectParticipantShell>
  );
}
