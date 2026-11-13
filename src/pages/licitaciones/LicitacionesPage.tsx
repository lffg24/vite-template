import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { BriefcaseBusiness, RefreshCw, Search, ShieldCheck } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import {
  closeDecision,
  createReview,
  getOpportunity,
  getSummary,
  listOpportunities,
  type Opportunity,
  type OpportunityDetail,
  type Summary,
} from "@/features/licitaciones/service";

const VIEW_REPORTS = "licitaciones.reports.view";
const MANAGE_REVIEWS = "licitaciones.reviews.manage";
const CLOSE_DECISION = "licitaciones.decision.close";
const ADMIN = "licitaciones.admin";
const REQUIRED_GO_REVIEWS = [
  { field_key: "apertura", label: "Apertura oficial", data_type: "boolean" },
  { field_key: "admision_empresarial", label: "Admisión empresarial", data_type: "boolean" },
] as const;

function errorMessage(cause: unknown) {
  const candidate = cause as { response?: { data?: { detail?: string } }; message?: string };
  return candidate?.response?.data?.detail || candidate?.message || "No pudimos completar la operación.";
}

function money(value: Opportunity["budget_amount"], currency?: string | null) {
  if (value == null) return "Sin presupuesto confirmado";
  const amount = Number(value);
  if (!Number.isFinite(amount)) return String(value);
  return new Intl.NumberFormat("es-CO", { style: "currency", currency: currency || "COP", maximumFractionDigits: 0 }).format(amount);
}

function date(value: string | null) {
  if (!value) return "Sin fecha confirmada";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : new Intl.DateTimeFormat("es-CO", { dateStyle: "medium" }).format(parsed);
}

function statusVariant(value: string | null) {
  if (["GO", "GO_CON_ALIADO", "CERRADA", "VERIFICADO", "CORREGIDO"].includes(value || "")) return "relSuccess" as const;
  if (["NO_GO", "DESCARTADA", "CONFLICTO"].includes(value || "")) return "relDanger" as const;
  if (value === "NO_APLICA") return "relNeutral" as const;
  return "relWarning" as const;
}

function parseReviewValue(
  raw: string,
  field: OpportunityDetail["fields"][number] | undefined,
  control: boolean,
  status: string,
) {
  if (control) return ["VERIFICADO", "CORREGIDO"].includes(status) ? true : null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  if (typeof field?.value_json === "boolean") {
    if (!/^(true|false)$/i.test(trimmed)) throw new Error("El valor debe ser true o false.");
    return trimmed.toLowerCase() === "true";
  }
  if (typeof field?.value_json === "number") {
    const parsed = Number(trimmed);
    if (!Number.isFinite(parsed)) throw new Error("El valor debe ser numérico.");
    return parsed;
  }
  if (field?.value_json && typeof field.value_json === "object") {
    try { return JSON.parse(trimmed); }
    catch { throw new Error("El valor debe ser JSON válido para conservar su estructura."); }
  }
  return raw;
}

export default function LicitacionesPage() {
  const { permissions } = useAuth();
  const admin = permissions.includes(ADMIN);
  const canReports = admin || permissions.includes(VIEW_REPORTS);
  const canReview = admin || permissions.includes(MANAGE_REVIEWS);
  const canDecide = admin || permissions.includes(CLOSE_DECISION);
  const [items, setItems] = useState<Opportunity[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [selected, setSelected] = useState<OpportunityDetail | null>(null);
  const [query, setQuery] = useState("");
  const [state, setState] = useState("");
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [formNotice, setFormNotice] = useState<string | null>(null);
  const [reviewField, setReviewField] = useState("");
  const [reviewStatus, setReviewStatus] = useState("PENDIENTE");
  const [reviewValue, setReviewValue] = useState("");
  const [reviewRationale, setReviewRationale] = useState("");
  const [decision, setDecision] = useState("NO_GO");
  const [reasonCode, setReasonCode] = useState("");
  const [decisionRationale, setDecisionRationale] = useState("");
  const [decisionKey, setDecisionKey] = useState(() => crypto.randomUUID());

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [list, report] = await Promise.all([
        listOpportunities(state || undefined),
        canReports ? getSummary() : Promise.resolve(null),
      ]);
      setItems(list.items);
      setSummary(report);
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setLoading(false);
    }
  }, [canReports, state]);

  useEffect(() => { void load(); }, [load]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase("es");
    if (!needle) return items;
    return items.filter((item) => [item.external_process_id, item.buyer_name, item.object_original, item.service_category]
      .some((value) => String(value || "").toLocaleLowerCase("es").includes(needle)));
  }, [items, query]);

  async function open(item: Opportunity) {
    setDetailLoading(true);
    setFormError(null);
    setFormNotice(null);
    try {
      const detail = await getOpportunity(item.id);
      setSelected(detail);
      setReviewField("apertura");
      setReviewValue("");
      setDecisionKey(crypto.randomUUID());
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setDetailLoading(false);
    }
  }

  async function refreshSelected() {
    if (!selected) return;
    setSelected(await getOpportunity(selected.opportunity.id));
  }

  async function submitReview(event: FormEvent) {
    event.preventDefault();
    if (!selected || !reviewField) return;
    setSaving(true); setFormError(null); setFormNotice(null);
    try {
      const extractedField = selected.fields.find((field) => field.field_key === reviewField);
      const requiredControl = REQUIRED_GO_REVIEWS.some((field) => field.field_key === reviewField);
      await createReview(selected.opportunity.id, {
        revision: selected.opportunity.current_revision,
        field_key: reviewField,
        status: reviewStatus,
        value: parseReviewValue(reviewValue, extractedField, requiredControl, reviewStatus),
        rationale: reviewRationale || null,
      });
      await refreshSelected();
      setReviewRationale("");
      setReviewValue("");
      setFormNotice("Revisión registrada correctamente.");
    } catch (cause) { setFormError(errorMessage(cause)); }
    finally { setSaving(false); }
  }

  async function submitDecision(event: FormEvent) {
    event.preventDefault();
    if (!selected) return;
    setSaving(true); setFormError(null); setFormNotice(null);
    try {
      await closeDecision(selected.opportunity.id, {
        revision: selected.opportunity.current_revision,
        decision,
        reason_code: reasonCode.trim().toUpperCase(),
        rationale: decisionRationale,
        row_version: selected.opportunity.row_version,
      }, decisionKey);
      await Promise.all([refreshSelected(), load()]);
      setReasonCode(""); setDecisionRationale(""); setDecisionKey(crypto.randomUUID());
      setFormNotice("Decisión comercial registrada correctamente.");
    } catch (cause) { setFormError(errorMessage(cause)); }
    finally { setSaving(false); }
  }

  const totals = summary?.totals;
  const reviewControl = REQUIRED_GO_REVIEWS.find((field) => field.field_key === reviewField);
  const reviewExtractedField = selected?.fields.find((field) => field.field_key === reviewField);
  return (
    <div className="mx-auto max-w-[1600px] space-y-5">
      <header className="rounded-2xl border border-rel-border bg-rel-surface p-5 shadow-sm sm:p-7">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div className="flex items-start gap-4">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-rel-info-subtle text-rel-info"><BriefcaseBusiness aria-hidden="true" /></span>
            <div><p className="text-xs font-bold uppercase tracking-[0.18em] text-rel-info">Inteligencia comercial</p>
              <h1 className="mt-1 text-2xl font-black text-rel-dark sm:text-3xl">Oportunidades de licitación</h1>
              <p className="mt-2 max-w-3xl text-sm text-rel-muted">Consulta evidencia extraída, valida campos y registra la decisión comercial. Los datos permanecen en el servicio aislado de licitaciones.</p></div>
          </div>
          <div className="flex items-center gap-2 rounded-xl bg-rel-success-subtle px-4 py-3 text-sm font-semibold text-rel-success"><ShieldCheck className="h-5 w-5" aria-hidden="true" /> Tenant y actor verificados por Abril360</div>
        </div>
      </header>

      {totals && <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Resumen de licitaciones">
        <Metric label="Oportunidades" value={totals.total} />
        <Metric label="Decisiones cerradas" value={totals.closed} />
        <Metric label="GO / con aliado" value={totals.go_count} />
        <Metric label="Completitud promedio" value={`${Math.round(Number(totals.average_completeness || 0) * 100)} %`} />
      </section>}

      <section className="rounded-2xl border border-rel-border bg-rel-surface p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
          <div className="relative flex-1"><Label htmlFor="lic-query">Buscar</Label><Search className="absolute bottom-3 left-3 h-4 w-4 text-rel-muted" aria-hidden="true" />
            <Input id="lic-query" className="mt-1 pl-9" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Entidad, proceso, categoría u objeto" /></div>
          <div className="lg:w-56"><Label htmlFor="lic-state">Estado del flujo</Label><select id="lic-state" value={state} onChange={(event) => setState(event.target.value)} className="mt-1 h-10 w-full rounded-md border border-rel-border bg-rel-surface px-3 text-sm text-rel-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rel-primary">
            <option value="">Todos</option><option value="NUEVA">Nueva</option><option value="EN_REVISION">En revisión</option><option value="CERRADA">Cerrada</option>
          </select></div>
          <Button type="button" variant="relOutline" onClick={() => void load()} disabled={loading}><RefreshCw className={loading ? "animate-spin" : ""} aria-hidden="true" /> Actualizar</Button>
        </div>
      </section>

      {error && <div role="alert" className="rounded-xl border border-rel-danger bg-rel-danger-subtle p-4 text-sm text-rel-danger">{error}</div>}
      {loading ? <div role="status" className="rounded-2xl border border-rel-border bg-rel-surface p-10 text-center text-rel-muted">Cargando oportunidades…</div>
        : filtered.length === 0 ? <div className="rounded-2xl border border-dashed border-rel-border bg-rel-surface p-10 text-center"><BriefcaseBusiness className="mx-auto mb-3 text-rel-muted" aria-hidden="true" /><h2 className="font-bold text-rel-dark">No hay oportunidades para este filtro</h2><p className="mt-1 text-sm text-rel-muted">Cambia el estado o limpia la búsqueda.</p></div>
        : <><div className="grid gap-3 md:hidden">{filtered.map((item) => <OpportunityCard key={item.id} item={item} onOpen={() => void open(item)} />)}</div>
          <div className="hidden overflow-hidden rounded-2xl border border-rel-border bg-rel-surface shadow-sm md:block"><div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-rel-surface-subtle text-xs uppercase tracking-wide text-rel-muted"><tr><th className="px-4 py-3">Proceso</th><th className="px-4 py-3">Entidad y objeto</th><th className="px-4 py-3">Presupuesto</th><th className="px-4 py-3">Cierre</th><th className="px-4 py-3">Estado</th><th className="px-4 py-3"><span className="sr-only">Acciones</span></th></tr></thead><tbody>{filtered.map((item) => <tr key={item.id} className="border-t border-rel-border hover:bg-rel-canvas"><td className="px-4 py-4 font-semibold text-rel-info">{item.external_process_id}</td><td className="max-w-xl px-4 py-4"><div className="font-bold text-rel-dark">{item.buyer_name}</div><div className="mt-1 line-clamp-2 text-rel-muted">{item.object_original}</div></td><td className="whitespace-nowrap px-4 py-4 text-rel-dark">{money(item.budget_amount, item.budget_currency)}</td><td className="whitespace-nowrap px-4 py-4 text-rel-muted">{date(item.next_deadline)}</td><td className="px-4 py-4"><Badge variant={statusVariant(item.decision || item.workflow_state)}>{item.decision || item.workflow_state}</Badge></td><td className="px-4 py-4 text-right"><Button type="button" variant="relOutline" size="sm" onClick={() => void open(item)}>Ver evidencia</Button></td></tr>)}</tbody></table></div></div></>}

      <Sheet open={Boolean(selected) || detailLoading} onOpenChange={(openState) => { if (!openState) setSelected(null); }}>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-3xl"><SheetHeader><SheetTitle>{selected?.opportunity.buyer_name || "Cargando expediente…"}</SheetTitle></SheetHeader>
          {selected && <div className="mt-5 space-y-5 text-sm text-rel-dark"><div><p className="font-semibold text-rel-info">{selected.opportunity.external_process_id}</p><p className="mt-2 text-rel-muted">{selected.opportunity.object_original}</p></div>
            <div className="grid gap-2 sm:grid-cols-2"><Fact label="Presupuesto" value={money(selected.opportunity.budget_amount, selected.opportunity.budget_currency)} /><Fact label="Próximo cierre" value={date(selected.opportunity.next_deadline)} /><Fact label="Categoría" value={selected.opportunity.service_category || "Sin clasificar"} /><Fact label="Completitud" value={`${Math.round(Number(selected.opportunity.completeness || 0) * 100)} %`} /></div>
            <section><h2 className="mb-2 font-bold">Campos y evidencia</h2><div className="space-y-2">{selected.fields.map((field) => <details key={field.field_key} className="rounded-xl border border-rel-border bg-rel-surface"><summary className="flex cursor-pointer items-center justify-between gap-3 p-3 font-semibold"><span>{field.field_key}</span><Badge variant={statusVariant(field.evidence_status)}>{field.evidence_status}</Badge></summary><div className="border-t border-rel-border p-3"><pre className="whitespace-pre-wrap break-words rounded-lg bg-rel-canvas p-3 text-xs">{JSON.stringify(field.value_json, null, 2)}</pre>{(field.evidence_json || []).map((evidence, index) => <blockquote key={`${evidence.document_id}-${index}`} className="mt-2 border-l-2 border-rel-info bg-rel-info-subtle p-3 text-xs"><p>“{evidence.quote || "Sin cita literal"}”</p><footer className="mt-1 text-rel-muted">{evidence.document_id || "Documento"}{evidence.page ? ` · página ${evidence.page}` : ""}</footer></blockquote>)}</div></details>)}</div></section>
            {canReview && <form onSubmit={submitReview} className="space-y-3 rounded-xl border border-rel-border bg-rel-surface-subtle p-4"><div><h2 className="font-bold">Revisión humana</h2><p className="mt-1 text-xs text-rel-muted">Apertura y admisión empresarial deben quedar verificadas antes de cerrar una decisión GO.</p></div><Label htmlFor="review-field">Control o campo</Label><select id="review-field" value={reviewField} onChange={(event) => { setReviewField(event.target.value); setReviewValue(""); }} className="h-10 w-full rounded-md border border-rel-border bg-rel-surface px-3 focus-visible:ring-2 focus-visible:ring-rel-primary"><optgroup label="Controles para decisión GO">{REQUIRED_GO_REVIEWS.map((field) => <option key={field.field_key} value={field.field_key}>{field.label}</option>)}</optgroup>{selected.fields.length > 0 && <optgroup label="Campos extraídos">{selected.fields.map((field) => <option key={field.field_key} value={field.field_key}>{field.field_key}</option>)}</optgroup>}</select><Label htmlFor="review-status">Resultado</Label><select id="review-status" value={reviewStatus} onChange={(event) => setReviewStatus(event.target.value)} className="h-10 w-full rounded-md border border-rel-border bg-rel-surface px-3 focus-visible:ring-2 focus-visible:ring-rel-primary"><option>PENDIENTE</option><option>VERIFICADO</option><option>CORREGIDO</option><option>NO_APLICA</option></select>{!reviewControl && <><Label htmlFor="review-value">Valor revisado</Label><Input id="review-value" value={reviewValue} onChange={(event) => setReviewValue(event.target.value)} placeholder={reviewExtractedField?.value_json && typeof reviewExtractedField.value_json === "object" ? "JSON válido" : "Valor confirmado"} /></>}<Label htmlFor="review-rationale">Fundamento</Label><Textarea id="review-rationale" value={reviewRationale} onChange={(event) => setReviewRationale(event.target.value)} maxLength={2000} /><Button variant="rel" disabled={saving || !reviewField}>Guardar revisión</Button></form>}
            {canDecide && <form onSubmit={submitDecision} className="space-y-3 rounded-xl border border-rel-border bg-rel-surface-subtle p-4"><h2 className="font-bold">Decisión comercial</h2><Label htmlFor="decision">Decisión</Label><select id="decision" value={decision} onChange={(event) => setDecision(event.target.value)} className="h-10 w-full rounded-md border border-rel-border bg-rel-surface px-3 focus-visible:ring-2 focus-visible:ring-rel-primary"><option>GO</option><option>GO_CON_ALIADO</option><option>NO_GO</option><option>DESCARTADA</option></select><Label htmlFor="reason-code">Código de motivo</Label><Input id="reason-code" value={reasonCode} onChange={(event) => setReasonCode(event.target.value)} placeholder="CAPACIDAD_TECNICA" pattern="[A-Za-z0-9_]{3,80}" required /><Label htmlFor="decision-rationale">Justificación</Label><Textarea id="decision-rationale" value={decisionRationale} onChange={(event) => setDecisionRationale(event.target.value)} minLength={5} maxLength={3000} required /><Button variant="rel" disabled={saving}>Cerrar decisión</Button></form>}
            {formNotice && <p role="status" className="rounded-lg bg-rel-success-subtle p-3 text-rel-success">{formNotice}</p>}
            {formError && <p role="alert" className="rounded-lg bg-rel-danger-subtle p-3 text-rel-danger">{formError}</p>}
          </div>}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) { return <div className="rounded-2xl border border-rel-border bg-rel-surface p-4 shadow-sm"><div className="text-2xl font-black text-rel-dark">{value}</div><div className="mt-1 text-xs font-semibold uppercase tracking-wide text-rel-muted">{label}</div></div>; }
function Fact({ label, value }: { label: string; value: string }) { return <div className="rounded-xl border border-rel-border bg-rel-surface p-3"><div className="text-xs text-rel-muted">{label}</div><div className="mt-1 font-semibold">{value}</div></div>; }
function OpportunityCard({ item, onOpen }: { item: Opportunity; onOpen: () => void }) { return <article className="rounded-2xl border border-rel-border bg-rel-surface p-4 shadow-sm"><div className="flex items-start justify-between gap-2"><span className="text-xs font-bold text-rel-info">{item.external_process_id}</span><Badge variant={statusVariant(item.decision || item.workflow_state)}>{item.decision || item.workflow_state}</Badge></div><h2 className="mt-3 font-bold text-rel-dark">{item.buyer_name}</h2><p className="mt-2 line-clamp-3 text-sm text-rel-muted">{item.object_original}</p><dl className="mt-4 grid grid-cols-2 gap-3 text-xs"><div><dt className="text-rel-muted">Presupuesto</dt><dd className="mt-1 font-semibold text-rel-dark">{money(item.budget_amount, item.budget_currency)}</dd></div><div><dt className="text-rel-muted">Cierre</dt><dd className="mt-1 font-semibold text-rel-dark">{date(item.next_deadline)}</dd></div></dl><Button type="button" variant="rel" className="mt-4 w-full" onClick={onOpen}>Ver evidencia</Button></article>; }
