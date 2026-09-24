import { useMemo, useState } from "react";
import { Check, Copy, Link2, Loader2, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  configureWebDirectAccess,
  type WebDirectParticipantConfiguration,
} from "@/features/psicosocial/api/psicoAccessService";
import type { AplicacionDetalleEmpleado } from "@/features/psicosocial/api/psicoAdminService";

type ParticipantDraft = {
  selected: boolean;
  birthDate: string;
  form: "" | "A" | "B";
};

type WebDirectSetupCardProps = {
  applicationId: number;
  employees: AplicacionDetalleEmpleado[];
  disabled?: boolean;
};

function initialDraft(employee: AplicacionDetalleEmpleado): ParticipantDraft {
  const instruments = new Set(employee.instrumentos_registrados ?? []);
  return {
    selected: false,
    birthDate: "",
    form: instruments.has("PSICO_INTRA_B") ? "B" : instruments.has("PSICO_INTRA_A") ? "A" : "",
  };
}

export function WebDirectSetupCard({ applicationId, employees, disabled = false }: WebDirectSetupCardProps) {
  const eligible = useMemo(() => employees.filter((employee) => !employee.completo), [employees]);
  const [drafts, setDrafts] = useState<Record<number, ParticipantDraft>>(() => Object.fromEntries(
    eligible.map((employee) => [employee.id, initialDraft(employee)]),
  ));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [publicUrl, setPublicUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const selected = eligible.filter((employee) => drafts[employee.id]?.selected);
  const canSubmit = selected.length > 0 && selected.every((employee) => {
    const draft = drafts[employee.id];
    return Boolean(draft?.birthDate && draft.form);
  });

  const update = (employeeId: number, patch: Partial<ParticipantDraft>) => {
    setDrafts((current) => ({
      ...current,
      [employeeId]: { ...(current[employeeId] ?? { selected: false, birthDate: "", form: "" }), ...patch },
    }));
    setError(null);
    setPublicUrl(null);
    setCopied(false);
  };

  const configure = async () => {
    if (!canSubmit) {
      setError("Selecciona al menos un colaborador y completa su fecha de nacimiento y Forma A/B.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const participants: WebDirectParticipantConfiguration[] = selected.map((employee) => ({
        empleado_id: employee.id,
        fecha_nacimiento: drafts[employee.id].birthDate,
        forma_asignada: drafts[employee.id].form as "A" | "B",
      }));
      const result = await configureWebDirectAccess(applicationId, participants);
      setPublicUrl(result.public_url);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "No fue posible generar el enlace.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="rounded-3xl border-border bg-surface p-5 shadow-card sm:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-accent text-primary">
            <Link2 className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <p className="text-xs font-black uppercase tracking-[0.14em] text-primary">Piloto habilitado</p>
            <h2 className="mt-1 font-heading text-xl font-black text-foreground">Presentación web directa</h2>
            <p className="mt-1 max-w-3xl text-sm leading-6 text-muted-foreground">
              Define la Forma A/B y la fecha que cada colaborador usará para identificarse. Generar un enlace nuevo reemplaza el anterior para esta aplicación.
            </p>
          </div>
        </div>
        <Button type="button" disabled={disabled || submitting || !canSubmit} onClick={() => void configure()}>
          {submitting ? <Loader2 className="animate-spin" aria-hidden="true" /> : <ShieldCheck aria-hidden="true" />}
          {submitting ? "Generando…" : "Generar enlace"}
        </Button>
      </div>

      {eligible.length === 0 ? (
        <p className="mt-5 rounded-2xl border border-border bg-surface-subtle p-4 text-sm text-muted-foreground">
          No hay participantes pendientes disponibles para este canal.
        </p>
      ) : (
        <div className="mt-5 max-h-[30rem] space-y-3 overflow-y-auto pr-1" aria-label="Participantes para presentación web">
          {eligible.map((employee) => {
            const draft = drafts[employee.id] ?? initialDraft(employee);
            const rowDisabled = disabled || submitting;
            return (
              <section key={employee.id} className="grid gap-4 rounded-2xl border border-border bg-surface-subtle p-4 md:grid-cols-[minmax(14rem,1fr)_minmax(11rem,0.55fr)_minmax(9rem,0.4fr)] md:items-end">
                <label className="flex cursor-pointer items-start gap-3">
                  <input
                    type="checkbox"
                    checked={draft.selected}
                    disabled={rowDisabled}
                    onChange={(event) => update(employee.id, { selected: event.target.checked })}
                    className="mt-1 h-5 w-5 rounded border-border accent-[hsl(var(--primary))]"
                  />
                  <span className="min-w-0">
                    <strong className="block break-words text-sm text-foreground">{employee.nombre}</strong>
                    <span className="mt-1 block text-xs text-muted-foreground">CC {employee.cedula} · {employee.area || "Sin área"} · {employee.cargo || "Sin cargo"}</span>
                  </span>
                </label>
                <label className="text-sm font-bold text-foreground">
                  Fecha de nacimiento
                  <input
                    type="date"
                    value={draft.birthDate}
                    max={new Date().toISOString().slice(0, 10)}
                    disabled={rowDisabled || !draft.selected}
                    onChange={(event) => update(employee.id, { birthDate: event.target.value })}
                    className="mt-2 h-11 w-full rounded-xl border border-border bg-surface px-3 font-normal disabled:cursor-not-allowed disabled:bg-muted"
                  />
                </label>
                <label className="text-sm font-bold text-foreground">
                  Forma asignada
                  <select
                    value={draft.form}
                    disabled={rowDisabled || !draft.selected}
                    onChange={(event) => update(employee.id, { form: event.target.value as ParticipantDraft["form"] })}
                    className="mt-2 h-11 w-full rounded-xl border border-border bg-surface px-3 font-normal disabled:cursor-not-allowed disabled:bg-muted"
                  >
                    <option value="">Selecciona</option>
                    <option value="A">Forma A</option>
                    <option value="B">Forma B</option>
                  </select>
                </label>
              </section>
            );
          })}
        </div>
      )}

      {error ? <p role="alert" className="mt-4 rounded-2xl border border-destructive/25 bg-destructive/5 p-4 text-sm font-semibold text-destructive">{error}</p> : null}
      {publicUrl ? (
        <div role="status" className="mt-5 rounded-2xl border border-success/25 bg-success/5 p-4">
          <p className="font-heading text-base font-black text-foreground">Enlace listo para compartir</p>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">Habilitado para {selected.length} colaborador(es). Cada persona debe identificarse con su documento y fecha de nacimiento.</p>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <input readOnly value={publicUrl} aria-label="Enlace público generado" className="h-11 min-w-0 flex-1 rounded-xl border border-border bg-surface px-3 text-sm" />
            <Button
              type="button"
              variant="outline"
              onClick={async () => {
                await navigator.clipboard.writeText(publicUrl);
                setCopied(true);
              }}
            >
              {copied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}{copied ? "Copiado" : "Copiar enlace"}
            </Button>
          </div>
        </div>
      ) : null}
    </Card>
  );
}
