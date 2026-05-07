import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, BarChart3, CheckCircle2, ClipboardCheck, Coins, FilePenLine, FileText, Loader2, Lock, RotateCcw, Search, ShieldCheck, Users, XCircle } from "lucide-react";
import { AplicacionDetalle, psicoAdminService } from "@/features/psicosocial/api/psicoAdminService";
import { ToastCard, type ToastPayload } from "@/components/feedback/ToastCard";
import { ConfirmDialog } from "@/components/feedback/ConfirmDialog";

function instrumentLabel(code: string) {
  return ({ PSICO_INTRA_A: "Forma A", PSICO_INTRA_B: "Forma B", PSICO_EXTRA: "Extralaboral", PSICO_ESTRES: "Estrés" } as Record<string, string>)[code] || code;
}
function fmtDate(value?: string) {
  if (!value) return "Sin fecha";
  try {
    return new Date(value).toLocaleDateString("es-CO");
  } catch {
    return value;
  }
}
function isFinalizada(estado?: string | null) {
  return String(estado || "").toLowerCase().includes("final");
}

export default function AplicacionDetallePage() {
  const { empresaId = "", aplicacionId = "" } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState<AplicacionDetalle | null>(null);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [closing, setClosing] = useState(false);
  const [confirmClose, setConfirmClose] = useState(false);
  const [confirmReopen, setConfirmReopen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastPayload | null>(null);
  const [calcStartedAt, setCalcStartedAt] = useState<number | null>(null);
  const [calcElapsed, setCalcElapsed] = useState(0);

  const notify = (payload: Omit<ToastPayload, "id">) => {
    const id = Date.now();
    setToast({ id, ...payload });
    window.setTimeout(() => setToast((t) => (t?.id === id ? null : t)), 5200);
  };

  const load = async () => {
    if (!empresaId || !aplicacionId) return;
    setLoading(true);
    setError(null);
    try {
      setData(await psicoAdminService.detalleAplicacion(empresaId, Number(aplicacionId)));
    } catch (e: any) {
      setError(e?.message || "No fue posible cargar el detalle de la aplicación.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [empresaId, aplicacionId]);

  useEffect(() => {
    const onExpired = () => {
      notify({
        type: "warning",
        title: "Sesión vencida",
        message: "Te redirigiremos al login para continuar con seguridad.",
      });
      window.setTimeout(() => navigate(`/login?next=${encodeURIComponent(window.location.pathname)}`), 1500);
    };
    window.addEventListener("abril360:session-expired", onExpired);
    return () => window.removeEventListener("abril360:session-expired", onExpired);
  }, [navigate]);



  useEffect(() => {
    if (!closing || !calcStartedAt) return;
    const timer = window.setInterval(() => {
      setCalcElapsed(Math.max(0, Math.floor((Date.now() - calcStartedAt) / 1000)));
    }, 500);
    return () => window.clearInterval(timer);
  }, [closing, calcStartedAt]);

  const calcProgress = closing ? Math.min(96, Math.max(8, Math.round((calcElapsed / 90) * 100))) : 0;
  const calcStage = !closing
    ? ""
    : calcElapsed < 8
      ? "Preparando cierre y validando completitud..."
      : calcElapsed < 25
        ? "Sincronizando respuestas y hechos analíticos..."
        : calcElapsed < 60
          ? "Calculando puntajes transformados y niveles de riesgo..."
          : "Consolidando resultados, dominios, dimensiones e informes...";

  const empleados = useMemo(() => {
    const term = q.trim().toLowerCase();
    const rows = data?.empleados || [];
    if (!term) return rows;
    return rows.filter((e) => `${e.cedula} ${e.nombre} ${e.area} ${e.cargo} ${e.email}`.toLowerCase().includes(term));
  }, [data, q]);

  const finalizada = isFinalizada(data?.aplicacion?.estado);
  const canOpenParticipant = (emp: any) => !finalizada || Boolean(emp.registrado || emp.completo || (emp.instrumentos_registrados || []).length > 0);

  async function cerrarAplicacion() {
    if (!data || !empresaId || !aplicacionId) return;
    const completos = Number(data.resumen.participantes_completos || 0);
    if (completos < 1) {
      notify({
        type: "warning",
        title: "No se puede cerrar todavía",
        message: "Debe existir al menos un participante con la batería completa para habilitar el cálculo.",
      });
      return;
    }
    setConfirmClose(true);
  }

  async function confirmReabrirAplicacion() {
    if (!empresaId || !aplicacionId) return;
    setConfirmReopen(false);
    setClosing(true);
    setCalcStartedAt(Date.now());
    setCalcElapsed(0);
    try {
      await psicoAdminService.reabrirAplicacion(empresaId, Number(aplicacionId), {
        motivo: "Corrección de respuestas y reprocesamiento",
        consumir_credito: true,
      });
      notify({ type: "success", title: "Aplicación reabierta", message: "Se registró el reproceso. Al cerrar nuevamente podrá consumirse un crédito adicional." });
      await load();
    } catch (e: any) {
      notify({ type: "error", title: "No fue posible reabrir", message: e?.message || "Intenta nuevamente." });
    } finally {
      setClosing(false);
      setCalcStartedAt(null);
      setCalcElapsed(0);
    }
  }

  async function confirmCerrarAplicacion() {
    if (!empresaId || !aplicacionId) return;
    setConfirmClose(false);
    setClosing(true);
    setCalcStartedAt(Date.now());
    setCalcElapsed(0);
    try {
      const cierre = await psicoAdminService.cerrarAplicacion(empresaId, Number(aplicacionId), 1);
      if (cierre && cierre.ok === false) {
        const calidad = cierre.scoring_fallidos ? Object.values(cierre.scoring_fallidos as Record<string, any>)[0]?.quality : null;
        const detalle = calidad
          ? `Sin transformar: ${calidad.sin_transformado || 0}. Sin nivel: ${calidad.sin_nivel || 0}.`
          : (cierre.message || "El motor detectó inconsistencias de cálculo.");
        notify({
          type: "error",
          title: "Cálculo incompleto",
          message: `No se cerró la aplicación para evitar resultados inválidos. ${detalle}`,
        });
        await load();
        return;
      }
      notify({
        type: "success",
        title: "Aplicación cerrada",
        message: "Se ejecutó el cálculo y ya puedes consultar los resultados.",
      });
      await load();
    } catch (e: any) {
      notify({
        type: "error",
        title: "No fue posible cerrar",
        message: e?.message || "Revisa la completitud de la aplicación.",
      });
    } finally {
      setClosing(false);
      setCalcStartedAt(null);
      setCalcElapsed(0);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 p-8">
        <div className="mx-auto flex max-w-7xl items-center gap-3 rounded-3xl border bg-white p-8 shadow-sm">
          <Loader2 className="h-5 w-5 animate-spin text-violet-700" /> Cargando aplicación...
        </div>
      </main>
    );
  }
  if (error || !data) {
    return (
      <main className="min-h-screen bg-slate-50 p-8">
        <div className="mx-auto max-w-3xl rounded-3xl border border-red-200 bg-red-50 p-8 text-red-800">
          <h1 className="text-2xl font-black">No se pudo cargar la aplicación</h1>
          <p className="mt-2 text-sm">{error || "Detalle no disponible."}</p>
          <div className="mt-5 flex gap-3">
            <button onClick={() => navigate(`/psicosocial/empresas/${empresaId}/aplicaciones`)} className="rounded-xl border bg-white px-4 py-2 font-bold">Volver</button>
            <button onClick={() => void load()} className="rounded-xl bg-violet-700 px-4 py-2 font-bold text-white">Reintentar</button>
          </div>
        </div>
      </main>
    );
  }

  const resumen = data.resumen;

  return (
    <main className="min-h-screen bg-slate-50 p-6 lg:p-8">

      {closing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 p-4 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-3xl border border-violet-100 bg-white p-6 shadow-2xl">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-violet-100 text-violet-700">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-black uppercase tracking-widest text-violet-700">Motor de cálculo psicosocial</p>
                <h2 className="mt-1 text-xl font-black text-slate-950">Calculando resultados oficiales</h2>
                <p className="mt-2 text-sm text-slate-600">{calcStage}</p>
                <div className="mt-4 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-3 rounded-full bg-violet-700 transition-all duration-500" style={{ width: `${calcProgress}%` }} />
                </div>
                <div className="mt-2 flex justify-between text-xs text-slate-500">
                  <span>Tiempo transcurrido: {calcElapsed}s</span>
                  <span>{calcProgress}% estimado</span>
                </div>
                <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
                  No cierres esta ventana. En aplicaciones grandes el cálculo puede tardar mientras se consolidan respuestas, puntajes, niveles de riesgo y tablas del informe.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {toast && <ToastCard toast={toast} onClose={() => setToast(null)} />}
      <ConfirmDialog
        open={confirmClose}
        title="Cerrar y calcular la aplicación"
        description="Al cerrar la aplicación se congelará la captura y se ejecutará el cálculo/recalculo de resultados. Verifica la información antes de continuar: si posteriormente necesitas reabrir para corregir datos, el reprocesamiento podrá consumir un crédito adicional."
        confirmLabel="Cerrar aplicación"
        cancelLabel="Seguir revisando"
        onConfirm={() => void confirmCerrarAplicacion()}
        onCancel={() => setConfirmClose(false)}
      />
      <ConfirmDialog
        open={confirmReopen}
        title="Reabrir aplicación para reproceso"
        description="Reabrir esta aplicación habilitará correcciones, invalidará temporalmente la lectura de resultados y registrará un crédito adicional por reprocesamiento. No se borrarán datos: el cambio quedará auditado."
        confirmLabel="Reabrir y registrar reproceso"
        cancelLabel="Cancelar"
        tone="amber"
        onConfirm={() => void confirmReabrirAplicacion()}
        onCancel={() => setConfirmReopen(false)}
      />

      <div className="mx-auto max-w-7xl space-y-6">
        <button onClick={() => navigate(`/psicosocial/empresas/${empresaId}/aplicaciones`)} className="inline-flex items-center gap-2 rounded-xl border bg-white px-4 py-2 text-sm font-bold shadow-sm">
          <ArrowLeft className="h-4 w-4" /> Volver a aplicaciones
        </button>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-violet-700">Detalle de aplicación</p>
              <h1 className="mt-1 text-3xl font-black text-slate-950">{data.aplicacion.nombre}</h1>
              <p className="mt-1 text-sm text-slate-500">
                {data.empresa.nombre} · Estado {data.aplicacion.estado || "Borrador"} · Fecha: {fmtDate(data.aplicacion.fecha_aplicacion || data.aplicacion.created_at || data.aplicacion.creado_en)}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {data.instrumentos.map((i) => (
                  <span key={`${i.evaluacion_id}-${i.instrument_code}`} className="rounded-full bg-violet-50 px-3 py-1 text-xs font-black text-violet-700">
                    {instrumentLabel(i.instrument_code)}
                  </span>
                ))}
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {finalizada ? (
                <button onClick={() => setConfirmReopen(true)} disabled={closing} className="inline-flex items-center gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-3 text-sm font-bold text-amber-800 hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-50">
                  <RotateCcw className="h-4 w-4" /> Reabrir aplicación
                </button>
              ) : (
                <button onClick={cerrarAplicacion} disabled={closing} className="inline-flex items-center gap-2 rounded-2xl bg-violet-700 px-5 py-3 text-sm font-bold text-white hover:bg-violet-800 disabled:cursor-not-allowed disabled:opacity-50">
                  <ShieldCheck className="h-4 w-4" /> {closing ? "Calculando..." : "Cerrar y calcular"}
                </button>
              )}
              <button
                onClick={() => finalizada ? navigate(`/psicosocial/resultados?aplicacionId=${aplicacionId}`) : notify({ type: "warning", title: "Resultados no disponibles", message: "Primero cierra y calcula la aplicación." })}
                className={`inline-flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-bold ${finalizada ? "border border-slate-200 bg-white text-slate-800 hover:bg-slate-50" : "cursor-not-allowed bg-slate-100 text-slate-400"}`}
              >
                <BarChart3 className="h-4 w-4" /> Dashboard de resultados
              </button>
              {finalizada && (
                <button
                  onClick={() => navigate(`/psicosocial/reportes-oficiales?aplicacionId=${aplicacionId}&tipo=resultados`)}
                  className="inline-flex items-center gap-2 rounded-2xl bg-violet-700 px-5 py-3 text-sm font-bold text-white hover:bg-violet-800"
                >
                  <FileText className="h-4 w-4" /> Informes oficiales
                </button>
              )}
            </div>
          </div>
          {!finalizada && (
            <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              <b>Resultados e informes bloqueados:</b> estarán habilitados cuando cierres la aplicación y el motor calcule/recalcule resultados. Al finalizar, aparecerán las opciones de Dashboard e Informes oficiales con esta evaluación precargada. Si reabres después de cerrar, el reprocesamiento podrá consumir un crédito adicional.
            </div>
          )}
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Card icon={<Users />} label="Empleados empresa" value={resumen.empleados_total} />
          <Card icon={<ClipboardCheck />} label="Con registro" value={resumen.participantes_registrados} />
          <Card icon={<XCircle />} label="Pendientes" value={resumen.pendientes} />
          <article className="rounded-3xl border border-violet-200 bg-violet-50 p-5 shadow-sm">
            <Coins className="mb-4 h-7 w-7 text-violet-700" />
            <p className="text-sm font-bold text-violet-700">Créditos consumidos</p>
            <strong className="text-3xl font-black text-violet-950">{resumen.creditos_consumidos}</strong>
            <p className="mt-1 text-xs text-violet-700">Vista previa del módulo de créditos. Estimados: {resumen.creditos_estimados}</p>
          </article>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-black text-slate-950">Participantes de la aplicación</h2>
              <p className="text-sm text-slate-500">Registra respuestas por colaborador o valida quién ya tiene resultados asociados.</p>
            </div>
            <button onClick={() => void load()} className="rounded-xl border px-4 py-2 text-sm font-bold hover:bg-slate-50">Actualizar</button>
          </div>

          <div className="mb-4 flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3">
            <Search className="h-4 w-4 text-slate-400" />
            <input value={q} onChange={(e) => setQ(e.target.value)} className="w-full outline-none" placeholder="Buscar por cédula, nombre, área o cargo..." />
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">Colaborador</th>
                  <th className="px-4 py-3">Área / cargo</th>
                  <th className="px-4 py-3">Instrumentos</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {empleados.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-slate-500">No hay empleados para mostrar.</td>
                  </tr>
                )}
                {empleados.map((emp) => (
                  <tr key={emp.id} className="hover:bg-slate-50">
                    <td className="px-4 py-4">
                      <strong className="block text-slate-950">{emp.nombre}</strong>
                      <span className="text-xs text-slate-500">CC {emp.cedula}{emp.email ? ` · ${emp.email}` : ""}</span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="block font-bold">{emp.area || "Sin área"}</span>
                      <span className="text-xs text-slate-500">{emp.cargo || "Sin cargo"}</span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap gap-2">
                        {data.instrumentos.map((i) => {
                          const done = emp.instrumentos_registrados.includes(i.instrument_code);
                          return (
                            <span key={`${emp.id}-${i.instrument_code}`} className={`rounded-full px-3 py-1 text-xs font-black ${done ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                              {instrumentLabel(i.instrument_code)}
                            </span>
                          );
                        })}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      {emp.completo ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700"><CheckCircle2 className="h-3 w-3" /> Completo</span>
                      ) : emp.registrado ? (
                        <span className="rounded-full bg-violet-50 px-3 py-1 text-xs font-black text-violet-700">En captura</span>
                      ) : (
                        <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-black text-amber-700">Pendiente</span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-right">
                      {(() => {
                        const enabled = canOpenParticipant(emp);
                        const label = finalizada
                          ? enabled ? "Ver respuestas" : "Sin respuestas"
                          : emp.completo ? "Ver respuestas" : emp.registrado ? "Actualizar respuesta" : "Registrar respuesta";
                        return (
                          <button
                            onClick={() => { if (enabled) navigate(`/psicosocial/empleados/${emp.id}/aplicaciones/${aplicacionId}/respuestas`); }}
                            disabled={!enabled}
                            title={enabled ? label : "La aplicación ya fue cerrada/calculada y este participante no tiene respuestas registradas."}
                            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 font-bold ${enabled ? "bg-violet-700 text-white hover:bg-violet-800" : "cursor-not-allowed bg-slate-100 text-slate-400"}`}
                          >
                            {finalizada ? <Lock className="h-4 w-4" /> : <FilePenLine className="h-4 w-4" />}
                            {label}
                          </button>
                        );
                      })()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}

function Card({ icon, label, value }: { icon: ReactNode; label: string; value: number }) {
  return (
    <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 text-violet-700">{icon}</div>
      <p className="text-sm font-bold text-slate-500">{label}</p>
      <strong className="text-3xl font-black">{value}</strong>
    </article>
  );
}
