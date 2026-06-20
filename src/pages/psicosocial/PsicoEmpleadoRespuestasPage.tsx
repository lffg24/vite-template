import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  ClipboardList,
  FileLock2,
  FileText,
  ChevronDown,
  Loader2,
  Save,
  ShieldCheck,
  UsersRound,
} from "lucide-react";
import {
  buscarMunicipiosPsico,
  guardarFichaSociodemografica,
  guardarRespuestasPsicoEmpleado,
  obtenerCatalogosSociodemograficos,
  obtenerFichaSociodemografica,
  obtenerPerfilPsicoEmpleado,
  obtenerRespuestasPsicoEmpleado,
  type FichaSociodemografica,
  type CondicionalRespuesta,
  type PreguntaRespuesta,
  type PsicoAplicacionEmpleado,
  type PsicoEmpleadoPerfil,
  type PsicoEvaluacionEmpleado,
} from "@/features/psicosocial/api/psicoEmpleadoService";
import { AbrilApiError } from "@/features/psicosocial/api/httpClient";
import { ConfirmDialog } from "@/components/feedback/ConfirmDialog";
import { ToastCard, type ToastPayload } from "@/components/feedback/ToastCard";

const LIKERT = ["Siempre", "Casi siempre", "Algunas veces", "Casi nunca", "Nunca"];
const CLIENTS_GATE_CODE = "servicio_clientes_usuarios";
const CLIENTS_GATE_FALLBACK: CondicionalRespuesta = {
  codigo: CLIENTS_GATE_CODE,
  label: "En mi trabajo debo brindar servicio a clientes o usuarios",
  dimension_code: "demandas_emocionales",
  ordenes: [106, 107, 108, 109, 110, 111, 112, 113, 114],
  respuesta: null,
};
const CLIENTS_GATE_FALLBACK_B: CondicionalRespuesta = {
  codigo: CLIENTS_GATE_CODE,
  label: "En mi trabajo debo brindar servicio a clientes o usuarios",
  dimension_code: "demandas_emocionales",
  ordenes: [89, 90, 91, 92, 93, 94, 95, 96, 97],
  respuesta: null,
};
const LEADER_GATE_CODE = "jefe_personas";
const LEADER_GATE_FALLBACK: CondicionalRespuesta = {
  codigo: LEADER_GATE_CODE,
  label: "Soy jefe de otras personas en mi trabajo",
  dimension_code: "relacion_colaboradores",
  ordenes: [115, 116, 117, 118, 119, 120, 121, 122, 123],
  respuesta: null,
};
const INTRA_A_FALLBACK_RULES = [CLIENTS_GATE_FALLBACK, LEADER_GATE_FALLBACK];
const FALLBACK_RULES_BY_INSTRUMENT: Record<string, CondicionalRespuesta[]> = {
  PSICO_INTRA_A: INTRA_A_FALLBACK_RULES,
  PSICO_INTRA_B: [CLIENTS_GATE_FALLBACK_B],
};
const EMPTY_FICHA: FichaSociodemografica = {
  sexo: "",
  anio_nacimiento: null,
  edad: null,
  estado_civil: "",
  nivel_estudios: "",
  ocupacion_profesion: "",
  ciudad_residencia: "",
  departamento_residencia: "",
  ciudad_trabajo: "",
  departamento_trabajo: "",
  estrato: "",
  tipo_vivienda: "",
  personas_dependen: null,
  area: "",
  cargo: "",
  tipo_cargo: "",
  tipo_contrato: "",
  tipo_salario: "",
  horas_diarias_trabajo: null,
  antiguedad_empresa: "",
  antiguedad_cargo: "",
};

const INSTRUMENT_LABELS: Record<string, string> = {
  PSICO_INTRA_A: "Intralaboral Forma A",
  PSICO_INTRA_B: "Intralaboral Forma B",
  PSICO_EXTRA: "Extralaboral",
  PSICO_ESTRES: "Estrés",
};
const DIMENSION_LABELS: Record<string, string> = {
  caracteristicas_liderazgo: "Características del liderazgo",
  relaciones_sociales: "Relaciones sociales en el trabajo",
  retroalimentacion_desempeno: "Retroalimentación del desempeño",
  relacion_colaboradores: "Relación con colaboradores",
  claridad_rol: "Claridad de rol",
  capacitacion: "Capacitación",
  participacion_cambio: "Participación y manejo del cambio",
  oportunidades_habilidades: "Oportunidades para el uso y desarrollo de habilidades",
  control_autonomia: "Control y autonomía sobre el trabajo",
  demandas_ambientales_esfuerzo: "Demandas ambientales y de esfuerzo físico",
  demandas_emocionales: "Demandas emocionales",
  demandas_cuantitativas: "Demandas cuantitativas",
  influencia_extralaboral: "Influencia del trabajo sobre el entorno extralaboral",
  exigencias_responsabilidad: "Exigencias de responsabilidad del cargo",
  demandas_carga_mental: "Demandas de carga mental",
  consistencia_rol: "Consistencia del rol",
  demandas_jornada: "Demandas de la jornada de trabajo",
  recompensas_pertenencia: "Recompensas por pertenencia a la organización",
  reconocimiento_compensacion: "Reconocimiento y compensación",
  desplazamiento: "Desplazamiento vivienda-trabajo-vivienda",
  vivienda_entorno: "Características de la vivienda y entorno",
  tiempo_fuera_trabajo: "Tiempo fuera del trabajo",
  comunicacion_relaciones: "Comunicación y relaciones interpersonales",
  relaciones_familiares: "Relaciones familiares",
  influencia_entorno_trabajo: "Influencia del entorno extralaboral sobre el trabajo",
  situacion_economica: "Situación económica del grupo familiar",
};

function instrumentLabel(code?: string | null) {
  return INSTRUMENT_LABELS[String(code || "")] || String(code || "Instrumento");
}

function normalizeRespuestaLabel(value: unknown) {
  const raw = String(value ?? "").trim();
  if (!raw) return "";
  const normalized = raw.toLowerCase().replace(/_/g, " ").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const byText = LIKERT.find((opt) => opt.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") === normalized);
  if (byText) return byText;
  const n = Number(raw);
  // Compatibilidad con respuestas históricas guardadas como índice 0..4 de la escala visual.
  if (Number.isInteger(n) && n >= 0 && n < LIKERT.length) return LIKERT[n];
  return raw;
}

function parseParams(value: any) {
  if (!value) return {};
  if (typeof value === "object") return value;
  try {
    return JSON.parse(value);
  } catch {
    return {};
  }
}
function prettyDimension(value?: string | null) {
  const raw = String(value || "").trim();
  if (!raw) return "Preguntas";
  return DIMENSION_LABELS[raw] || raw.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
function conditionalAnchor(rule: CondicionalRespuesta) {
  const firstControlled = Math.min(...(rule.ordenes || []).map(Number).filter(Number.isFinite));
  return Number.isFinite(firstControlled) ? firstControlled - 1 : 0;
}
function conditionalSort(a: CondicionalRespuesta, b: CondicionalRespuesta) {
  return conditionalAnchor(a) - conditionalAnchor(b);
}
export function mergeConditionalRules(apiRules: CondicionalRespuesta[], instrumentCode?: string | null) {
  const rules = [...apiRules];
  for (const fallback of FALLBACK_RULES_BY_INSTRUMENT[String(instrumentCode || "")] || []) {
    if (!rules.some((rule) => rule.codigo === fallback.codigo)) rules.push(fallback);
  }
  return rules.sort(conditionalSort);
}
export function applicableQuestionIdsForConditionals(
  preguntas: PreguntaRespuesta[],
  rules: CondicionalRespuesta[],
  answers: Record<string, boolean | null>,
) {
  const omittedOrders = new Set<number>();
  for (const rule of rules) {
    if ((answers[rule.codigo] ?? false) === false) {
      for (const order of rule.ordenes || []) omittedOrders.add(Number(order));
    }
  }
  return preguntas.filter((p) => !omittedOrders.has(Number(p.orden))).map((p) => Number(p.pregunta_id));
}
export type InstrumentProgress = {
  total: number;
  answered: number;
  pending: number;
  progress: number;
};
export function calculateInstrumentProgress(
  preguntas: PreguntaRespuesta[],
  rules: CondicionalRespuesta[],
  answers: Record<number, string>,
  conditionalAnswers: Record<string, boolean | null>,
): InstrumentProgress {
  const applicableIds = new Set(applicableQuestionIdsForConditionals(preguntas, rules, conditionalAnswers));
  const answeredQuestions = preguntas.filter((p) => applicableIds.has(Number(p.pregunta_id)) && Boolean(answers[p.pregunta_id])).length;
  const conditionalTotal = rules.length;
  const conditionalAnswered = rules.length;
  const total = applicableIds.size + conditionalTotal;
  const answered = answeredQuestions + conditionalAnswered;
  return {
    total,
    answered,
    pending: Math.max(total - answered, 0),
    progress: pct(answered, total),
  };
}
export function batterySummaryProgress(
  ev: PsicoEvaluacionEmpleado,
  activeEvalId?: number | null,
  activeProgress?: InstrumentProgress | null,
) {
  if (activeEvalId === ev.evaluacion_id && activeProgress) return activeProgress.progress;
  return pct(ev.respondidas, ev.total_preguntas);
}
function dimensionOf(p: PreguntaRespuesta) {
  const params = parseParams(p.parametros);
  return String(
    p.dimension_label || params.dimension_label || prettyDimension(p.dimension_code || params.dimension_code || params.dimension || "Preguntas"),
  );
}
function pct(a: number, b: number) {
  if (b <= 0) return 0;
  return Math.min(100, Math.round((a * 1000) / b) / 10);
}
function statusTone(status?: string | null) {
  const value = String(status || "").toLowerCase();
  if (["finalizada", "calculada", "completa"].includes(value)) return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (["borrador"].includes(value)) return "bg-violet-50 text-violet-700 border-violet-200";
  return "bg-slate-50 text-slate-600 border-slate-200";
}
function isLockedResponseStatus(status?: string | null) {
  return ["finalizada", "calculada", "completa"].includes(String(status || "").toLowerCase());
}
function isStarted(ev?: PsicoEvaluacionEmpleado | null) {
  if (!ev) return false;
  return Number(ev.respondidas || 0) > 0 || ["borrador", "finalizada", "calculada", "completa"].includes(String(ev.estado_respuestas || "").toLowerCase());
}

function isEvalBlockedBySibling(evaluaciones: PsicoEvaluacionEmpleado[] = [], ev?: PsicoEvaluacionEmpleado | null) {
  if (!ev) return false;
  const code = String(ev.instrument_code || "");
  if (!["PSICO_INTRA_A", "PSICO_INTRA_B"].includes(code)) return false;
  const siblingCode = code === "PSICO_INTRA_A" ? "PSICO_INTRA_B" : "PSICO_INTRA_A";
  const sibling = evaluaciones.find((item) => item.instrument_code === siblingCode);
  return Boolean(sibling && isStarted(sibling) && !isStarted(ev));
}
function chooseInitialEvaluation(app?: PsicoAplicacionEmpleado | null, preferredEvalId?: number) {
  const evals = app?.evaluaciones || [];
  if (!evals.length) return null;
  const usable = evals.filter((ev) => !isEvalBlockedBySibling(evals, ev));
  if (preferredEvalId) {
    const preferred = usable.find((ev) => ev.evaluacion_id === preferredEvalId);
    if (preferred) return preferred;
  }
  return (
    usable.find((ev) => isStarted(ev)) ||
    usable.find((ev) => Number(ev.respondidas || 0) > 0) ||
    usable.find((ev) => ev.editable) ||
    usable[0] ||
    evals[0]
  );
}

export default function PsicoEmpleadoRespuestasPage() {
  const { empleadoId = "", aplicacionId = "" } = useParams();
  const navigate = useNavigate();
  const [perfil, setPerfil] = useState<PsicoEmpleadoPerfil | null>(null);
  const [app, setApp] = useState<PsicoAplicacionEmpleado | null>(null);
  const [selectedEval, setSelectedEval] = useState<PsicoEvaluacionEmpleado | null>(null);
  const [preguntas, setPreguntas] = useState<PreguntaRespuesta[]>([]);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [conditionalRules, setConditionalRules] = useState<CondicionalRespuesta[]>([]);
  const [conditionalAnswers, setConditionalAnswers] = useState<Record<string, boolean | null>>({});
  const [conditionalBlockOpen, setConditionalBlockOpen] = useState<Record<string, boolean>>({});
  const [observaciones, setObservaciones] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastPayload | null>(null);
  const [confirmFinalize, setConfirmFinalize] = useState(false);
  const [showFicha, setShowFicha] = useState(false);
  const [ficha, setFicha] = useState<FichaSociodemografica>(EMPTY_FICHA);
  const [fichaCompleta, setFichaCompleta] = useState(false);

  const notify = (payload: Omit<ToastPayload, "id">) => {
    const id = Date.now();
    setToast({ id, ...payload });
    window.setTimeout(() => setToast((current) => (current?.id === id ? null : current)), 5200);
  };
  const draftKey = `abril360:capture-draft:${empleadoId}:${aplicacionId}:${selectedEval?.evaluacion_id || "none"}`;

  const refreshContext = async (preferredEvalId?: number) => {
    if (!empleadoId || !aplicacionId) return;
    const p = await obtenerPerfilPsicoEmpleado(empleadoId);
    const selected = (p.aplicaciones || []).find((a) => String(a.aplicacion_id) === String(aplicacionId)) || null;
    setPerfil(p);
    setApp(selected);
    setSelectedEval(chooseInitialEvaluation(selected, preferredEvalId));
  };

  useEffect(() => {
    const onExpired = () => {
      persistDraft();
      notify({
        type: "warning",
        title: "Sesión vencida",
        message: "Guardé un borrador local temporal para evitar pérdida de información. Te redirigiremos al login.",
      });
      window.setTimeout(() => navigate(`/login?next=${encodeURIComponent(window.location.pathname)}`), 1800);
    };
    window.addEventListener("abril360:session-expired", onExpired);
    return () => window.removeEventListener("abril360:session-expired", onExpired);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate, answers, conditionalAnswers, observaciones, draftKey]);

  useEffect(() => {
    let mounted = true;
    async function load() {
      if (!empleadoId || !aplicacionId) return;
      setLoading(true);
      setPageError(null);
      try {
        const p = await obtenerPerfilPsicoEmpleado(empleadoId);
        const selected = (p.aplicaciones || []).find((a) => String(a.aplicacion_id) === String(aplicacionId)) || null;
        if (!mounted) return;
        setPerfil(p);
        setApp(selected);
        setSelectedEval(chooseInitialEvaluation(selected));
      } catch (e) {
        if (mounted) setPageError(e instanceof Error ? e.message : "No fue posible cargar la aplicación.");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, [empleadoId, aplicacionId]);

  useEffect(() => {
    let mounted = true;
    async function loadFicha() {
      if (!empleadoId || !aplicacionId) return;
      try {
        const res = await obtenerFichaSociodemografica(empleadoId, aplicacionId);
        if (!mounted) return;
        setFicha({ ...EMPTY_FICHA, ...(((res as any).item || {}) as Partial<FichaSociodemografica>) });
        setFichaCompleta(Boolean(res.completa));
      } catch {
        // Datos generales se cargan desde empleados. No requiere migración sociodemográfica nueva.
      }
    }
    loadFicha();
    return () => { mounted = false; };
  }, [empleadoId, aplicacionId]);

  useEffect(() => {
    let mounted = true;
    async function loadQuestions() {
      if (!empleadoId || !selectedEval?.evaluacion_id) return;
      setLoadingQuestions(true);
      setPageError(null);
      try {
        const res = await obtenerRespuestasPsicoEmpleado(empleadoId, selectedEval.evaluacion_id);
        if (!mounted) return;
        setPreguntas(res.preguntas || []);
        const apiRules = Array.isArray(res.condicionales) ? res.condicionales : [];
        const rules = mergeConditionalRules(apiRules, selectedEval?.instrument_code);
        setConditionalRules(rules);
        const serverAnswers: Record<number, string> = {};
        for (const p of res.preguntas || []) if (p.respuesta) serverAnswers[p.pregunta_id] = normalizeRespuestaLabel(p.respuesta);
        const lockedForDraft =
          ["finalizada", "calculada", "cerrada"].some((state) => String(app?.estado || "").toLowerCase().includes(state)) ||
          !selectedEval?.editable ||
          isLockedResponseStatus(selectedEval?.estado_respuestas);
        const draftStorageKey = `abril360:capture-draft:${empleadoId}:${aplicacionId}:${selectedEval.evaluacion_id}`;
        const local = lockedForDraft ? null : readDraft(draftStorageKey);
        const localAnswers = Object.fromEntries(Object.entries(local?.answers || {}).map(([key, value]) => [key, normalizeRespuestaLabel(value)]));
        const nextConditionalAnswers: Record<string, boolean | null> = {};
        for (const rule of rules) {
          const code = String(rule.codigo || "");
          if (!code) continue;
          const fromServer = typeof rule.respuesta === "boolean" ? rule.respuesta : null;
          const fromLocal = typeof local?.conditionalAnswers?.[code] === "boolean" ? local.conditionalAnswers[code] : undefined;
          const blockOrders = new Set((rule.ordenes || []).map(Number));
          const hasBlockAnswers = (res.preguntas || []).some((p) => blockOrders.has(Number(p.orden)) && Boolean(serverAnswers[p.pregunta_id]));
          nextConditionalAnswers[code] = fromLocal ?? fromServer ?? (hasBlockAnswers ? true : false);
        }
        setAnswers({ ...serverAnswers, ...localAnswers });
        setConditionalAnswers(nextConditionalAnswers);
        setConditionalBlockOpen(Object.fromEntries(rules.map((rule) => [rule.codigo, Boolean(nextConditionalAnswers[rule.codigo])])));
        setObservaciones(String(local?.observaciones ?? res.observaciones ?? ""));
        if (lockedForDraft) {
          try {
            sessionStorage.removeItem(draftStorageKey);
          } catch {}
        }
        if (local?.answers) {
          notify({
            type: "info",
            title: "Borrador local recuperado",
            message: "Restauramos respuestas no enviadas de esta sesión para que continúes sin perder avance.",
          });
        }
      } catch (e) {
        if (mounted) setPageError(e instanceof Error ? e.message : "No fue posible cargar preguntas.");
      } finally {
        if (mounted) setLoadingQuestions(false);
      }
    }
    loadQuestions();
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [empleadoId, aplicacionId, selectedEval?.evaluacion_id]);

  const appClosed = ["finalizada", "calculada", "cerrada"].some((state) => String(app?.estado || "").toLowerCase().includes(state));
  const selectedLocked = appClosed || !selectedEval?.editable || isLockedResponseStatus(selectedEval?.estado_respuestas);

  function persistDraft() {
    if (!selectedEval || selectedLocked) return;
    try {
      sessionStorage.setItem(draftKey, JSON.stringify({ answers, conditionalAnswers, observaciones, updatedAt: new Date().toISOString() }));
    } catch {}
  }
  useEffect(() => {
    const t = window.setTimeout(() => persistDraft(), 450);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [answers, conditionalAnswers, observaciones, draftKey]);

  const conditionalOrders = useMemo(() => new Set(conditionalRules.flatMap((rule) => (rule.ordenes || []).map(Number))), [conditionalRules]);
  const omittedConditionalOrders = useMemo(() => {
    const omitted = new Set<number>();
    for (const rule of conditionalRules) {
      if ((conditionalAnswers[rule.codigo] ?? false) === false) {
        for (const order of rule.ordenes || []) omitted.add(Number(order));
      }
    }
    return omitted;
  }, [conditionalRules, conditionalAnswers]);
  const applicableQuestions = useMemo(() => {
    if (omittedConditionalOrders.size === 0) return preguntas;
    return preguntas.filter((p) => !omittedConditionalOrders.has(Number(p.orden)));
  }, [preguntas, omittedConditionalOrders]);
  const baseQuestionsForRender = useMemo(() => {
    if (conditionalOrders.size === 0) return preguntas;
    return preguntas.filter((p) => !conditionalOrders.has(Number(p.orden)));
  }, [preguntas, conditionalOrders]);
  const conditionalPlacementByCode = useMemo(() => {
    const placements: Record<string, number> = {};
    for (const rule of conditionalRules) {
      const anchor = conditionalAnchor(rule);
      const anchorQuestion = baseQuestionsForRender.find((p) => Number(p.orden) === anchor);
      if (anchorQuestion) {
        placements[rule.codigo] = Number(anchorQuestion.pregunta_id);
        continue;
      }
      const firstControlled = Math.min(...(rule.ordenes || []).map(Number).filter(Number.isFinite));
      const previousQuestion = [...baseQuestionsForRender]
        .filter((p) => Number(p.orden) < firstControlled)
        .sort((a, b) => Number(b.orden) - Number(a.orden))[0];
      if (previousQuestion) placements[rule.codigo] = Number(previousQuestion.pregunta_id);
    }
    return placements;
  }, [conditionalRules, baseQuestionsForRender]);
  const topConditionalRules = useMemo(
    () => conditionalRules.filter((rule) => !conditionalPlacementByCode[rule.codigo]),
    [conditionalRules, conditionalPlacementByCode],
  );
  const instrumentProgress = useMemo(
    () => calculateInstrumentProgress(preguntas, conditionalRules, answers, conditionalAnswers),
    [preguntas, conditionalRules, answers, conditionalAnswers],
  );
  const total = instrumentProgress.total;
  const pending = instrumentProgress.pending;
  const progress = instrumentProgress.progress;

  // Datos generales no es un instrumento de 31/97/123 preguntas.
  // La ficha oficial se mide por campos requeridos para evitar reutilizar métricas de Extralaboral/Estrés.
  const fichaPendientes = useMemo(() => fichaMissing(ficha), [ficha]);
  const fichaTotal = 18;
  const fichaAnswered = Math.max(0, fichaTotal - fichaPendientes.length);
  const fichaProgress = pct(fichaAnswered, fichaTotal);
  const metricTotal = showFicha ? fichaTotal : total;
  const metricAnswered = showFicha ? fichaAnswered : instrumentProgress.answered;
  const metricPending = showFicha ? fichaPendientes.length : pending;
  const metricProgress = showFicha ? fichaProgress : progress;
  const sections = useMemo(() => {
    const map = new Map<string, { name: string; total: number; answered: number }>();
    for (const p of applicableQuestions) {
      const name = dimensionOf(p);
      const current = map.get(name) || { name, total: 0, answered: 0 };
      current.total += 1;
      if (answers[p.pregunta_id]) current.answered += 1;
      map.set(name, current);
    }
    return Array.from(map.values());
  }, [applicableQuestions, answers]);
  const pendingPreview = useMemo(() => {
    const missing = applicableQuestions.filter((p) => !answers[p.pregunta_id]).map((p) => `Pregunta ${p.orden} · ${dimensionOf(p)}`);
    return { details: missing.slice(0, 4), moreCount: Math.max(missing.length - 4, 0) };
  }, [applicableQuestions, answers]);

  const selectedCode = String(selectedEval?.instrument_code || "");
  const siblingStarted = useMemo(() => {
    if (!app || !["PSICO_INTRA_A", "PSICO_INTRA_B"].includes(selectedCode)) return false;
    const siblingCode = selectedCode === "PSICO_INTRA_A" ? "PSICO_INTRA_B" : "PSICO_INTRA_A";
    const sibling = app.evaluaciones.find((ev) => ev.instrument_code === siblingCode);
    return isStarted(sibling);
  }, [app, selectedCode]);

  const getEvalMeta = (ev: PsicoEvaluacionEmpleado) => {
    const blockedBySibling = isEvalBlockedBySibling(app?.evaluaciones || [], ev);
    return { blockedBySibling };
  };

  function setConditionalGateAnswer(rule: CondicionalRespuesta, value: boolean) {
    const code = String(rule.codigo || "");
    setConditionalAnswers((prev) => ({ ...prev, [code]: value }));
    setConditionalBlockOpen((prev) => ({ ...prev, [code]: value }));
    if (!value && (rule.ordenes || []).length > 0) {
      const orders = new Set((rule.ordenes || []).map(Number));
      const ids = new Set(preguntas.filter((p) => orders.has(Number(p.orden))).map((p) => Number(p.pregunta_id)));
      setAnswers((prev) => {
        const next = { ...prev };
        for (const id of ids) delete next[id];
        return next;
      });
    }
  }

  async function executeSaveFicha(finalizar = false) {
    const missingLocal = fichaMissing(ficha);
    if (finalizar && missingLocal.length > 0) {
      notify({
        type: "warning",
        title: "Datos generales incompletos",
        message: `Completa: ${missingLocal.slice(0, 5).join(", ")}${missingLocal.length > 5 ? ` y ${missingLocal.length - 5} más` : ""}.`,
      });
      return;
    }
    setSaving(true);
    try {
      const res = await guardarFichaSociodemografica(empleadoId, aplicacionId, { ...ficha, finalizar });
      const completa = Boolean(res.completa);
      setFichaCompleta(completa);
      if ((res as any).item) setFicha({ ...EMPTY_FICHA, ...(((res as any).item || {}) as Partial<FichaSociodemografica>) });
      await refreshContext(selectedEval?.evaluacion_id);
      notify({
        type: completa || !finalizar ? "success" : "warning",
        title: finalizar ? (completa ? "Datos generales finalizados" : "Datos generales pendientes") : "Datos generales guardados",
        message: completa
          ? "La ficha quedó completa y se actualizó el estado del participante."
          : "Los datos se guardaron, pero aún faltan campos para completar la ficha.",
      });
    } catch (e) {
      notify({ type: "warning", title: "No se pudo guardar la ficha", message: e instanceof Error ? e.message : "Revisa los campos obligatorios." });
    } finally {
      setSaving(false);
    }
  }

  async function executeSave(finalizar = false) {
    if (!selectedEval || selectedLocked) return;
    persistDraft();
    setSaving(true);
    setPageError(null);
    try {
      const payload = applicableQuestions.map((p) => ({ pregunta_id: p.pregunta_id, orden: p.orden, respuesta: answers[p.pregunta_id] || null }));
      const condicionales = conditionalRules.map((rule) => ({ codigo: rule.codigo, respuesta: Boolean(conditionalAnswers[rule.codigo]) }));
      const res = await guardarRespuestasPsicoEmpleado(empleadoId, selectedEval.evaluacion_id, payload, finalizar, observaciones, condicionales);
      try {
        sessionStorage.removeItem(draftKey);
      } catch {}
      await refreshContext(selectedEval.evaluacion_id);
      notify({
        type: "success",
        title: finalizar ? "Instrumento finalizado" : "Borrador guardado",
        message: `${res.respondidas}/${res.total} respuestas sincronizadas correctamente.`,
      });
    } catch (e) {
      if (e instanceof AbrilApiError && e.status === 401) {
        persistDraft();
        return;
      }
      notify({
        type: "error",
        title: "No fue posible guardar respuestas",
        message: e instanceof Error ? e.message : "Intenta nuevamente.",
      });
    } finally {
      setSaving(false);
    }
  }

  function requestFinalize() {
    if (!selectedEval || selectedLocked) return;
    if (pending > 0) {
      notify({
        type: "warning",
        title: "No se puede finalizar",
        message: `Faltan ${pending} preguntas por responder en ${instrumentLabel(selectedEval.instrument_code)}.`,
        details: pendingPreview.details,
        moreCount: pendingPreview.moreCount,
      });
      return;
    }
    setConfirmFinalize(true);
  }

  function getConditionalBlockQuestions(rule: CondicionalRespuesta) {
    const orders = new Set((rule.ordenes || []).map(Number));
    return preguntas.filter((p) => orders.has(Number(p.orden)));
  }

  function renderConditionalBlock(rule: CondicionalRespuesta) {
    const code = String(rule.codigo || "");
    return (
      <ConditionalQuestionBlock
        key={`conditional-${code}`}
        rule={rule}
        value={conditionalAnswers[code] ?? false}
        blockQuestions={getConditionalBlockQuestions(rule)}
        answers={answers}
        disabled={selectedLocked}
        open={Boolean(conditionalBlockOpen[code])}
        onToggleOpen={() => setConditionalBlockOpen((prev) => ({ ...prev, [code]: !prev[code] }))}
        onGateChange={(value) => setConditionalGateAnswer(rule, value)}
        onAnswerChange={(preguntaId, value) => setAnswers((prev) => ({ ...prev, [preguntaId]: value }))}
      />
    );
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 p-6">
        <div className="mx-auto max-w-[1540px] space-y-5">
          <div className="h-28 animate-pulse rounded-[30px] border border-slate-200 bg-white" />
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="h-36 animate-pulse rounded-3xl border border-slate-200 bg-white" />
            <div className="h-36 animate-pulse rounded-3xl border border-slate-200 bg-white" />
            <div className="h-36 animate-pulse rounded-3xl border border-slate-200 bg-white" />
          </div>
          <div className="grid min-h-[360px] place-items-center rounded-3xl border border-slate-200 bg-white text-slate-600 shadow-sm">
            <div className="text-center">
              <Loader2 className="mx-auto h-10 w-10 animate-spin text-violet-700" />
              <p className="mt-3 text-sm font-black">Cargando registro de respuestas…</p>
            </div>
          </div>
        </div>
      </main>
    );
  }
  const nombre = perfil?.nombre_completo || `Colaborador ${empleadoId}`;

  return (
    <main className="min-h-screen bg-slate-50 p-4 md:p-6">
      {toast && <ToastCard toast={toast} onClose={() => setToast(null)} />}
      <ConfirmDialog
        open={confirmFinalize}
        title="Finalizar instrumento"
        description="Una vez finalizado, el instrumento quedará bloqueado para edición. Si estás usando Forma A, la Forma B quedará deshabilitada para este colaborador en esta aplicación, y viceversa."
        confirmLabel="Sí, finalizar"
        cancelLabel="Seguir revisando"
        onConfirm={() => {
          setConfirmFinalize(false);
          void executeSave(true);
        }}
        onCancel={() => setConfirmFinalize(false)}
      />

      <div className="mx-auto max-w-[1540px] space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button type="button" onClick={() => navigate(-1)} className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold shadow-sm transition hover:bg-slate-50">
            <ArrowLeft className="h-4 w-4" /> Volver
          </button>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => navigate(`/psicosocial/empleados/${empleadoId}/aplicaciones/${aplicacionId}/informes`)}
              className="inline-flex items-center gap-2 rounded-2xl border border-violet-200 bg-violet-50 px-4 py-2.5 text-sm font-black text-violet-700 shadow-sm transition hover:bg-violet-100"
            >
              <FileText className="h-4 w-4" /> Informe individual
            </button>
            {selectedEval && <span className={`rounded-full border px-3 py-1 text-xs font-black ${statusTone(selectedEval.estado_respuestas)}`}>{String(selectedEval.estado_respuestas || "sin iniciar").replace(/_/g, " ")}</span>}
            {selectedLocked && <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">Modo solo lectura</span>}
          </div>
        </div>

        <section className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm md:p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-violet-700">Registro de respuestas · Baterías psicosociales</p>
              <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950">{app?.nombre || "Aplicación psicosocial"}</h1>
              <p className="mt-2 text-sm text-slate-500">
                Colaborador: <b>{nombre}</b> · Cargo: <b>{perfil?.cargo || "Sin dato"}</b> · Área: <b>{perfil?.area || "Sin dato"}</b>
              </p>
            </div>
            <div className="grid h-14 w-14 place-items-center rounded-3xl bg-violet-50 text-violet-700">
              <ClipboardList className="h-7 w-7" />
            </div>
          </div>
        </section>

        {pageError && <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">{pageError}</div>}

        {!app ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500">No se encontró esta aplicación para el colaborador.</div>
        ) : (
          <>
            <section className="grid gap-4 min-[1380px]:grid-cols-[minmax(340px,0.95fr)_minmax(520px,1.05fr)] min-[1850px]:grid-cols-[1fr_1.25fr_1fr]">
              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-violet-100 text-2xl font-black text-violet-700">
                    {nombre.split(" ").slice(0, 2).map((p) => p[0]).join("").toUpperCase() || "CO"}
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-slate-950">{nombre}</h2>
                    <p className="text-sm text-slate-500">Documento: {perfil?.cedula || "Sin dato"}</p>
                    <p className="text-sm text-slate-500">Correo: {perfil?.correo || "Sin dato"}</p>
                  </div>
                </div>
              </div>
              <div className="grid min-w-0 grid-cols-2 gap-2 rounded-3xl border border-slate-200 bg-white p-2 text-center shadow-sm md:grid-cols-4 min-[1380px]:grid-cols-4">
                <Kpi label={showFicha ? "Campos requeridos" : conditionalRules.length ? "Ítems requeridos" : "Total preguntas"} value={metricTotal} />
                <Kpi label={showFicha ? "Completados" : "Respondidas"} value={metricAnswered} tone="text-emerald-600" />
                <Kpi label="Pendientes" value={metricPending} tone="text-amber-600" />
                <Kpi label="Avance" value={`${metricProgress}%`} tone="text-violet-700" />
              </div>
              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm min-[1380px]:col-span-2 min-[1850px]:col-span-1">
                <p className="text-sm font-black text-slate-950">Alertas de validación</p>
                <div className="mt-3 space-y-2 text-sm text-slate-600">
                  {metricPending > 0 ? (
                    <p className="flex gap-2">
                      <AlertTriangle className="mt-0.5 h-4 w-4 text-amber-600" />
                      {showFicha ? `Hay ${metricPending} campos obligatorios pendientes.` : `Hay ${metricPending} preguntas pendientes.`}
                    </p>
                  ) : (
                    <p className="flex gap-2">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-600" />
                      {showFicha ? "Los datos generales requeridos están completos." : "Todas las preguntas están respondidas."}
                    </p>
                  )}
                  {selectedEval?.estado_respuestas === "calculada" && (
                    <p className="flex gap-2">
                      <AlertTriangle className="mt-0.5 h-4 w-4 text-red-600" /> Este instrumento ya tiene cálculo y no admite cambios.
                    </p>
                  )}
                  {siblingStarted && ["PSICO_INTRA_A", "PSICO_INTRA_B"].includes(selectedCode) && (
                    <p className="flex gap-2">
                      <FileLock2 className="mt-0.5 h-4 w-4 text-violet-700" /> La forma intralaboral alternativa quedó bloqueada por consistencia de la batería.
                    </p>
                  )}
                </div>
              </div>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white shadow-sm">
              <div className="flex overflow-x-auto border-b border-slate-200 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {app.evaluaciones.map((ev) => {
                  const meta = getEvalMeta(ev);
                  const active = !showFicha && selectedEval?.evaluacion_id === ev.evaluacion_id;
                  return (
                    <button
                      key={ev.evaluacion_id}
                      onClick={() => { if (!meta.blockedBySibling) { setSelectedEval(ev); setShowFicha(false); } }}
                      disabled={meta.blockedBySibling}
                      className={`flex shrink-0 items-center gap-2 px-5 py-4 text-sm font-black transition ${
                        active
                          ? "border-b-4 border-violet-700 bg-violet-50/60 text-violet-700"
                          : meta.blockedBySibling
                            ? "cursor-not-allowed text-slate-300"
                            : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                      }`}
                    >
                      <FileText className="h-4 w-4" /> {instrumentLabel(ev.instrument_code)}
                      {meta.blockedBySibling && <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-black text-slate-500">Bloqueada</span>}
                    </button>
                  );
                })}
                <button
                  type="button"
                  onClick={() => setShowFicha(true)}
                  className={`flex shrink-0 items-center gap-2 px-5 py-4 text-sm font-black transition ${showFicha ? "border-b-4 border-violet-700 bg-violet-50/60 text-violet-700" : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"}`}
                >
                  <FileText className="h-4 w-4" /> Datos generales
                  {fichaCompleta ? <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-black text-emerald-700">Completa</span> : <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-black text-amber-700">Pendiente</span>}
                </button>
              </div>

              {showFicha ? (
                <FichaSociodemograficaPanel ficha={ficha} setFicha={setFicha} saving={saving} completa={fichaCompleta} onSave={() => void executeSaveFicha(false)} onFinalize={() => void executeSaveFicha(true)} />
              ) : (
              <div className="grid gap-5 p-4 md:p-5 min-[1500px]:grid-cols-[minmax(0,1fr)_300px] min-[1900px]:grid-cols-[240px_minmax(0,1fr)_300px]">
                <aside className="hidden space-y-2 min-[1900px]:block">
                  {sections.length === 0 ? (
                    <div className="rounded-2xl border border-dashed p-4 text-sm text-slate-500">Sin secciones cargadas.</div>
                  ) : (
                    sections.map((s) => (
                      <div key={s.name} className="rounded-2xl border border-slate-200 bg-white p-3 transition hover:border-violet-200">
                        <div className="flex items-center justify-between gap-2">
                          <span className="line-clamp-2 text-sm font-bold text-slate-700">{s.name}</span>
                          <span className="rounded-full bg-violet-50 px-2 py-1 text-xs font-black text-violet-700">{s.answered}/{s.total}</span>
                        </div>
                        <div className="mt-2 h-2 rounded-full bg-slate-100">
                          <div className="h-2 rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-500" style={{ width: `${pct(s.answered, s.total)}%` }} />
                        </div>
                      </div>
                    ))
                  )}
                </aside>

                <div className="min-w-0 rounded-3xl border border-slate-200 bg-slate-50 p-4 md:p-5">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-black text-slate-950">{selectedEval ? instrumentLabel(selectedEval.instrument_code) : "Instrumento"}</h2>
                      <p className="mt-1 text-sm text-slate-500">Completa la batería antes de finalizar el instrumento.</p>
                    </div>
                    {loadingQuestions && <span className="text-sm text-slate-500"><Loader2 className="mr-2 inline h-4 w-4 animate-spin" />Cargando</span>}
                  </div>
                  {selectedLocked && (
                    <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                      {appClosed
                        ? "Esta aplicación ya fue cerrada/calculada. Solo puedes revisar instrumentos con respuestas registradas; no se permite capturar instrumentos pendientes."
                        : "Este instrumento ya fue finalizado o calculado. Puedes revisar las respuestas, pero no modificarlas."}
                    </div>
                  )}
                  <div className="space-y-3">
                    {topConditionalRules.map((rule) => renderConditionalBlock(rule))}
                    {baseQuestionsForRender.map((p) => (
                      <div key={p.pregunta_id} className="space-y-3">
                        <QuestionRow
                          pregunta={p}
                          value={answers[p.pregunta_id] || ""}
                          disabled={selectedLocked}
                          onChange={(value) => setAnswers((prev) => ({ ...prev, [p.pregunta_id]: value }))}
                        />
                        {conditionalRules
                          .filter((rule) => conditionalPlacementByCode[rule.codigo] === Number(p.pregunta_id))
                          .map((rule) => renderConditionalBlock(rule))}
                      </div>
                    ))}
                  </div>
                </div>

                <aside className="space-y-4 min-[1500px]:sticky min-[1500px]:top-5 min-[1500px]:self-start">
                  <div className="rounded-3xl border border-slate-200 bg-white p-4">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="font-black text-slate-950">Observaciones</h3>
                      <span className="text-xs font-semibold text-slate-400">{observaciones.length}/500</span>
                    </div>
                    <textarea
                      value={observaciones}
                      onChange={(e) => setObservaciones(e.target.value.slice(0, 500))}
                      maxLength={500}
                      disabled={selectedLocked}
                      placeholder="Observación técnica del digitador o psicólogo..."
                      className="mt-3 min-h-36 w-full resize-none rounded-2xl border border-slate-200 p-3 text-sm outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-100 disabled:bg-slate-50"
                    />
                  </div>

                  <div className="rounded-3xl border border-violet-100 bg-violet-50 p-4">
                    <h3 className="font-black text-violet-950">Resumen por batería</h3>
                    <div className="mt-3 space-y-2">
                      {app.evaluaciones.map((ev) => (
                        <div key={`mini-${ev.evaluacion_id}`} className="flex items-center justify-between gap-3 rounded-2xl bg-white/70 px-3 py-2 text-sm">
                          <span>{instrumentLabel(ev.instrument_code)}</span>
                          <b>{batterySummaryProgress(ev, selectedEval?.evaluacion_id, instrumentProgress)}%</b>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <h3 className="font-black text-slate-950">Acciones de captura</h3>
                        <p className="mt-1 text-sm text-slate-500">Mantén el avance seguro con guardado manual o finaliza cuando todo esté completo.</p>
                      </div>
                    </div>
                    <div className="mt-4 grid gap-3">
                      <button
                        type="button"
                        onClick={() => void executeSave(false)}
                        disabled={saving || !selectedEval || selectedLocked}
                        className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3.5 text-sm font-black text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                      >
                        <Save className="h-4 w-4" /> Guardar borrador
                      </button>
                      <button
                        type="button"
                        onClick={requestFinalize}
                        disabled={saving || !selectedEval || selectedLocked}
                        className="inline-flex items-center justify-center gap-2 rounded-2xl bg-violet-700 px-5 py-3.5 text-sm font-black text-white shadow-lg shadow-violet-200 transition hover:bg-violet-800 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500 disabled:shadow-none"
                      >
                        <ShieldCheck className="h-4 w-4" /> Finalizar instrumento
                      </button>
                    </div>
                    <div className="mt-4 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
                      <p className="font-semibold text-slate-700">Avance actual: {progress}%</p>
                      <p className="mt-1">Las respuestas también se respaldan localmente si la sesión vence antes de guardar.</p>
                    </div>
                  </div>
                </aside>
              </div>
              )}
            </section>
          </>
        )}
      </div>
    </main>
  );
}

function readDraft(key: string): { answers?: Record<number, string>; conditionalAnswers?: Record<string, boolean | null>; observaciones?: string } | null {
  try {
    const raw = sessionStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function Kpi({ label, value, tone = "text-slate-950" }: { label: string; value: number | string; tone?: string }) {
  return (
    <div className="min-w-0 rounded-2xl bg-slate-50/70 p-3 text-center sm:p-4">
      <p className="mx-auto min-h-[2rem] max-w-[8rem] text-[11px] font-extrabold leading-tight text-slate-500 sm:text-xs">{label}</p>
      <p className={`mt-1 truncate text-2xl font-black leading-none tracking-tight sm:text-3xl ${tone}`}>{value}</p>
    </div>
  );
}

function ConditionalQuestionBlock({
  rule,
  value,
  blockQuestions,
  answers,
  disabled,
  open,
  onToggleOpen,
  onGateChange,
  onAnswerChange,
}: {
  rule: CondicionalRespuesta;
  value: boolean | null;
  blockQuestions: PreguntaRespuesta[];
  answers: Record<number, string>;
  disabled?: boolean;
  open: boolean;
  onToggleOpen: () => void;
  onGateChange: (value: boolean) => void;
  onAnswerChange: (preguntaId: number, value: string) => void;
}) {
  const active = value === true;
  const inactive = value === false;
  return (
    <div className="rounded-[24px] border border-violet-200 bg-white p-3 shadow-sm sm:p-4">
      <div className="grid gap-3 min-[1500px]:grid-cols-[minmax(260px,1fr)_minmax(260px,360px)] min-[1500px]:items-center">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-violet-50 text-violet-700">
            <UsersRound className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p className="text-[15px] font-black leading-snug text-slate-900 sm:text-base">{rule.label || "Pregunta condicional"}</p>
            <p className="mt-1 text-xs font-bold text-violet-600">Pregunta condicional</p>
          </div>
        </div>
        <div className="flex min-w-0 justify-start min-[1500px]:justify-end">
          <button
            type="button"
            role="switch"
            aria-checked={active}
            aria-label={rule.label || "Pregunta condicional"}
            disabled={disabled}
            onClick={() => onGateChange(!active)}
            className={`relative inline-flex h-11 w-40 shrink-0 items-center rounded-full border p-1 text-xs font-black transition ${
              active
                ? "border-violet-700 bg-violet-700 text-white shadow-sm shadow-violet-200"
                : disabled
                  ? "border-slate-200 bg-slate-100 text-slate-400"
                  : "border-slate-200 bg-slate-100 text-slate-600 hover:border-violet-300 hover:bg-violet-50"
            } ${disabled ? "cursor-not-allowed" : ""}`}
          >
            <span className={`z-10 flex-1 text-center transition ${inactive ? "text-slate-900" : active ? "text-violet-100" : ""}`}>No</span>
            <span className={`z-10 flex-1 text-center transition ${active ? "text-white" : "text-slate-500"}`}>Sí</span>
            <span
              aria-hidden="true"
              className={`absolute left-1 top-1 h-9 w-[4.75rem] rounded-full bg-white shadow-sm transition-transform ${
                active ? "translate-x-[4.75rem]" : "translate-x-0"
              }`}
            />
          </button>
        </div>
      </div>

      {inactive && (
        <div className="mt-3 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
          Este bloque queda marcado como no aplicable.
        </div>
      )}

      {active && (
        <div className="mt-3 rounded-3xl border border-violet-100 bg-violet-50/70 p-3">
          <button
            type="button"
            onClick={onToggleOpen}
            className="flex w-full items-center justify-between gap-3 rounded-2xl bg-white px-4 py-3 text-left text-sm font-black text-violet-800 shadow-sm"
          >
            <span>Se habilitan preguntas condicionales</span>
            <ChevronDown className={`h-4 w-4 shrink-0 transition ${open ? "rotate-180" : ""}`} />
          </button>
          {open && (
            <div className="mt-3 space-y-3">
              {blockQuestions.map((p) => (
                <QuestionRow
                  key={p.pregunta_id}
                  pregunta={p}
                  value={answers[p.pregunta_id] || ""}
                  disabled={disabled}
                  onChange={(next) => onAnswerChange(p.pregunta_id, next)}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

type CatalogosSocio = {
  estado_civil: string[];
  nivel_estudios: string[];
  tipo_vivienda: string[];
  tipo_cargo: string[];
  tipo_contrato: string[];
  tipo_salario: string[];
};

const FALLBACK_CATALOGOS: CatalogosSocio = {
  estado_civil: ["Soltero(a)", "Casado(a)", "Unión libre", "Separado(a)", "Divorciado(a)", "Viudo(a)", "Sacerdote / Monja"],
  nivel_estudios: [
    "Ninguno", "Primaria incompleta", "Primaria completa", "Bachillerato incompleto", "Bachillerato completo",
    "Técnico / tecnológico incompleto", "Técnico / tecnológico completo", "Profesional incompleto", "Profesional completo",
    "Carrera militar / policía", "Post-grado incompleto", "Post-grado completo",
  ],
  tipo_vivienda: ["Propia", "En arriendo", "Familiar"],
  tipo_cargo: [
    "Jefatura - tiene personal a cargo",
    "Profesional, analista, técnico, tecnólogo",
    "Auxiliar, asistente administrativo, asistente técnico",
    "Operario, operador, ayudante, servicios generales",
  ],
  tipo_contrato: ["Temporal de menos de 1 año", "Temporal de 1 año o más", "Término indefinido", "Cooperado (cooperativa)", "Prestación de servicios", "No sé"],
  tipo_salario: ["Fijo (diario, semanal, quincenal o mensual)", "Una parte fija y otra variable", "Todo variable (a destajo, por producción, por comisión)"],
};
const SEXO_OPTIONS = ["Masculino", "Femenino"];
const ESTRATO_OPTIONS = ["1", "2", "3", "4", "5", "6", "Finca", "No sé"];
const CURRENT_YEAR = new Date().getFullYear();

function normalizeOptions(fallback: string[], remote?: Array<{ nombre?: string }>) {
  const remoteValues = (remote || []).map((x) => String(x.nombre || "").trim()).filter(Boolean);
  // El orden normativo del formulario oficial manda. Las opciones remotas solo agregan valores faltantes.
  return Array.from(new Set([...fallback, ...remoteValues]));
}
function fichaEdad(anio?: number | null) {
  return anio ? Math.max(CURRENT_YEAR - Number(anio), 0) : "";
}
function fichaMissing(ficha: FichaSociodemografica) {
  const required: Array<[keyof FichaSociodemografica, string]> = [
    ["sexo", "Sexo"], ["anio_nacimiento", "Año de nacimiento"], ["estado_civil", "Estado civil"], ["nivel_estudios", "Nivel de estudios"],
    ["ocupacion_profesion", "Ocupación / profesión"], ["ciudad_residencia", "Ciudad de residencia"], ["estrato", "Estrato"], ["tipo_vivienda", "Tipo de vivienda"],
    ["personas_dependen", "Personas dependientes"], ["ciudad_trabajo", "Ciudad donde trabaja"], ["cargo", "Nombre del cargo"], ["tipo_cargo", "Tipo de cargo"],
    ["antiguedad_empresa", "Antigüedad en la empresa"], ["antiguedad_cargo", "Antigüedad en el cargo"], ["area", "Área / sección"], ["tipo_contrato", "Tipo de contrato"],
    ["horas_diarias_trabajo", "Horas diarias"], ["tipo_salario", "Tipo de salario"],
  ];
  return required.filter(([key]) => {
    const value = ficha[key];
    return value === null || value === undefined || String(value).trim() === "";
  }).map(([, label]) => label);
}

function FichaSociodemograficaPanel({ ficha, setFicha, saving, completa, onSave, onFinalize }: { ficha: FichaSociodemografica; setFicha: (value: FichaSociodemografica | ((prev: FichaSociodemografica) => FichaSociodemografica)) => void; saving: boolean; completa: boolean; onSave: () => void; onFinalize: () => void }) {
  const [catalogos, setCatalogos] = useState<CatalogosSocio>(FALLBACK_CATALOGOS);
  const [resQuery, setResQuery] = useState(String(ficha.ciudad_residencia || ""));
  const [trabQuery, setTrabQuery] = useState(String(ficha.ciudad_trabajo || ""));
  const [resOptions, setResOptions] = useState<Array<{ municipio: string; departamento?: string | null }>>([]);
  const [trabOptions, setTrabOptions] = useState<Array<{ municipio: string; departamento?: string | null }>>([]);
  const missing = useMemo(() => fichaMissing(ficha), [ficha]);
  const update = (key: keyof FichaSociodemografica, value: any) => {
    setFicha((prev) => ({ ...prev, [key]: value }));
  };

  useEffect(() => {
    let alive = true;
    obtenerCatalogosSociodemograficos()
      .then((res) => {
        if (!alive) return;
        setCatalogos({
          estado_civil: normalizeOptions(FALLBACK_CATALOGOS.estado_civil, res.estado_civil),
          nivel_estudios: normalizeOptions(FALLBACK_CATALOGOS.nivel_estudios, res.nivel_estudios),
          tipo_vivienda: normalizeOptions(FALLBACK_CATALOGOS.tipo_vivienda, res.tipo_vivienda),
          tipo_cargo: normalizeOptions(FALLBACK_CATALOGOS.tipo_cargo, res.tipo_cargo),
          tipo_contrato: normalizeOptions(FALLBACK_CATALOGOS.tipo_contrato, res.tipo_contrato),
          tipo_salario: normalizeOptions(FALLBACK_CATALOGOS.tipo_salario, res.tipo_salario),
        });
      })
      .catch(() => setCatalogos(FALLBACK_CATALOGOS));
    return () => { alive = false; };
  }, []);

  useEffect(() => { setResQuery(String(ficha.ciudad_residencia || "")); }, [ficha.ciudad_residencia]);
  useEffect(() => { setTrabQuery(String(ficha.ciudad_trabajo || "")); }, [ficha.ciudad_trabajo]);

  useEffect(() => {
    const query = resQuery.trim();
    const t = window.setTimeout(() => {
      if (query.length < 2) return setResOptions([]);
      buscarMunicipiosPsico(query).then((r) => setResOptions(r.items || [])).catch(() => setResOptions([]));
    }, 280);
    return () => window.clearTimeout(t);
  }, [resQuery]);
  useEffect(() => {
    const query = trabQuery.trim();
    const t = window.setTimeout(() => {
      if (query.length < 2) return setTrabOptions([]);
      buscarMunicipiosPsico(query).then((r) => setTrabOptions(r.items || [])).catch(() => setTrabOptions([]));
    }, 280);
    return () => window.clearTimeout(t);
  }, [trabQuery]);

  const selectMunicipio = (kind: "res" | "trab", item: { municipio: string; departamento?: string | null }) => {
    if (kind === "res") {
      setFicha((prev) => ({ ...prev, ciudad_residencia: item.municipio, departamento_residencia: item.departamento || "" }));
      setResOptions([]);
      setResQuery(item.municipio);
    } else {
      setFicha((prev) => ({ ...prev, ciudad_trabajo: item.municipio, departamento_trabajo: item.departamento || "" }));
      setTrabOptions([]);
      setTrabQuery(item.municipio);
    }
  };

  return (
    <div className="p-5">
      <div className="rounded-3xl border border-violet-100 bg-violet-50/60 p-5">
        <h2 className="text-xl font-black text-slate-950">Ficha de datos generales</h2>
        <p className="mt-1 text-sm text-slate-600">Formulario alineado a la ficha oficial. Los campos de catálogo usan listas controladas para proteger la calidad del dashboard.</p>
      </div>

      {missing.length > 0 && (
        <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          <b>Campos pendientes para finalizar:</b> {missing.slice(0, 8).join(", ")}{missing.length > 8 ? ` y ${missing.length - 8} más.` : "."}
        </div>
      )}
      {completa && (
        <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-800">
          Ficha de datos generales finalizada. La información queda en modo consulta para proteger la integridad de la aplicación.
        </div>
      )}

      <div className="mt-5 grid gap-5">
        <fieldset className="rounded-3xl border border-slate-200 bg-white p-5">
          <legend className="px-2 text-sm font-black text-slate-900">Información personal</legend>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <SelectField disabled={completa} label="Sexo" value={ficha.sexo || ""} options={SEXO_OPTIONS} onChange={(v) => update("sexo", v)} />
            <NumberField disabled={completa} label="Año de nacimiento" value={ficha.anio_nacimiento ?? ""} min={1900} max={CURRENT_YEAR} onChange={(v) => update("anio_nacimiento", v)} />
            <ReadOnlyField label="Edad calculada" value={String(fichaEdad(ficha.anio_nacimiento))} />
            <SelectField disabled={completa} label="Estado civil" value={ficha.estado_civil || ""} options={catalogos.estado_civil} onChange={(v) => update("estado_civil", v)} />
            <SelectField disabled={completa} label="Nivel de estudios" value={ficha.nivel_estudios || ""} options={catalogos.nivel_estudios} onChange={(v) => update("nivel_estudios", v)} />
            <TextField disabled={completa} label="Ocupación / profesión" value={ficha.ocupacion_profesion || ""} onChange={(v) => update("ocupacion_profesion", v)} />
          </div>
        </fieldset>

        <fieldset className="rounded-3xl border border-slate-200 bg-white p-5">
          <legend className="px-2 text-sm font-black text-slate-900">Residencia</legend>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <MunicipioField disabled={completa} label="Ciudad / municipio de residencia" query={resQuery} selectedValue={ficha.ciudad_residencia || ""} setQuery={(v) => { setResQuery(v); if (v !== String(ficha.ciudad_residencia || "")) { update("ciudad_residencia", ""); update("departamento_residencia", ""); } }} options={resOptions} onSelect={(item) => selectMunicipio("res", item)} />
            <ReadOnlyField label="Departamento de residencia" value={ficha.departamento_residencia || ""} />
            <SelectField disabled={completa} label="Estrato" value={String(ficha.estrato || "")} options={ESTRATO_OPTIONS} onChange={(v) => update("estrato", v)} />
            <SelectField disabled={completa} label="Tipo de vivienda" value={ficha.tipo_vivienda || ""} options={catalogos.tipo_vivienda} onChange={(v) => update("tipo_vivienda", v)} />
            <NumberField disabled={completa} label="Personas que dependen económicamente" value={ficha.personas_dependen ?? ""} min={0} max={99} onChange={(v) => update("personas_dependen", v)} />
          </div>
        </fieldset>

        <fieldset className="rounded-3xl border border-slate-200 bg-white p-5">
          <legend className="px-2 text-sm font-black text-slate-900">Información laboral</legend>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <MunicipioField disabled={completa} label="Ciudad / municipio donde trabaja" query={trabQuery} selectedValue={ficha.ciudad_trabajo || ""} setQuery={(v) => { setTrabQuery(v); if (v !== String(ficha.ciudad_trabajo || "")) { update("ciudad_trabajo", ""); update("departamento_trabajo", ""); } }} options={trabOptions} onSelect={(item) => selectMunicipio("trab", item)} />
            <ReadOnlyField label="Departamento donde trabaja" value={ficha.departamento_trabajo || ""} />
            <TextField disabled={completa} label="Nombre del cargo" value={ficha.cargo || ""} onChange={(v) => update("cargo", v)} />
            <SelectField disabled={completa} label="Tipo de cargo" value={ficha.tipo_cargo || ""} options={catalogos.tipo_cargo} onChange={(v) => update("tipo_cargo", v)} />
            <TextField disabled={completa} label="Área / departamento / sección" value={ficha.area || ""} onChange={(v) => update("area", v)} />
            <NumberField disabled={completa} label="Antigüedad en la empresa (años)" value={ficha.antiguedad_empresa ?? ""} min={0} max={80} onChange={(v) => update("antiguedad_empresa", v === null ? "" : String(v))} />
            <NumberField disabled={completa} label="Antigüedad en el cargo (años)" value={ficha.antiguedad_cargo ?? ""} min={0} max={80} onChange={(v) => update("antiguedad_cargo", v === null ? "" : String(v))} />
            <SelectField disabled={completa} label="Tipo de contrato" value={ficha.tipo_contrato || ""} options={catalogos.tipo_contrato} onChange={(v) => update("tipo_contrato", v)} />
            <NumberField disabled={completa} label="Horas diarias de trabajo" value={ficha.horas_diarias_trabajo ?? ""} min={1} max={24} onChange={(v) => update("horas_diarias_trabajo", v)} />
            <SelectField disabled={completa} label="Tipo de salario" value={ficha.tipo_salario || ""} options={catalogos.tipo_salario} onChange={(v) => update("tipo_salario", v)} />
          </div>
        </fieldset>
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-slate-200 bg-white p-4">
        <p className="text-sm text-slate-500">{completa ? "Ficha finalizada. Para modificarla deberá reabrirse la aplicación o habilitarse un flujo de corrección." : "Guardar permite borrador parcial. Finalizar exige todos los campos obligatorios."}</p>
        <div className="flex flex-wrap gap-3">
          <button disabled={saving || completa} type="button" onClick={onSave} className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} {completa ? "Datos guardados" : "Guardar datos"}
          </button>
          <button disabled={saving || completa} type="button" onClick={onFinalize} className="inline-flex items-center gap-2 rounded-2xl bg-violet-700 px-5 py-3 text-sm font-black text-white hover:bg-violet-800 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500 disabled:opacity-100">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />} {completa ? "Ficha finalizada" : "Finalizar datos generales"}
          </button>
        </div>
      </div>
    </div>
  );
}

function fieldBase(disabled = false) { return `w-full rounded-2xl border border-slate-200 px-4 py-3 font-normal outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-100 ${disabled ? "cursor-not-allowed bg-slate-100 text-slate-500" : "bg-white"}`; }
function TextField({ label, value, onChange, disabled = false }: { label: string; value: string; onChange: (v: string) => void; disabled?: boolean }) {
  return <label className="space-y-1 text-sm font-bold text-slate-700">{label}<input disabled={disabled} value={value} onChange={(e) => onChange(e.target.value)} className={fieldBase(disabled)} /></label>;
}
function NumberField({ label, value, min, max, onChange, disabled = false }: { label: string; value: number | string; min?: number; max?: number; onChange: (v: number | null) => void; disabled?: boolean }) {
  return <label className="space-y-1 text-sm font-bold text-slate-700">{label}<input disabled={disabled} type="number" min={min} max={max} value={value} onChange={(e) => onChange(e.target.value === "" ? null : Number(e.target.value))} className={fieldBase(disabled)} /></label>;
}
function SelectField({ label, value, options, onChange, disabled = false }: { label: string; value: string; options: string[]; onChange: (v: string) => void; disabled?: boolean }) {
  const [open, setOpen] = useState(false);
  const display = value || "Selecciona una opción";
  return (
    <div className="relative space-y-1 text-sm font-bold text-slate-700">
      <span>{label}</span>
      <button
        type="button"
        disabled={disabled}
        onClick={() => { if (!disabled) setOpen((v) => !v); }}
        className={`${fieldBase(disabled)} flex min-h-[50px] items-center justify-between gap-3 text-left ${value ? "text-slate-900" : "text-slate-400"}`}
      >
        <span className="truncate">{display}</span>
        <ChevronDown className={`h-4 w-4 shrink-0 text-slate-400 transition ${open ? "rotate-180" : ""}`} />
      </button>
      {open && !disabled && (
        <div className="absolute z-40 mt-2 max-h-72 w-full overflow-auto rounded-2xl border border-slate-200 bg-white p-1.5 shadow-2xl shadow-slate-200/70">
          <button
            type="button"
            onClick={() => { onChange(""); setOpen(false); }}
            className={`block w-full rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition ${!value ? "bg-violet-600 text-white" : "text-slate-500 hover:bg-slate-50"}`}
          >
            Selecciona una opción
          </button>
          {options.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => { onChange(opt); setOpen(false); }}
              className={`block w-full rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition ${value === opt ? "bg-violet-600 text-white" : "text-slate-700 hover:bg-violet-50 hover:text-violet-800"}`}
            >
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return <label className="space-y-1 text-sm font-bold text-slate-700">{label}<input value={value} readOnly className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-normal text-slate-500 outline-none" /></label>;
}
function MunicipioField({ label, query, selectedValue, setQuery, options, onSelect, disabled = false }: { label: string; query: string; selectedValue?: string; setQuery: (v: string) => void; options: Array<{ municipio: string; departamento?: string | null }>; onSelect: (item: { municipio: string; departamento?: string | null }) => void; disabled?: boolean }) {
  const [open, setOpen] = useState(false);
  const [touched, setTouched] = useState(false);
  const normalizedQuery = query.trim().toLowerCase();
  const normalizedSelected = String(selectedValue || "").trim().toLowerCase();
  const showPanel = !disabled && open && query.trim().length >= 2 && normalizedQuery !== normalizedSelected;
  return (
    <label className="relative space-y-1 text-sm font-bold text-slate-700">
      {label}
      <input
        disabled={disabled}
        value={query}
        onFocus={() => { if (!disabled) setOpen(true); }}
        onBlur={() => window.setTimeout(() => setOpen(false), 120)}
        onChange={(e) => { if (disabled) return; setTouched(true); setOpen(true); setQuery(e.target.value); }}
        onKeyDown={(e) => { if (e.key === "Escape") setOpen(false); }}
        placeholder="Escribe mínimo 2 letras…"
        className={fieldBase(disabled)}
        autoComplete="off"
      />
      {showPanel && (
        <div className="absolute z-30 mt-2 max-h-64 w-full overflow-auto rounded-2xl border border-slate-200 bg-white p-1.5 shadow-2xl shadow-slate-200/70">
          {options.length > 0 ? (
            options.map((item) => (
              <button
                key={`${item.municipio}-${item.departamento}`}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => { onSelect(item); setOpen(false); setTouched(false); }}
                className="block w-full rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-slate-700 transition hover:bg-violet-50 hover:text-violet-800"
              >
                {item.municipio} <span className="font-normal text-slate-500">{item.departamento ? `· ${item.departamento}` : ""}</span>
              </button>
            ))
          ) : touched ? (
            <div className="rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-500">
              Sin coincidencias. Verifica que el catálogo de municipios esté cargado o intenta con tilde/sin tilde.
            </div>
          ) : null}
        </div>
      )}
    </label>
  );
}

function QuestionRow({
  pregunta,
  value,
  onChange,
  disabled,
}: {
  pregunta: PreguntaRespuesta;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  return (
    <div className="rounded-[24px] border border-slate-200 bg-white p-3 shadow-sm transition hover:border-violet-200 sm:p-4">
      <div className="grid gap-3 min-[1500px]:grid-cols-[minmax(260px,1fr)_minmax(430px,500px)] min-[1500px]:items-center">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-violet-50 text-sm font-black text-violet-700">{pregunta.orden}</span>
          <p className="min-w-0 text-[15px] font-bold leading-snug text-slate-800 sm:text-base min-[1500px]:pr-2">{pregunta.texto}</p>
        </div>
        <div className="grid min-w-0 grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5 min-[1500px]:grid-cols-5">
          {LIKERT.map((opt) => (
            <button
              key={opt}
              type="button"
              disabled={disabled}
              onClick={() => onChange(opt)}
              className={`min-h-9 min-w-0 overflow-hidden rounded-xl border px-2 py-1.5 text-[12px] font-black leading-tight transition sm:text-[13px] ${
                value === opt
                  ? disabled
                    ? "border-violet-300 bg-violet-100 text-violet-900 shadow-inner"
                    : "border-violet-700 bg-violet-700 text-white shadow-sm"
                  : disabled
                    ? "border-slate-200 bg-slate-100 text-slate-400"
                    : "border-slate-200 bg-white text-slate-700 hover:border-violet-300 hover:bg-violet-50"
              } ${disabled ? "cursor-not-allowed" : ""}`}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
