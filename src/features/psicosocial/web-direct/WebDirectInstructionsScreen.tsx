import type { ReactNode } from "react";
import { ArrowLeft, ArrowRight, BookOpenCheck, Info } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import { WebDirectContentFrame } from "./WebDirectContentFrame";

type WebDirectInstructionsScreenProps = {
  formLabel: "Forma A" | "Forma B";
  instructions: ReactNode;
  onBack: () => void;
  onContinue: () => void;
};

export function WebDirectInstructionsScreen({
  formLabel,
  instructions,
  onBack,
  onContinue,
}: WebDirectInstructionsScreenProps) {
  return (
    <WebDirectContentFrame
      stepLabel="Preparación del proceso"
      progress={{ current: 4, total: 6 }}
      eyebrow="Instructivo oficial"
      title="Lee cómo debes responder"
      description="Estas instrucciones provienen del contenido autorizado para el instrumento asignado y podrás volver a consultarlas durante el diligenciamiento."
      illustration="psicoWebInstructivo"
      aside={
        <div className="rounded-2xl border border-info/20 bg-info/10 p-5 text-sm leading-6 text-foreground-soft">
          <Info className="h-5 w-5 text-info" aria-hidden="true" />
          <p className="mt-3 font-heading font-bold text-foreground">No hay respuestas correctas o incorrectas</p>
          <p className="mt-1">Lee cada afirmación con calma y responde de acuerdo con tu experiencia.</p>
        </div>
      }
      actions={
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Button type="button" variant="outline" size="lg" onClick={onBack} className="min-h-12 w-full sm:w-auto">
            <ArrowLeft aria-hidden="true" /> Volver
          </Button>
          <Button type="button" size="lg" onClick={onContinue} className="min-h-12 w-full px-6 text-foreground sm:w-auto">
            Continuar al consentimiento <ArrowRight aria-hidden="true" />
          </Button>
        </div>
      }
    >
      <article className="rounded-2xl border border-border bg-surface-subtle p-5 sm:p-6">
        <div className="flex flex-wrap items-center gap-3">
          <BookOpenCheck className="h-6 w-6 text-primary" aria-hidden="true" />
          <h2 className="font-heading text-lg font-bold">Indicaciones para responder</h2>
          <Badge variant="accent" className="normal-case tracking-normal">{formLabel}</Badge>
        </div>
        <div className="mt-4 space-y-3 text-sm leading-7 text-foreground-soft sm:text-base">{instructions}</div>
      </article>
    </WebDirectContentFrame>
  );
}
