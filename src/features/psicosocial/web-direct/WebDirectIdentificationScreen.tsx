import { useState, type FormEvent } from "react";
import { ArrowLeft, ArrowRight, CalendarDays, IdCard, Info } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Illustration } from "@/shared/ui/illustration";

import type { WebDirectApplicationContext, WebDirectIdentification } from "./types";
import { WebDirectParticipantShell } from "./WebDirectParticipantShell";
import { WebDirectResponsibleContact } from "./WebDirectResponsibleContact";

type WebDirectIdentificationScreenProps = {
  context: WebDirectApplicationContext;
  onBack: () => void;
  onSubmit: (identification: WebDirectIdentification) => void | Promise<void>;
  isSubmitting?: boolean;
  error?: string | null;
};

type FieldErrors = Partial<Record<keyof WebDirectIdentification, string>>;

export function WebDirectIdentificationScreen({
  context,
  onBack,
  onSubmit,
  isSubmitting = false,
  error,
}: WebDirectIdentificationScreenProps) {
  const [documentNumber, setDocumentNumber] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors: FieldErrors = {};
    if (!documentNumber.trim()) nextErrors.documentNumber = "Ingresa tu número de documento.";
    if (!birthDate) nextErrors.birthDate = "Selecciona tu fecha de nacimiento.";
    setFieldErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    void onSubmit({ documentNumber: documentNumber.trim(), birthDate });
  }

  const today = new Date().toISOString().slice(0, 10);

  return (
    <WebDirectParticipantShell stepLabel="Paso 2 · Verificación de identidad">
      <Card className="overflow-hidden rounded-[1.5rem] border-border bg-surface shadow-soft sm:rounded-[2rem]">
        <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(22rem,0.8fr)]">
          <form noValidate onSubmit={handleSubmit} className="p-6 sm:p-9 lg:p-12">
            <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-primary">Identificación</p>
            <h1 className="mt-3 text-balance font-heading text-3xl font-black leading-tight text-foreground sm:text-4xl">
              Confirma tus datos para continuar
            </h1>
            <p className="mt-3 max-w-2xl text-base leading-7 text-muted-foreground">
              Usa la información con la que fuiste habilitado en esta aplicación. Estos datos no aparecerán en la dirección web.
            </p>

            <Illustration
              name="psicoWebIdentificacion"
              variant="hero"
              size="full"
              priority
              className="mx-auto mt-5 max-h-48 max-w-sm lg:hidden"
            />

            <div className="mt-8 max-w-2xl space-y-6">
              <div>
                <Label htmlFor="web-direct-document" className="text-sm font-bold">Número de documento</Label>
                <div className="relative mt-2">
                  <IdCard className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                  <Input
                    id="web-direct-document"
                    name="documentNumber"
                    inputMode="numeric"
                    autoComplete="off"
                    value={documentNumber}
                    onChange={(event) => {
                      setDocumentNumber(event.target.value);
                      if (fieldErrors.documentNumber) setFieldErrors((current) => ({ ...current, documentNumber: undefined }));
                    }}
                    aria-invalid={Boolean(fieldErrors.documentNumber)}
                    aria-describedby={fieldErrors.documentNumber ? "web-direct-document-error" : undefined}
                    className="h-12 pl-12"
                    placeholder="Ingresa tu documento"
                  />
                </div>
                {fieldErrors.documentNumber ? <p id="web-direct-document-error" className="mt-2 text-sm font-semibold text-danger">{fieldErrors.documentNumber}</p> : null}
              </div>

              <div>
                <Label htmlFor="web-direct-birth-date" className="text-sm font-bold">Fecha de nacimiento</Label>
                <div className="relative mt-2">
                  <CalendarDays className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                  <Input
                    id="web-direct-birth-date"
                    name="birthDate"
                    type="date"
                    max={today}
                    value={birthDate}
                    onChange={(event) => {
                      setBirthDate(event.target.value);
                      if (fieldErrors.birthDate) setFieldErrors((current) => ({ ...current, birthDate: undefined }));
                    }}
                    aria-invalid={Boolean(fieldErrors.birthDate)}
                    aria-describedby={fieldErrors.birthDate ? "web-direct-birth-date-error" : "web-direct-identification-help"}
                    className="h-12 pl-12"
                  />
                </div>
                {fieldErrors.birthDate ? <p id="web-direct-birth-date-error" className="mt-2 text-sm font-semibold text-danger">{fieldErrors.birthDate}</p> : null}
              </div>

              <div id="web-direct-identification-help" className="flex gap-3 rounded-2xl border border-info/20 bg-info/10 p-4 text-sm leading-6 text-foreground-soft">
                <Info className="mt-0.5 h-5 w-5 shrink-0 text-info" aria-hidden="true" />
                <p>La fecha de nacimiento es un dato adicional de verificación. No corresponde a una autenticación fuerte.</p>
              </div>

              {error ? (
                <div role="alert" className="rounded-2xl border border-danger/25 bg-danger/10 p-4 text-sm leading-6 text-foreground">
                  <p className="font-bold">No pudimos validar la información.</p>
                  <p className="mt-1">{error}</p>
                </div>
              ) : null}
            </div>

            <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
              <Button type="button" variant="outline" size="lg" onClick={onBack} className="min-h-12 w-full sm:w-auto">
                <ArrowLeft aria-hidden="true" /> Volver
              </Button>
              <Button type="submit" size="lg" disabled={isSubmitting} className="min-h-12 w-full px-6 text-foreground sm:w-auto">
                {isSubmitting ? "Validando…" : "Validar y continuar"}
                {!isSubmitting ? <ArrowRight aria-hidden="true" /> : null}
              </Button>
            </div>
          </form>

          <aside className="flex flex-col justify-between border-t border-border bg-surface-subtle/70 p-6 sm:p-8 lg:border-l lg:border-t-0 lg:p-10">
            <Illustration
              name="psicoWebIdentificacion"
              variant="hero"
              size="full"
              priority
              className="mx-auto hidden max-h-[21rem] max-w-lg lg:block"
            />
            <div className="mt-5 space-y-4">
              <p className="text-sm leading-6 text-muted-foreground">Si no reconocemos tus datos, podrás revisarlos o comunicarte con el profesional responsable sin revelar cuál dato no coincidió.</p>
              <WebDirectResponsibleContact responsible={context.responsible} />
            </div>
          </aside>
        </div>
      </Card>
    </WebDirectParticipantShell>
  );
}
