import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { BriefcaseBusiness, RefreshCw } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import {
  closeDecision,
  createReview,
  getOpportunity,
  listOpportunities,
  type Opportunity,
  type OpportunityDetail,
  type EvidenceField,
} from "@/features/licitaciones/service";
import { parseReviewValue } from "@/features/licitaciones/reviewValue";
import {
  COLUMNAS_LICITACION,
  aTarea,
  etiquetaClasificacion,
  reglaDeMovimiento,
} from "@/features/licitaciones/adaptador";
import { toast } from "@/hooks/use-toast";
import { Aviso } from "@/shared/ui/Aviso";
import { Caja } from "@/shared/ui/Caja";
import { Campo } from "@/shared/ui/Campo";
import { Desplegable } from "@/shared/ui/Desplegable";
import { EstadoVacio } from "@/shared/ui/EstadoVacio";
import { FiltroChips } from "@/shared/ui/FiltroChips";
import { Pill } from "@/shared/ui/Pill";
import { SeccionPlegable } from "@/shared/ui/SeccionPlegable";
import { CARRILES, carril, categoria, cierreVisible, diaBogota, diaCierre, estaVencida, etiquetaCarril, textoHallazgo } from "@/features/licitaciones/gestion";
import { PageHeader } from "@/shared/ui/PageHeader";
import {
  DialogoTransicion,
  VistaTareas,
  type ColumnaTablero,
  type TareaVista,
} from "@/shared/ui/tablero";

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

function statusLabel(value: string) {
  if (value === "PENDIENTE") return "Por validar por el equipo";
  if (value === "INFERIDO") return "Hallazgo inferido";
  if (value === "VERIFICADO") return "Validado por una persona";
  if (value === "CORREGIDO") return "Corregido por una persona";
  if (value === "CONFLICTO") return "Fuentes en conflicto";
  if (value === "NO_APLICA") return "No aplica";
  if (value === "ABIERTA_CONFIRMADA") return "Apertura confirmada";
  return value;
}

const FIELD_LABELS: Record<string, string> = {
  admision_empresarial: "Admisión empresarial",
  apertura: "Apertura oficial",
  cantidad_volumen: "Cantidad / volumen",
  capacidad_organizacional: "Capacidad organizacional",
  causales_rechazo: "Causales de rechazo",
  cierre_ofertas: "Fecha y hora de cierre",
  desempate: "Criterios de desempate",
  documentos_oferta: "Documentos requeridos para ofertar",
  experiencia: "Experiencia requerida",
  factores_evaluacion: "Factores de evaluación",
  forma_pago: "Forma de pago",
  formulas_escalas: "Fórmulas y escalas de evaluación",
  garantias: "Garantías exigidas",
  indicadores_financieros: "Indicadores financieros",
  lugar_ejecucion: "Lugar de ejecución",
  modalidad: "Modalidad de selección",
  personal_minimo: "Personal mínimo requerido",
  plazo_ejecucion: "Plazo de ejecución",
  ponderacion_economica: "Ponderación económica",
  presupuesto_oficial: "Presupuesto oficial",
  puntaje_maximo: "Puntaje máximo",
  puntajes_ley: "Puntajes legales",
  riesgos_multas: "Riesgos y multas",
  rup: "Registro Único de Proponentes (RUP)",
  subsanabilidad: "Reglas de subsanación",
  tecnico_regulatorio: "Requisitos técnicos y regulatorios",
  tipo_proponente: "Tipo de proponente",
};

function fieldLabel(key: string) {
  return FIELD_LABELS[key] || key.replaceAll("_", " ").replace(/\b\p{L}/gu, (letter) => letter.toLocaleUpperCase("es-CO"));
}

const BLOQUES = [
  ["Tiempo y fechas", ["cierre_ofertas", "observaciones_pliego", "visita", "plazo_ejecucion"]],
  ["Habilitantes para participar", ["tipo_proponente", "rup", "experiencia", "indicadores_financieros", "capacidad_organizacional", "tecnico_regulatorio", "personal_minimo"]],
  ["Calificación y desempate", ["factores_evaluacion", "puntaje_maximo", "formulas_escalas", "ponderacion_economica", "puntajes_ley", "desempate"]],
  ["Economía, alcance y cobertura", ["modalidad", "presupuesto_oficial", "forma_pago", "cantidad_volumen", "lugar_ejecucion"]],
  ["Documentos, garantías y riesgos", ["documentos_oferta", "subsanabilidad", "garantias", "causales_rechazo", "riesgos_multas"]],
] as const;

const DECISIONES = { GO: "Ir", GO_CON_ALIADO: "Ir con aliado", NO_GO: "No ir", DESCARTADA: "Descartar" };

function campoTieneDatos(field: EvidenceField) {
  return textoHallazgo(field.value_json).length > 0 || Boolean(field.evidence_json?.length)
    || ["VERIFICADO", "CORREGIDO", "NO_APLICA", "CONFLICTO"].includes(field.evidence_status);
}

function Cobertura({ item }: { item: Opportunity }) {
  if (item.read_documents == null) return <span>Cobertura documental pendiente</span>;
  if (item.read_documents === 0 && !item.published_documents) return <span>Sin expediente disponible para lectura</span>;
  return <span>{item.read_documents} de {item.published_documents ?? "—"} documentos leídos</span>;
}

function numericQuality(quality: Record<string, unknown>, key: string) {
  const value = Number(quality[key] ?? 0);
  return Number.isFinite(value) ? value : 0;
}

export default function LicitacionesPage() {
  const { permissions } = useAuth();
  const admin = permissions.includes(ADMIN);
  const canReview = admin || permissions.includes(MANAGE_REVIEWS);
  const canDecide = admin || permissions.includes(CLOSE_DECISION);
  const [items, setItems] = useState<Opportunity[]>([]);
  const [showExpired, setShowExpired] = useState(false);
  const [vista, setVista] = useState<"bandeja" | "seguimiento">("bandeja");
  const [busqueda, setBusqueda] = useState("");
  const [filtroCarril, setFiltroCarril] = useState("");
  const [filtroServicio, setFiltroServicio] = useState("");
  const [filtroExpediente, setFiltroExpediente] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("");
  const [now, setNow] = useState(() => new Date());
  const listRequest = useRef(0);
  const detailRequest = useRef(0);
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
  const [decision, setDecision] = useState("");
  const [reasonCode, setReasonCode] = useState("");
  const [decisionRationale, setDecisionRationale] = useState("");
  const [decisionKey, setDecisionKey] = useState(() => crypto.randomUUID());

  const load = useCallback(async () => {
    const request = ++listRequest.current;
    setLoading(true);
    setError(null);
    try {
      const list = await listOpportunities();
      if (request !== listRequest.current) return;
      setItems(list.items);
    } catch (cause) {
      if (request === listRequest.current) setError(errorMessage(cause));
    } finally {
      if (request === listRequest.current) setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  const today = diaBogota(now);
  const expiredCount = items.filter((item) => estaVencida(item, now)).length;
  const servicios = [...new Set(items.map((item) => item.service_category).filter(Boolean))] as string[];
  const grupos = [...CARRILES, ["SIN_PRIORIDAD", "Sin prioridad"], ["CONTROL", "Casos de control"], ["VENCIDA", "Vencidas"]] as const;
  const grupoDe = (item: Opportunity) => {
    if (estaVencida(item, now)) return "VENCIDA";
    if (carril(item) === "CONTROL") return "CONTROL";
    return CARRILES.some(([id]) => id === carril(item)) ? carril(item) : "SIN_PRIORIDAD";
  };
  const query = busqueda.trim().toLocaleLowerCase("es-CO");
  const visibleItems = items.filter((item) => {
    if (!showExpired && estaVencida(item, now)) return false;
    if (filtroCarril && grupoDe(item) !== filtroCarril) return false;
    if (filtroServicio && (item.service_category ?? "SIN_CLASIFICAR") !== filtroServicio) return false;
    if (filtroEstado === "decididas" && !item.decision) return false;
    if (filtroEstado === "pendientes" && item.decision) return false;
    if (filtroExpediente === "sin-lectura" && item.read_documents !== 0) return false;
    if (filtroExpediente === "con-lectura" && !(Number(item.read_documents) > 0)) return false;
    return !query || [item.buyer_name, item.object_original, item.external_process_id, categoria(item.service_category)]
      .some((value) => value.toLocaleLowerCase("es-CO").includes(query));
  }).sort((a, b) => {
    const rank = (item: Opportunity) => grupos.findIndex(([id]) => id === grupoDe(item));
    return rank(a) - rank(b) || (diaCierre(a) ?? "9999").localeCompare(diaCierre(b) ?? "9999")
      || (a.next_deadline ?? "").localeCompare(b.next_deadline ?? "");
  });
  const tareas = visibleItems.map(aTarea);

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
    const request = ++detailRequest.current;
    setSelected(null);
    setDetailLoading(true);
    setError(null);
    setFormError(null);
    setFormNotice(null);
    try {
      const detail = await getOpportunity(item.id);
      if (request !== detailRequest.current) return;
      setSelected(detail);
      setDecision("");
      setReasonCode("");
      setDecisionRationale("");
      setReviewStatus("PENDIENTE");
      setReviewRationale("");
      setReviewField("apertura");
      setReviewValue("");
      setDecisionKey(crypto.randomUUID());
    } catch (cause) {
      if (request === detailRequest.current) setError(errorMessage(cause));
    } finally {
      if (request === detailRequest.current) setDetailLoading(false);
    }
  }

  async function refreshSelected() {
    if (!selected) return;
    const request = detailRequest.current;
    const detail = await getOpportunity(selected.opportunity.id);
    if (request === detailRequest.current) setSelected(detail);
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
    if (!selected || !readyToSubmit) return;
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

  const currentReviews = (selected?.reviews ?? []).filter((review) => review.revision === selected?.opportunity.current_revision);
  const verificado = (key: string) => {
    const review = currentReviews.find((field) => field.field_key === key);
    return Boolean(review && ["VERIFICADO", "CORREGIDO"].includes(review.status) && review.value_json === true);
  };
  const readyForGo = selected?.opportunity.official_status === "ABIERTA_CONFIRMADA"
    && verificado("apertura") && verificado("admision_empresarial");
  const readyToSubmit = Boolean(decision && (!["GO", "GO_CON_ALIADO"].includes(decision) || readyForGo));
  const blocks: Array<{ title: string; fields: EvidenceField[] }> = BLOQUES.map(([title, keys]) => ({
    title, fields: keys.flatMap((key) => selected?.fields.filter((field) => field.field_key === key) ?? []),
  }));
  const otherFields = selected?.fields.filter((field) => !blocks.some((block) => block.fields.includes(field))) ?? [];
  if (otherFields.length) blocks.push({ title: "Otros hallazgos", fields: otherFields });
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

      {error && <Aviso tono="peligro" titulo="No pudimos cargar los datos de licitaciones">{error}</Aviso>}

      <Caja className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <FiltroChips<"bandeja" | "seguimiento"> etiqueta="Vista comercial" valor={vista} alCambiar={setVista} opciones={[
            { valor: "bandeja", etiqueta: "Bandeja de hoy" },
            { valor: "seguimiento", etiqueta: "Tablero y lista" },
          ]} />
          <Button type="button" variant="relOutline" onClick={() => { setNow(new Date()); void load(); }} disabled={loading}>
            <RefreshCw aria-hidden="true" /> Actualizar
          </Button>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <Campo id="licitacion-busqueda" etiqueta="Buscar">
            <Input type="search" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Entidad, servicio o código" />
          </Campo>
          <Campo id="licitacion-carril" etiqueta="Prioridad">
            <Desplegable value={filtroCarril} onChange={(e) => setFiltroCarril(e.target.value)}>
              <option value="">Todas las prioridades</option>
              {grupos.filter(([id]) => id !== "VENCIDA").map(([id, label]) => <option key={id} value={id}>{label}</option>)}
            </Desplegable>
          </Campo>
          <Campo id="licitacion-servicio" etiqueta="Servicio">
            <Desplegable value={filtroServicio} onChange={(e) => setFiltroServicio(e.target.value)}>
              <option value="">Todos los servicios</option>
              {servicios.map((value) => <option key={value} value={value}>{categoria(value)}</option>)}
              <option value="SIN_CLASIFICAR">Sin clasificar</option>
            </Desplegable>
          </Campo>
          <Campo id="licitacion-expediente" etiqueta="Expediente">
            <Desplegable value={filtroExpediente} onChange={(e) => setFiltroExpediente(e.target.value)}>
              <option value="">Cualquier cobertura</option>
              <option value="con-lectura">Con documentos leídos</option>
              <option value="sin-lectura">Sin documentos leídos</option>
            </Desplegable>
          </Campo>
          <Campo id="licitacion-estado" etiqueta="Decisión">
            <Desplegable value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)}>
              <option value="">Todas</option>
              <option value="pendientes">Por decidir</option>
              <option value="decididas">Decisión registrada</option>
            </Desplegable>
          </Campo>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button type="button" variant="relOutline" aria-pressed={showExpired} onClick={() => setShowExpired((value) => !value)}>
            Incluir vencidas ({expiredCount})
          </Button>
          {(query || filtroCarril || filtroServicio || filtroExpediente || filtroEstado || showExpired) && (
            <Button type="button" variant="ghost" onClick={() => {
              setBusqueda(""); setFiltroCarril(""); setFiltroServicio(""); setFiltroExpediente(""); setFiltroEstado(""); setShowExpired(false);
            }}>Limpiar filtros</Button>
          )}
          <p className="text-sm text-rel-muted" role="status">{visibleItems.length} procesos visibles · {visibleItems.filter((item) => item.read_documents === 0).length} sin documentos leídos</p>
        </div>
      </Caja>

      {vista === "bandeja" ? (
        loading && !items.length ? <p role="status">Cargando oportunidades…</p>
          : !visibleItems.length ? <EstadoVacio titulo="No hay procesos para mostrar" descripcion="Ajusta los filtros o actualiza la bandeja." escena="buscar" />
          : grupos.map(([id, label]) => {
            const group = visibleItems.filter((item) => grupoDe(item) === id);
            if (!group.length) return null;
            return <SeccionPlegable key={id} titulo={label} estado={<Pill tono="neutro">{group.length}</Pill>} abiertaPorDefecto={!["CONTROL", "VENCIDA", "EVALUACION_POSTERIOR"].includes(id)}>
              <div className="grid min-w-0 gap-3 xl:grid-cols-2">
                {group.map((item) => <Caja como="button" viva key={item.id} onClick={() => void open(item)} className="grid min-h-11 min-w-0 gap-2 text-left">
                  <span className="flex flex-wrap items-center gap-2">
                    <Pill tono={id === "VENCIDA" || id === "SIN_TIEMPO" ? "atencion" : "info"}>{etiquetaCarril(carril(item))}</Pill>
                    <span className="text-sm font-semibold">{cierreVisible(item, today)}</span>
                  </span>
                  <span className="break-words font-bold">{item.buyer_name}</span>
                  <span className="line-clamp-2 break-words text-sm">{item.service_category ? categoria(item.service_category) : item.object_original}</span>
                  <span className="text-sm text-rel-muted">{money(item.budget_amount, item.budget_currency)} · <Cobertura item={item} /></span>
                  {item.official_status === "POR_VERIFICAR" && <span className="text-sm text-warning-ink">Apertura por confirmar en SECOP</span>}
                </Caja>)}
              </div>
            </SeccionPlegable>;
          })
      ) : <VistaTareas
        columnas={COLUMNAS_LICITACION}
        tareas={tareas}
        cargando={loading}
        alSolicitarMovimiento={solicitarMovimiento}
        alAbrirTarea={(t) => t.origen && void open(t.origen)}
        claveMemoria="licitaciones-vista"
        nombreElemento="oportunidades"
      />}

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

      <Sheet open={Boolean(selected) || detailLoading} onOpenChange={(openState) => { if (!openState) { ++detailRequest.current; setSelected(null); setDetailLoading(false); } }}>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-3xl"><SheetHeader><SheetTitle>{selected?.opportunity.buyer_name || "Cargando expediente…"}</SheetTitle></SheetHeader>
          {selected && <div className="mt-5 space-y-5 text-sm text-rel-dark"><div><p className="font-semibold text-rel-info">{selected.opportunity.external_process_id}</p>{etiquetaClasificacion(selected.opportunity) && <p className="mt-1 font-semibold text-rel-warning-ink">Clasificación del agente: {etiquetaClasificacion(selected.opportunity)?.texto}</p>}<p className="mt-2 text-rel-muted">{selected.opportunity.object_original}</p></div>
            <div className="grid gap-2 sm:grid-cols-2">
              <Fact label="Presupuesto de SECOP" value={money(selected.opportunity.budget_amount, selected.opportunity.budget_currency)} />
              <Fact label="Cronograma de SECOP" value={cierreVisible(selected.opportunity, today)} />
              <Fact label="Estado oficial" value={selected.opportunity.official_status === "POR_VERIFICAR" ? "Por confirmar en SECOP" : statusLabel(selected.opportunity.official_status)} />
              <Fact label="Categoría" value={categoria(selected.opportunity.service_category)} />
              <Fact label="Volumen del servicio" value={selected.opportunity.volume_amount != null && selected.opportunity.volume_unit && selected.opportunity.volume_unit !== "referencia_extraida"
                ? [selected.opportunity.volume_amount, selected.opportunity.volume_unit, selected.opportunity.volume_evidence_status === "VERIFICADO" ? null : "por validar"].filter(Boolean).join(" ")
                : "Sin cantidad y unidad sustentadas"} />
              <Fact label="Ciudades / sedes" value={[...(selected.opportunity.municipalities_json || []), selected.opportunity.department].filter(Boolean).join(", ") || "Sin dato confirmado"} />
            </div>
            {selected.opportunity.official_url && <a className="inline-flex text-rel-info underline underline-offset-2" href={selected.opportunity.official_url} target="_blank" rel="noreferrer">Abrir proceso en SECOP</a>}
            <Aviso tono="info" titulo="Cobertura del expediente">
              <Cobertura item={{ ...selected.opportunity,
                read_documents: numericQuality(selected.opportunity.quality_json ?? selected.opportunity, "read_documents"),
                published_documents: numericQuality(selected.opportunity.quality_json ?? selected.opportunity, "published_documents"),
              }} />. {selected.opportunity.quality_json?.inventory_confirmed === false && "Inventario por confirmar."}
            </Aviso>
            <div className="space-y-3">
              {blocks.map(({ title, fields }, index) => {
                const withData = fields.filter((field) => campoTieneDatos(field) || currentReviews.some((review) => review.field_key === field.field_key));
                const withoutData = fields.filter((field) => !withData.includes(field));
                const verified = fields.filter((field) => {
                  const status = currentReviews.find((review) => review.field_key === field.field_key)?.status;
                  return status && ["VERIFICADO", "CORREGIDO", "NO_APLICA"].includes(status);
                }).length;
                return <SeccionPlegable key={title} titulo={title} abiertaPorDefecto={index < 2}
                  descripcion={fields.length ? `${verified}/${fields.length} con revisión humana · ${withData.length} con hallazgos o evidencia` : "Sin campos recibidos"}>
                  <div className="grid gap-3">
                    {withData.map((field) => {
                      const review = currentReviews.find((item) => item.field_key === field.field_key);
                      const values = textoHallazgo(review?.status === "CORREGIDO" ? review.value_json : field.value_json);
                      const state = review?.status ?? field.evidence_status;
                      return <Caja key={field.field_key} className="grid min-w-0 gap-2 break-words">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <h3 className="font-semibold">{fieldLabel(field.field_key)}</h3>
                          <Pill tono={["VERIFICADO", "CORREGIDO"].includes(state) ? "exito" : state === "CONFLICTO" ? "peligro" : "neutro"}>{statusLabel(state)}</Pill>
                        </div>
                        {values.length > 0 && <ul className="space-y-1">{[...new Set(values)].map((value) => <li key={value}>{value}</li>)}</ul>}
                        {!values.length && Boolean(field.evidence_json?.length) && <p className="text-rel-muted">Referencia documental para revisar.</p>}
                        {Boolean(field.evidence_json?.length) && <details><summary className="cursor-pointer text-rel-info">Ver referencias ({field.evidence_json?.length})</summary>
                          {field.evidence_json?.map((ref, n) => <blockquote key={n} className="mt-2 border-l-2 border-rel-info bg-rel-info-subtle p-3 text-sm">
                            {ref.quote && <p>{ref.quote}</p>}
                            <footer className="text-rel-muted">{ref.document_id ? `Documento ${ref.document_id}` : "Documento"}{ref.page ? ` · página ${ref.page}` : ""}</footer>
                          </blockquote>)}
                        </details>}
                      </Caja>;
                    })}
                    {withoutData.length > 0 && <details className="text-rel-muted">
                      <summary className="cursor-pointer">{withoutData.length} campos sin hallazgos en esta lectura</summary>
                      <ul className="ml-5 mt-2 list-disc">{withoutData.map((field) => <li key={field.field_key}>{fieldLabel(field.field_key)}</li>)}</ul>
                    </details>}
                  </div>
                </SeccionPlegable>;
              })}
            </div>
            {canReview && <Caja como="form" onSubmit={submitReview} tono="hundida" aire="ajustado" className="space-y-3"><div><h2 className="font-bold">Revisión humana</h2><p className="mt-1 text-xs text-rel-muted">Apertura y admisión empresarial deben quedar verificadas antes de cerrar una decisión GO.</p></div><Label htmlFor="review-field">Control o campo</Label><Desplegable id="review-field" value={reviewField} onChange={(event) => { setReviewField(event.target.value); setReviewValue(""); }}><optgroup label="Controles para decisión GO">{REQUIRED_GO_REVIEWS.map((field) => <option key={field.field_key} value={field.field_key}>{field.label}</option>)}</optgroup>{selected.fields.length > 0 && <optgroup label="Campos extraídos">{selected.fields.map((field) => <option key={field.field_key} value={field.field_key}>{fieldLabel(field.field_key)}</option>)}</optgroup>}</Desplegable><Label htmlFor="review-status">Resultado</Label><Desplegable id="review-status" value={reviewStatus} onChange={(event) => setReviewStatus(event.target.value)}><option value="PENDIENTE">{statusLabel("PENDIENTE")}</option><option value="VERIFICADO">{statusLabel("VERIFICADO")}</option><option value="CORREGIDO">{statusLabel("CORREGIDO")}</option><option value="NO_APLICA">{statusLabel("NO_APLICA")}</option></Desplegable>{!reviewControl && <><Label htmlFor="review-value">Valor revisado</Label><Input id="review-value" value={reviewValue} onChange={(event) => setReviewValue(event.target.value)} placeholder={reviewUsesJson ? "JSON válido" : "Valor confirmado"} /></>}<Label htmlFor="review-rationale">Fundamento</Label><Textarea id="review-rationale" value={reviewRationale} onChange={(event) => setReviewRationale(event.target.value)} maxLength={2000} /><Button variant="rel" disabled={saving || !reviewField}>Guardar revisión</Button></Caja>}
            {canDecide && !selected.opportunity.decision && <Caja como="form" onSubmit={submitDecision} tono="hundida" aire="ajustado" className="space-y-3"><h2 className="font-bold">Decisión comercial</h2>{!readyForGo && <p className="text-rel-muted">Para ir o ir con aliado, confirma la apertura oficial y valida apertura y admisión empresarial.</p>}<Label htmlFor="decision">Decisión</Label><Desplegable id="decision" value={decision} onChange={(event) => setDecision(event.target.value)}><option value="" disabled>Selecciona una decisión</option>{Object.entries(DECISIONES).map(([value, label]) => <option key={value} value={value} disabled={!readyForGo && (value === "GO" || value === "GO_CON_ALIADO")}>{label}</option>)}</Desplegable><Label htmlFor="reason-code">Código de motivo</Label><Input id="reason-code" value={reasonCode} onChange={(event) => setReasonCode(event.target.value)} placeholder="CAPACIDAD_TECNICA" pattern="[A-Za-z0-9_]{3,80}" required /><Label htmlFor="decision-rationale">Justificación</Label><Textarea id="decision-rationale" value={decisionRationale} onChange={(event) => setDecisionRationale(event.target.value)} minLength={5} maxLength={3000} required /><Button variant="rel" disabled={saving || !readyToSubmit}>Cerrar decisión</Button></Caja>}
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
