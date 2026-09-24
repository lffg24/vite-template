import { ArrowLeft, ArrowRight, ExternalLink, FileText, LockKeyhole } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

import type { WebDirectConsentDocument } from "./types";
import { WebDirectContentFrame } from "./WebDirectContentFrame";

type WebDirectConsentScreenProps = {
  documents: WebDirectConsentDocument[];
  acceptedDocumentIds: string[];
  onAcceptedDocumentIdsChange: (ids: string[]) => void;
  onBack: () => void;
  onContinue: (acceptedDocumentIds: string[]) => void;
  isSubmitting?: boolean;
  error?: string | null;
};

export function WebDirectConsentScreen({
  documents,
  acceptedDocumentIds,
  onAcceptedDocumentIdsChange,
  onBack,
  onContinue,
  isSubmitting = false,
  error,
}: WebDirectConsentScreenProps) {
  const allAccepted = documents.length > 0 && documents.every((document) => acceptedDocumentIds.includes(document.id));

  function updateAcceptance(documentId: string, checked: boolean) {
    const next = checked
      ? Array.from(new Set([...acceptedDocumentIds, documentId]))
      : acceptedDocumentIds.filter((id) => id !== documentId);
    onAcceptedDocumentIdsChange(next);
  }

  return (
    <WebDirectContentFrame
      stepLabel="Privacidad y autorización"
      progress={{ current: 5, total: 6 }}
      eyebrow="Consentimiento y privacidad"
      title="Revisa y acepta los documentos aplicables"
      description="La aceptación se registrará para esta aplicación junto con la versión vigente de cada documento."
      illustration="psicoWebConsentimiento"
      aside={
        <div className="rounded-2xl border border-success/20 bg-success/10 p-5 text-sm leading-6 text-foreground-soft">
          <LockKeyhole className="h-5 w-5 text-success" aria-hidden="true" />
          <p className="mt-3 font-heading font-bold text-foreground">Tus respuestas son confidenciales</p>
          <p className="mt-1">Se utilizarán únicamente para los fines profesionales definidos en este proceso.</p>
        </div>
      }
      actions={
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Button type="button" variant="outline" size="lg" onClick={onBack} className="min-h-12 w-full sm:w-auto">
            <ArrowLeft aria-hidden="true" /> Volver
          </Button>
          <Button
            type="button"
            size="lg"
            disabled={!allAccepted || isSubmitting}
            onClick={() => onContinue(acceptedDocumentIds)}
            className="min-h-12 w-full px-6 text-foreground sm:w-auto"
          >
            {isSubmitting ? "Registrando…" : "Aceptar y continuar"}
            {!isSubmitting ? <ArrowRight aria-hidden="true" /> : null}
          </Button>
        </div>
      }
    >
      {documents.length === 0 ? (
        <div role="alert" className="rounded-2xl border border-warning/30 bg-warning/10 p-5 text-sm leading-6 text-foreground">
          No hay documentos vigentes configurados para esta aplicación. Comunícate con el psicólogo responsable antes de continuar.
        </div>
      ) : (
        <div className="space-y-4">
          {documents.map((document) => {
            const checked = acceptedDocumentIds.includes(document.id);
            const checkboxId = `web-direct-consent-${document.id}`;
            return (
              <section key={document.id} className="rounded-2xl border border-border bg-surface-subtle p-4 sm:p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex min-w-0 gap-3">
                    <FileText className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
                    <div>
                      <h2 className="font-heading font-bold text-foreground">{document.title}</h2>
                      <p className="mt-1 text-sm leading-6 text-muted-foreground">{document.description}</p>
                      <p className="mt-1 text-xs font-semibold text-foreground-soft">Versión {document.version}</p>
                    </div>
                  </div>
                  <Button asChild variant="outline" className="w-full shrink-0 sm:w-auto">
                    <a href={document.href} target="_blank" rel="noreferrer">
                      Ver documento <ExternalLink aria-hidden="true" />
                    </a>
                  </Button>
                </div>

                <label htmlFor={checkboxId} className="mt-4 flex min-h-12 cursor-pointer items-start gap-3 rounded-xl border border-border bg-surface p-3 text-sm leading-6 transition hover:border-primary/30">
                  <Checkbox
                    id={checkboxId}
                    checked={checked}
                    onCheckedChange={(value) => updateAcceptance(document.id, value === true)}
                    className="mt-1 h-5 w-5"
                  />
                  <span>He leído y acepto <strong>{document.title}</strong>, versión {document.version}.</span>
                </label>
              </section>
            );
          })}
        </div>
      )}

      {error ? <div role="alert" className="mt-4 rounded-2xl border border-danger/25 bg-danger/10 p-4 text-sm text-foreground">{error}</div> : null}
    </WebDirectContentFrame>
  );
}
