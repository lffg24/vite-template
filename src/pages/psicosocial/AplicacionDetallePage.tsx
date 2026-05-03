import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, BarChart3, CheckCircle2, ClipboardCheck, Coins, FilePenLine, Loader2, Lock, Search, ShieldCheck, Users, XCircle } from "lucide-react";
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
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastPayload | null>(null);

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

  const empleados = useMemo(() => {
    const term = q.trim().toLowerCase();
    const rows = data?.empleados || [];
    if (!term) return rows;
    return rows.filter((e) => `${e.cedula} ${e.nombre} ${e.area} ${e.cargo} ${e.email}`.toLowerCase().includes(term));
  }, [data, q]);

  const finalizada = isFinalizada(data?.aplicacion?.estado);

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

  async function confirmCerrarAplicacion() {
    if (!empresaId || !aplicacionId) return;
    setConfirmClose(false);
    setClosing(true);
    try {
      await psicoAdminService.cerrarAplicacion(empresaId, Number(aplicacionId), 1);
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
      {toast && <ToastCard toast={toast} onClose={() => setToast(null)} />}
      <ConfirmDialog
        open={confirmClose}
        title="Cerrar y calcular la aplicación"
        description="Al cerrar la aplicación se congelará la captura y se ejecutará el cálculo/recalculo de resultados. Después, los resultados quedarán disponibles para reportes y tablero analítico."
        confirmLabel="Cerrar aplicación"
        cancelLabel="Seguir revisando"
        onConfirm={() => void confirmCerrarAplicacion()}
        onCancel={() => setConfirmClose(false)}
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
              <button onClick={cerrarAplicacion} disabled={closing || finalizada} className="inline-flex items-center gap-2 rounded-2xl bg-violet-700 px-5 py-3 text-sm font-bold text-white hover:bg-violet-800 disabled:cursor-not-allowed disabled:opacity-50">
                <ShieldCheck className="h-4 w-4" /> {finalizada ? "Aplicación cerrada" : closing ? "Calculando..." : "Cerrar y calcular"}
              </button>
              <button
                onClick={() => finalizada ? navigate(`/psicosocial/resultados?aplicacionId=${aplicacionId}`) : notify({ type: "warning", title: "Resultados no disponibles", message: "Primero cierra y calcula la aplicación." })}
                className={`inline-flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-bold ${finalizada ? "border border-slate-200 bg-white text-slate-800 hover:bg-slate-50" : "cursor-not-allowed bg-slate-100 text-slate-400"}`}
              >
                <BarChart3 className="h-4 w-4" /> Dashboard de resultados
              </button>
            </div>
          </div>
          {!finalizada && (
            <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              <b>Resultados bloqueados:</b> estarán habilitados cuando cierres la aplicación y el motor calcule/recalcule resultados.
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
                      <button
                        disabled={finalizada}
                        onClick={() => navigate(`/psicosocial/empleados/${emp.id}/aplicaciones/${aplicacionId}/respuestas`)}
                        className="inline-flex items-center gap-2 rounded-xl bg-violet-700 px-4 py-2 font-bold text-white hover:bg-violet-800 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
                      >
                        {finalizada ? <Lock className="h-4 w-4" /> : <FilePenLine className="h-4 w-4" />}
                        {emp.registrado ? "Actualizar respuesta" : "Registrar respuesta"}
                      </button>
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
