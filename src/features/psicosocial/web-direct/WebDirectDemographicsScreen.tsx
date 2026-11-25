import { useState, type FormEvent } from "react";
import { ArrowLeft, ArrowRight, LockKeyhole } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

import { WebDirectContentFrame } from "./WebDirectContentFrame";
import { FieldError, WebDirectMunicipalityField, WebDirectSelectField } from "./WebDirectFieldControls";
import type { WebDirectDemographicSection, WebDirectDemographicValues, WebDirectMunicipality } from "./types";

type WebDirectDemographicsScreenProps = {
  sections: WebDirectDemographicSection[];
  values: WebDirectDemographicValues;
  onValuesChange: (values: WebDirectDemographicValues) => void;
  onBack: () => void;
  onContinue: (values: WebDirectDemographicValues) => void;
  loading?: boolean;
  error?: string | null;
  onMunicipalitySearch?: (query: string) => Promise<WebDirectMunicipality[]>;
};

export function WebDirectDemographicsScreen({
  sections,
  values,
  onValuesChange,
  onBack,
  onContinue,
  loading = false,
  error,
  onMunicipalitySearch = async () => [],
}: WebDirectDemographicsScreenProps) {
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const updateValue = (fieldId: string, value: string) => {
    onValuesChange({ ...values, [fieldId]: value });
    if (value.trim()) setFieldErrors((current) => ({ ...current, [fieldId]: "" }));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors: Record<string, string> = {};
    for (const field of sections.flatMap((section) => section.fields)) {
      const rawValue = String(values[field.id] ?? "").trim();
      if (field.required && !rawValue) {
        nextErrors[field.id] = "Completa este campo para continuar.";
        continue;
      }
      if (field.type === "number" && rawValue) {
        const numericValue = Number(rawValue);
        if (!Number.isFinite(numericValue)) nextErrors[field.id] = "Ingresa un número válido.";
        else if (field.min !== undefined && numericValue < field.min) nextErrors[field.id] = `El valor mínimo es ${field.min}.`;
        else if (field.max !== undefined && numericValue > field.max) nextErrors[field.id] = `El valor máximo es ${field.max}.`;
      }
    }
    setFieldErrors(nextErrors);
    if (Object.keys(nextErrors).length === 0) onContinue(values);
  };

  return (
    <WebDirectContentFrame
      stepLabel="Componente 4 de 4"
      progress={{ current: 4, total: 4, label: "Datos generales · último componente" }}
      eyebrow="Último componente"
      title="Datos generales"
      description="Revisa y completa tu información sociodemográfica y ocupacional. Los datos precargados pueden editarse cuando sea necesario."
      illustration="psicoWebDatosGenerales"
      aside={
        <div className="flex gap-3 rounded-2xl border border-info/20 bg-info/5 p-4 text-sm leading-6 text-muted-foreground">
          <LockKeyhole className="mt-0.5 h-5 w-5 shrink-0 text-info" aria-hidden="true" />
          Esta información se utiliza únicamente dentro del proceso de evaluación psicosocial autorizado.
        </div>
      }
    >
      {error ? <div role="alert" className="mb-5 rounded-2xl border border-destructive/25 bg-destructive/5 p-4 text-sm font-semibold text-destructive">{error}</div> : null}
      {sections.length === 0 ? (
        <div role="alert" className="rounded-2xl border border-warning/30 bg-warning/10 p-5 text-sm leading-6">No hay campos de datos generales configurados. Contacta al profesional responsable.</div>
      ) : (
        <form onSubmit={handleSubmit} noValidate className="space-y-5">
          {sections.map((section) => (
            <section key={section.id} aria-labelledby={`demographic-section-${section.id}`} className="rounded-2xl border border-border bg-surface p-4 sm:p-5">
              <h2 id={`demographic-section-${section.id}`} className="font-heading text-lg font-black">{section.title}</h2>
              {section.description ? <p className="mt-1 text-sm leading-6 text-muted-foreground">{section.description}</p> : null}
              <div className="mt-5 grid gap-5 sm:grid-cols-2">
                {section.fields.map((field) => {
                  const fieldId = `web-direct-demographic-${field.id}`;
                  const errorId = `${fieldId}-error`;
                  return (
                    <div key={field.id} className="min-w-0">
                      {field.type === "select" ? (
                        <WebDirectSelectField
                          id={fieldId}
                          label={field.label}
                          value={values[field.id] ?? ""}
                          options={field.options ?? []}
                          placeholder={field.placeholder}
                          required={field.required}
                          error={fieldErrors[field.id]}
                          onChange={(value) => updateValue(field.id, value)}
                        />
                      ) : field.type === "municipality" ? (
                        <WebDirectMunicipalityField
                          id={fieldId}
                          label={field.label}
                          value={values[field.id] ?? ""}
                          required={field.required}
                          error={fieldErrors[field.id]}
                          onSearch={onMunicipalitySearch}
                          onSelect={(item) => {
                            onValuesChange({
                              ...values,
                              [field.id]: item.municipio,
                              ...(field.departmentFieldId ? { [field.departmentFieldId]: item.departamento ?? "" } : {}),
                            });
                            setFieldErrors((current) => ({ ...current, [field.id]: "" }));
                          }}
                        />
                      ) : (
                        <>
                          <Label htmlFor={fieldId} className="font-bold">
                            {field.label}{field.required ? <span className="ml-1 text-primary" aria-hidden="true">*</span> : null}
                          </Label>
                          <Input
                            id={fieldId}
                            type={field.type}
                            value={values[field.id] ?? ""}
                            readOnly={field.readOnly}
                            onChange={(event) => updateValue(field.id, event.target.value)}
                            placeholder={field.placeholder}
                            autoComplete={field.autoComplete}
                            min={field.min}
                            max={field.max}
                            required={field.required}
                            aria-invalid={Boolean(fieldErrors[field.id])}
                            aria-describedby={fieldErrors[field.id] ? errorId : undefined}
                            className={cn("mt-2", field.readOnly && "bg-muted/60 text-muted-foreground")}
                          />
                          {fieldErrors[field.id] ? <FieldError id={errorId}>{fieldErrors[field.id]}</FieldError> : null}
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          ))}

          <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-between">
            <Button type="button" variant="outline" onClick={onBack}><ArrowLeft aria-hidden="true" /> Anterior</Button>
            <Button type="submit" size="lg" disabled={loading}>{loading ? "Validando información…" : "Continuar al resumen"}<ArrowRight aria-hidden="true" /></Button>
          </div>
        </form>
      )}
    </WebDirectContentFrame>
  );
}
