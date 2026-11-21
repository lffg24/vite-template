import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { BriefcaseBusiness, RefreshCw } from "lucide-react";
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
import { parseReviewValue } from "@/features/licitaciones/reviewValue";
import {
  COLUMNAS_LICITACION,
  aTarea,
  reglaDeMovimiento,
} from "@/features/licitaciones/adaptador";
import { toast } from "@/hooks/use-toast";
import { Aviso } from "@/shared/ui/Aviso";
import { Caja } from "@/shared/ui/Caja";
import { Campo } from "@/shared/ui/Campo";
import { Desplegable } from "@/shared/ui/Desplegable";
import { IndicadorKpi } from "@/shared/ui/IndicadorKpi";
import { PageHeader } from "@/shared/ui/PageHeader";
import {
  DialogoTransicion,
  VistaTareas,
  type ColumnaTablero,
  type TareaVista,
} from "@/shared/ui/tablero";

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

export default function LicitacionesPage() {
  const { permissions } = useAuth();
  const admin = permissions.includes(ADMIN);
  const canReports = admin || permissions.includes(VIEW_REPORTS);
  const canReview = admin || permissions.includes(MANAGE_REVIEWS);
  const canDecide = admin || permissions.includes(CLOSE_DECISION);
  const [items, setItems] = useState<Opportunity[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [selected, setSelected] = useState<OpportunityDetail | null>(null);
  // Movimiento pedido arrastrando una tarjeta a una columna de decisión.
  const [pendiente, setPendiente] = useState<{ tarea: TareaVista<Opportunity>; destino: ColumnaTablero } | null>(null);
  const [movCodigo, setMovCodigo] = useState("");
  const [movJustificacion, setMovJustificacion] = useState("");
  const [movClave, setMovClave] = useState(() => crypto.randomUUID());
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
        listOpportunities(),
        canReports ? getSummary() : Promise.resolve(null),
      ]);
      setItems(list.items);
      setSummary(report);
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setLoading(false);
    }
  }, [canReports]);

  useEffect(() => { void load(); }, [load]);

  const tareas = useMemo(() => items.map(aTarea), [items]);

  function solicitarMovimiento(tarea: TareaVista<Opportunity>, destino: ColumnaTablero) {
    const regla = reglaDeMovimiento(tarea, destino.id, canDecide);
    if (regla.tipo === "rechazo") {
      toast({ variant: "warning", title: "No se puede mover así", description: regla.motivo });
      return;
    }
    setMovCodigo("");
    setMovJustificacion("");
    setMovClave(crypto.randomUUID());
    setPendiente({ tarea, destino });
  }

  async function confirmarMovimiento() {
    if (!pendiente?.tarea.origen) return;
    const o = pendiente.tarea.origen;
    try {
      await closeDecision(
        o.id,
        {
          revision: o.current_revision,
          decision: pendiente.destino.id,
          reason_code: movCodigo.trim().toUpperCase(),
          rationale: movJustificacion,
          row_version: o.row_version,
        },
        movClave
      );
    } catch (cause) {
      // DialogoTransicion muestra el mensaje y conserva lo escrito.
      throw new Error(errorMessage(cause));
    }
    setPendiente(null);
    toast({ variant: "success", title: "Decisión registrada", description: `${o.external_process_id} pasó a ${pendiente.destino.titulo}.` });
    await load();
  }

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
  const reviewUsesJson = ["document_finding", "quantity", "json", "object", "array"].includes(
    reviewExtractedField?.data_type?.toLowerCase() || "",
  ) || Boolean(reviewExtractedField?.value_json && typeof reviewExtractedField.value_json === "object");
  return (
    <div className="mx-auto max-w-[1600px] space-y-5">
      <PageHeader
        antetitulo="Inteligencia comercial"
        titulo="Oportunidades de licitación"
        descripcion="Consulta evidencia extraída, valida campos y registra la decisión comercial. Los datos permanecen en el servicio aislado de licitaciones; Abril360 verifica tenant y actor."
        icono={BriefcaseBusiness}
      />

      {totals ? (
        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Resumen de licitaciones">
          <IndicadorKpi etiqueta="Oportunidades" valor={totals.total} />
          <IndicadorKpi etiqueta="Decisiones cerradas" valor={totals.closed} />
          <IndicadorKpi etiqueta="GO / con aliado" valor={totals.go_count} tono="exito" />
          <IndicadorKpi etiqueta="Completitud promedio" valor={`${Math.round(Number(totals.average_completeness || 0) * 100)} %`} />
        </section>
      ) : null}

      {error ? <Aviso tono="peligro" titulo="No pudimos cargar las oportunidades">{error}</Aviso> : null}

      <VistaTareas
        columnas={COLUMNAS_LICITACION}
        tareas={tareas}
        cargando={loading}
        alSolicitarMovimiento={solicitarMovimiento}
        alAbrirTarea={(t) => t.origen && void open(t.origen)}
        claveMemoria="licitaciones-vista"
        nombreElemento="oportunidades"
        acciones={
          <Button type="button" variant="relOutline" onClick={() => void load()} disabled={loading}>
            <RefreshCw className={loading ? "animate-spin" : ""} aria-hidden="true" /> Actualizar
          </Button>
        }
      />

      <DialogoTransicion
        abierto={pendiente !== null}
        alCerrar={() => setPendiente(null)}
        titulo={pendiente ? `Mover a «${pendiente.destino.titulo}»` : "Cerrar decisión"}
        descripcion="Cerrar una decisión exige un motivo y una justificación. Queda en el historial y no se reabre."
        textoConfirmar="Cerrar decisión"
        valido={/^[A-Za-z0-9_]{3,80}$/.test(movCodigo.trim()) && movJustificacion.trim().length >= 5}
        alConfirmar={confirmarMovimiento}
      >
        <Campo id="mov-codigo" etiqueta="Código de motivo" obligatorio ayuda="Letras, números y guion bajo. Ej.: CAPACIDAD_TECNICA">
          <Input value={movCodigo} onChange={(e) => setMovCodigo(e.target.value)} />
        </Campo>
        <Campo id="mov-justificacion" etiqueta="Justificación" obligatorio ayuda="Mínimo 5 caracteres.">
          <Textarea rows={4} value={movJustificacion} onChange={(e) => setMovJustificacion(e.target.value)} maxLength={3000} />
        </Campo>
      </DialogoTransicion>

      <Sheet open={Boolean(selected) || detailLoading} onOpenChange={(openState) => { if (!openState) setSelected(null); }}>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-3xl"><SheetHeader><SheetTitle>{selected?.opportunity.buyer_name || "Cargando expediente…"}</SheetTitle></SheetHeader>
          {selected && <div className="mt-5 space-y-5 text-sm text-rel-dark"><div><p className="font-semibold text-rel-info">{selected.opportunity.external_process_id}</p><p className="mt-2 text-rel-muted">{selected.opportunity.object_original}</p></div>
            <div className="grid gap-2 sm:grid-cols-2"><Fact label="Presupuesto" value={money(selected.opportunity.budget_amount, selected.opportunity.budget_currency)} /><Fact label="Próximo cierre" value={date(selected.opportunity.next_deadline)} /><Fact label="Categoría" value={selected.opportunity.service_category || "Sin clasificar"} /><Fact label="Completitud" value={`${Math.round(Number(selected.opportunity.completeness || 0) * 100)} %`} /></div>
            <section><h2 className="mb-2 font-bold">Campos y evidencia</h2><div className="space-y-2">{selected.fields.map((field) => <Caja como="details" key={field.field_key} aire="ninguno"><summary className="flex cursor-pointer items-center justify-between gap-3 p-3 font-semibold"><span>{field.field_key}</span><Badge variant={statusVariant(field.evidence_status)}>{field.evidence_status}</Badge></summary><div className="border-t border-rel-border p-3"><pre className="whitespace-pre-wrap break-words rounded-rel-control bg-rel-canvas p-3 text-xs">{JSON.stringify(field.value_json, null, 2)}</pre>{(field.evidence_json || []).map((evidence, index) => <blockquote key={`${evidence.document_id}-${index}`} className="mt-2 border-l-2 border-rel-info bg-rel-info-subtle p-3 text-xs"><p>“{evidence.quote || "Sin cita literal"}”</p><footer className="mt-1 text-rel-muted">{evidence.document_id || "Documento"}{evidence.page ? ` · página ${evidence.page}` : ""}</footer></blockquote>)}</div></Caja>)}</div></section>
            {canReview && <Caja como="form" onSubmit={submitReview} tono="hundida" aire="ajustado" className="space-y-3"><div><h2 className="font-bold">Revisión humana</h2><p className="mt-1 text-xs text-rel-muted">Apertura y admisión empresarial deben quedar verificadas antes de cerrar una decisión GO.</p></div><Label htmlFor="review-field">Control o campo</Label><Desplegable id="review-field" value={reviewField} onChange={(event) => { setReviewField(event.target.value); setReviewValue(""); }}><optgroup label="Controles para decisión GO">{REQUIRED_GO_REVIEWS.map((field) => <option key={field.field_key} value={field.field_key}>{field.label}</option>)}</optgroup>{selected.fields.length > 0 && <optgroup label="Campos extraídos">{selected.fields.map((field) => <option key={field.field_key} value={field.field_key}>{field.field_key}</option>)}</optgroup>}</Desplegable><Label htmlFor="review-status">Resultado</Label><Desplegable id="review-status" value={reviewStatus} onChange={(event) => setReviewStatus(event.target.value)}><option>PENDIENTE</option><option>VERIFICADO</option><option>CORREGIDO</option><option>NO_APLICA</option></Desplegable>{!reviewControl && <><Label htmlFor="review-value">Valor revisado</Label><Input id="review-value" value={reviewValue} onChange={(event) => setReviewValue(event.target.value)} placeholder={reviewUsesJson ? "JSON válido" : "Valor confirmado"} /></>}<Label htmlFor="review-rationale">Fundamento</Label><Textarea id="review-rationale" value={reviewRationale} onChange={(event) => setReviewRationale(event.target.value)} maxLength={2000} /><Button variant="rel" disabled={saving || !reviewField}>Guardar revisión</Button></Caja>}
            {canDecide && <Caja como="form" onSubmit={submitDecision} tono="hundida" aire="ajustado" className="space-y-3"><h2 className="font-bold">Decisión comercial</h2><Label htmlFor="decision">Decisión</Label><Desplegable id="decision" value={decision} onChange={(event) => setDecision(event.target.value)}><option>GO</option><option>GO_CON_ALIADO</option><option>NO_GO</option><option>DESCARTADA</option></Desplegable><Label htmlFor="reason-code">Código de motivo</Label><Input id="reason-code" value={reasonCode} onChange={(event) => setReasonCode(event.target.value)} placeholder="CAPACIDAD_TECNICA" pattern="[A-Za-z0-9_]{3,80}" required /><Label htmlFor="decision-rationale">Justificación</Label><Textarea id="decision-rationale" value={decisionRationale} onChange={(event) => setDecisionRationale(event.target.value)} minLength={5} maxLength={3000} required /><Button variant="rel" disabled={saving}>Cerrar decisión</Button></Caja>}
            {formNotice && <p role="status" className="rounded-rel-control bg-rel-success-subtle p-3 text-rel-success">{formNotice}</p>}
            {formError && <p role="alert" className="rounded-rel-control bg-rel-danger-subtle p-3 text-rel-danger">{formError}</p>}
          </div>}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <Caja papel="caja" aire="ajustado">
      <div className="text-xs text-rel-muted">{label}</div>
      <div className="mt-1 font-semibold">{value}</div>
    </Caja>
  );
}
