import { AlertCircle, ArrowLeft, Check, LockKeyhole, Send } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

import { WebDirectContentFrame } from "./WebDirectContentFrame";

type WebDirectDeclarationScreenProps = {
  accepted: boolean;
  onAcceptedChange: (accepted: boolean) => void;
  onBack: () => void;
  onSubmit: () => void;
  submitting?: boolean;
  error?: string | null;
};

export const WEB_DIRECT_DECLARATION_TEXT =
  "Declaro que he diligenciado personalmente la información y los cuestionarios presentados en este proceso y que las respuestas registradas corresponden a la información suministrada por mí.";

export function WebDirectDeclarationScreen({
  accepted,
  onAcceptedChange,
  onBack,
  onSubmit,
  submitting = false,
  error,
}: WebDirectDeclarationScreenProps) {
  return (
    <WebDirectContentFrame
      stepLabel="Declaración final"
      progress={{ current: 6, total: 6, label: "Último paso" }}
      eyebrow="Último paso"
      title="Declaración final"
      description="Antes de enviar definitivamente tu presentación, necesitamos registrar tu confirmación."
      illustration="psicoWebDeclaracion"
      aside={
        <div className="space-y-3">
          <div className="rounded-2xl border border-warning/30 bg-warning/10 p-4">
            <p className="font-heading text-base font-black">Antes de finalizar</p>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">Después de confirmar no podrás modificar tus respuestas.</p>
          </div>
          <div className="flex gap-3 rounded-2xl border border-info/20 bg-info/5 p-4 text-sm leading-6 text-muted-foreground">
            <LockKeyhole className="mt-0.5 h-5 w-5 shrink-0 text-info" aria-hidden="true" />
            Esta declaración registra tu aceptación, pero no constituye una firma electrónica robusta.
          </div>
        </div>
      }
      actions={
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
          <Button type="button" variant="outline" disabled={submitting} onClick={onBack}>
            <ArrowLeft aria-hidden="true" /> Volver al resumen
          </Button>
          <Button type="button" size="lg" disabled={!accepted || submitting} onClick={onSubmit}>
            {submitting ? "Enviando presentación…" : "Confirmar y finalizar"}
            {submitting ? <Send className="animate-pulse" aria-hidden="true" /> : <Check aria-hidden="true" />}
          </Button>
        </div>
      }
    >
      {error ? (
        <div role="alert" className="mb-5 flex gap-3 rounded-2xl border border-destructive/25 bg-destructive/5 p-4 text-sm text-destructive">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
          <span className="font-semibold">{error}</span>
        </div>
      ) : null}

      <blockquote className="rounded-2xl border border-info/15 bg-info/5 p-5 font-serif text-base italic leading-8 text-foreground sm:p-6 sm:text-lg">
        “{WEB_DIRECT_DECLARATION_TEXT}”
      </blockquote>

      <div className="mt-5 rounded-2xl border border-border bg-surface p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <Checkbox
            id="web-direct-declaration"
            checked={accepted}
            disabled={submitting}
            onCheckedChange={(checked) => onAcceptedChange(checked === true)}
            className="mt-0.5 h-5 w-5"
            aria-describedby="web-direct-declaration-help"
          />
          <div>
            <Label htmlFor="web-direct-declaration" className="cursor-pointer font-bold leading-6">
              Acepto expresamente esta declaración.
            </Label>
            <p id="web-direct-declaration-help" className="mt-1 text-sm leading-6 text-muted-foreground">
              La aceptación quedará registrada con fecha y hora cuando el envío sea confirmado por el sistema.
            </p>
          </div>
        </div>
      </div>
    </WebDirectContentFrame>
  );
}
