import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  ClipboardList,
  FileLock2,
  FileText,
  Loader2,
  Save,
  ShieldCheck,
} from "lucide-react";
import {
  guardarRespuestasPsicoEmpleado,
  obtenerPerfilPsicoEmpleado,
  obtenerRespuestasPsicoEmpleado,
  type PreguntaRespuesta,
  type PsicoAplicacionEmpleado,
  type PsicoEmpleadoPerfil,
  type PsicoEvaluacionEmpleado,
} from "@/features/psicosocial/api/psicoEmpleadoService";
import { AbrilApiError } from "@/features/psicosocial/api/httpClient";
import { ConfirmDialog } from "@/components/feedback/ConfirmDialog";
import { ToastCard, type ToastPayload } from "@/components/feedback/ToastCard";

const LIKERT = ["Siempre", "Casi siempre", "Algunas veces", "Casi nunca", "Nunca"];

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
function dimensionOf(p: PreguntaRespuesta) {
  const params = parseParams(p.parametros);
  return String(
    p.dimension_label || params.dimension_label || prettyDimension(p.dimension_code || params.dimension_code || params.dimension || "Preguntas"),
  );
}
function pct(a: number, b: number) {
  return b > 0 ? Math.round((a * 1000) / b) / 10 : 0;
}
function statusTone(status?: string | null) {
  const value = String(status || "").toLowerCase();
  if (["finalizada", "calculada", "completa"].includes(value)) return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (["borrador"].includes(value)) return "bg-violet-50 text-violet-700 border-violet-200";
  return "bg-slate-50 text-slate-600 border-slate-200";
}
function isStarted(ev?: PsicoEvaluacionEmpleado | null) {
  if (!ev) return false;
  return Number(ev.respondidas || 0) > 0 || ["borrador", "finalizada", "calculada", "completa"].includes(String(ev.estado_respuestas || "").toLowerCase());
}

export default function PsicoEmpleadoRespuestasPage() {
  const { empleadoId = "", aplicacionId = "" } = useParams();
  const navigate = useNavigate();
  const [perfil, setPerfil] = useState<PsicoEmpleadoPerfil | null>(null);
  const [app, setApp] = useState<PsicoAplicacionEmpleado | null>(null);
  const [selectedEval, setSelectedEval] = useState<PsicoEvaluacionEmpleado | null>(null);
  const [preguntas, setPreguntas] = useState<PreguntaRespuesta[]>([]);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [observaciones, setObservaciones] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastPayload | null>(null);
  const [confirmFinalize, setConfirmFinalize] = useState(false);

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
    const nextSelected =
      selected?.evaluaciones?.find((e) => e.evaluacion_id === preferredEvalId) ||
      selected?.evaluaciones?.find((e) => e.editable && String(e.instrument_code).includes("INTRA")) ||
      selected?.evaluaciones?.find((e) => e.editable) ||
      selected?.evaluaciones?.[0] ||
      null;
    setSelectedEval(nextSelected);
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
  }, [navigate, answers, observaciones, draftKey]);

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
        const preferred =
          selected?.evaluaciones?.find((e) => e.editable && String(e.instrument_code).includes("INTRA")) ||
          selected?.evaluaciones?.find((e) => e.editable) ||
          selected?.evaluaciones?.[0] ||
          null;
        setSelectedEval(preferred);
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
    async function loadQuestions() {
      if (!empleadoId || !selectedEval?.evaluacion_id) return;
      setLoadingQuestions(true);
      setPageError(null);
      try {
        const res = await obtenerRespuestasPsicoEmpleado(empleadoId, selectedEval.evaluacion_id);
        if (!mounted) return;
        setPreguntas(res.preguntas || []);
        const serverAnswers: Record<number, string> = {};
        for (const p of res.preguntas || []) if (p.respuesta) serverAnswers[p.pregunta_id] = String(p.respuesta);
        const local = readDraft(`abril360:capture-draft:${empleadoId}:${aplicacionId}:${selectedEval.evaluacion_id}`);
        setAnswers({ ...serverAnswers, ...(local?.answers || {}) });
        setObservaciones(String(local?.observaciones ?? res.observaciones ?? ""));
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

  function persistDraft() {
    if (!selectedEval) return;
    try {
      sessionStorage.setItem(draftKey, JSON.stringify({ answers, observaciones, updatedAt: new Date().toISOString() }));
    } catch {}
  }
  useEffect(() => {
    const t = window.setTimeout(() => persistDraft(), 450);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [answers, observaciones, draftKey]);

  const answered = useMemo(() => Object.values(answers).filter(Boolean).length, [answers]);
  const total = preguntas.length;
  const pending = Math.max(total - answered, 0);
  const progress = pct(answered, total);
  const sections = useMemo(() => {
    const map = new Map<string, { name: string; total: number; answered: number }>();
    for (const p of preguntas) {
      const name = dimensionOf(p);
      const current = map.get(name) || { name, total: 0, answered: 0 };
      current.total += 1;
      if (answers[p.pregunta_id]) current.answered += 1;
      map.set(name, current);
    }
    return Array.from(map.values());
  }, [preguntas, answers]);
  const pendingPreview = useMemo(() => {
    const missing = preguntas.filter((p) => !answers[p.pregunta_id]).map((p) => `Pregunta ${p.orden} · ${dimensionOf(p)}`);
    return { details: missing.slice(0, 4), moreCount: Math.max(missing.length - 4, 0) };
  }, [preguntas, answers]);

  const selectedLocked = !selectedEval?.editable || ["finalizada", "calculada"].includes(String(selectedEval?.estado_respuestas || "").toLowerCase());
  const selectedCode = String(selectedEval?.instrument_code || "");
  const siblingStarted = useMemo(() => {
    if (!app || !["PSICO_INTRA_A", "PSICO_INTRA_B"].includes(selectedCode)) return false;
    const siblingCode = selectedCode === "PSICO_INTRA_A" ? "PSICO_INTRA_B" : "PSICO_INTRA_A";
    const sibling = app.evaluaciones.find((ev) => ev.instrument_code === siblingCode);
    return isStarted(sibling);
  }, [app, selectedCode]);

  const getEvalMeta = (ev: PsicoEvaluacionEmpleado) => {
    const isIntra = ["PSICO_INTRA_A", "PSICO_INTRA_B"].includes(String(ev.instrument_code || ""));
    const siblingCode = ev.instrument_code === "PSICO_INTRA_A" ? "PSICO_INTRA_B" : ev.instrument_code === "PSICO_INTRA_B" ? "PSICO_INTRA_A" : null;
    const sibling = siblingCode ? app?.evaluaciones.find((item) => item.instrument_code === siblingCode) : null;
    const blockedBySibling = Boolean(isIntra && sibling && isStarted(sibling) && !isStarted(ev));
    return { blockedBySibling };
  };

  async function executeSave(finalizar = false) {
    if (!selectedEval || selectedLocked) return;
    persistDraft();
    setSaving(true);
    setPageError(null);
    try {
      const payload = preguntas.map((p) => ({ pregunta_id: p.pregunta_id, orden: p.orden, respuesta: answers[p.pregunta_id] || null }));
      const res = await guardarRespuestasPsicoEmpleado(empleadoId, selectedEval.evaluacion_id, payload, finalizar, observaciones);
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

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 p-8 text-slate-500">
        <Loader2 className="mr-2 inline h-5 w-5 animate-spin" /> Cargando registro...
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
            <section className="grid gap-4 lg:grid-cols-[1fr_1.35fr_1fr]">
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
              <div className="grid grid-cols-4 overflow-hidden rounded-3xl border border-slate-200 bg-white text-center shadow-sm">
                <Kpi label="Total preguntas" value={total} />
                <Kpi label="Respondidas" value={answered} tone="text-emerald-600" />
                <Kpi label="Pendientes" value={pending} tone="text-amber-600" />
                <Kpi label="Avance" value={`${progress}%`} tone="text-violet-700" />
              </div>
              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-sm font-black text-slate-950">Alertas de validación</p>
                <div className="mt-3 space-y-2 text-sm text-slate-600">
                  {pending > 0 ? (
                    <p className="flex gap-2">
                      <AlertTriangle className="mt-0.5 h-4 w-4 text-amber-600" /> Hay {pending} preguntas pendientes.
                    </p>
                  ) : (
                    <p className="flex gap-2">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-600" /> Todas las preguntas están respondidas.
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
              <div className="flex flex-wrap border-b border-slate-200">
                {app.evaluaciones.map((ev) => {
                  const meta = getEvalMeta(ev);
                  const active = selectedEval?.evaluacion_id === ev.evaluacion_id;
                  return (
                    <button
                      key={ev.evaluacion_id}
                      onClick={() => !meta.blockedBySibling && setSelectedEval(ev)}
                      disabled={meta.blockedBySibling}
                      className={`flex items-center gap-2 px-5 py-4 text-sm font-black transition ${
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
              </div>

              <div className="grid gap-5 p-5 xl:grid-cols-[260px_1fr_320px]">
                <aside className="space-y-2">
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

                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 md:p-5">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-black text-slate-950">{selectedEval ? instrumentLabel(selectedEval.instrument_code) : "Instrumento"}</h2>
                      <p className="mt-1 text-sm text-slate-500">Completa la batería antes de finalizar el instrumento.</p>
                    </div>
                    {loadingQuestions && <span className="text-sm text-slate-500"><Loader2 className="mr-2 inline h-4 w-4 animate-spin" />Cargando</span>}
                  </div>
                  {selectedLocked && (
                    <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                      Este instrumento ya fue finalizado o calculado. Puedes revisar las respuestas, pero no modificarlas.
                    </div>
                  )}
                  <div className="space-y-3">
                    {preguntas.map((p) => (
                      <QuestionRow
                        key={p.pregunta_id}
                        pregunta={p}
                        value={answers[p.pregunta_id] || ""}
                        disabled={selectedLocked}
                        onChange={(value) => setAnswers((prev) => ({ ...prev, [p.pregunta_id]: value }))}
                      />
                    ))}
                  </div>
                </div>

                <aside className="space-y-4 xl:sticky xl:top-5 xl:self-start">
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
                          <b>{pct(ev.respondidas, ev.total_preguntas)}%</b>
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
            </section>
          </>
        )}
      </div>
    </main>
  );
}

function readDraft(key: string): { answers?: Record<number, string>; observaciones?: string } | null {
  try {
    const raw = sessionStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function Kpi({ label, value, tone = "text-slate-950" }: { label: string; value: number | string; tone?: string }) {
  return (
    <div className="border-r border-slate-200 p-5 last:border-r-0">
      <p className="text-xs font-bold text-slate-500">{label}</p>
      <p className={`mt-2 text-3xl font-black ${tone}`}>{value}</p>
    </div>
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
    <div className="rounded-[22px] border border-slate-200 bg-white p-3 shadow-sm">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-sm font-black text-violet-700">{pregunta.orden}</span>
          <p className="text-sm font-semibold leading-snug text-slate-700">{pregunta.texto}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {LIKERT.map((opt) => (
            <button
              key={opt}
              type="button"
              disabled={disabled}
              onClick={() => onChange(opt)}
              className={`rounded-xl border px-3 py-2 text-xs font-black transition ${
                value === opt
                  ? "border-violet-700 bg-violet-700 text-white shadow-sm"
                  : "border-slate-200 bg-white text-slate-600 hover:border-violet-300"
              } disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400`}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
