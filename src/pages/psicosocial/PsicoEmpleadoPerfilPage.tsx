import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Eye,
  FileText,
  IdCard,
  Loader2,
  LockKeyhole,
  ShieldAlert,
  ShieldCheck,
  UserRound,
  X,
} from "lucide-react";

import {
  obtenerPerfilPsicoEmpleado,
  type PsicoAplicacionEmpleado,
  type PsicoEmpleadoPerfil,
} from "@/features/psicosocial/api/psicoEmpleadoService";

const RISK_CLASS: Record<string, string> = {
  SIN_RIESGO: "bg-emerald-50 text-emerald-700 border-emerald-200",
  MUY_BAJO: "bg-emerald-50 text-emerald-700 border-emerald-200",
  BAJO: "bg-lime-50 text-lime-700 border-lime-200",
  MEDIO: "bg-amber-50 text-amber-700 border-amber-200",
  ALTO: "bg-orange-50 text-orange-700 border-orange-200",
  MUY_ALTO: "bg-red-50 text-red-700 border-red-200",
};

function display(value: unknown, fallback = "Sin dato") {
  if (value === null || value === undefined || value === "") return fallback;
  return String(value);
}

function fmtDate(value?: string | null) {
  if (!value) return "Sin fecha";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("es-CO", { year: "numeric", month: "short", day: "2-digit" });
}

function riskLabel(value?: string | null) {
  if (!value) return "Sin nivel";
  return value.replaceAll("_", " ").toLowerCase().replace(/^.|\s./g, (s) => s.toUpperCase());
}

function RiskBadge({ value }: { value?: string | null }) {
  const key = String(value || "SIN_NIVEL").toUpperCase();
  return (
    <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-black ${RISK_CLASS[key] || "border-slate-200 bg-slate-50 text-slate-600"}`}>
      {riskLabel(value)}
    </span>
  );
}

function InfoRow({ label, value }: { label: string; value: unknown }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-slate-100 py-3 last:border-b-0">
      <dt className="text-sm text-slate-500">{label}</dt>
      <dd className="max-w-[58%] text-right text-sm font-semibold text-slate-800">{display(value)}</dd>
    </div>
  );
}

function SectionCard({ number, title, children }: { number: number; title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-violet-100 text-sm font-bold text-violet-700">
          {number}
        </div>
        <h2 className="text-lg font-black text-slate-950">{title}</h2>
      </div>
      <dl>{children}</dl>
    </section>
  );
}

function ApplicationStatusCard({ app, onRegister, onResults }: { app: PsicoAplicacionEmpleado; onRegister: () => void; onResults: () => void }) {
  return (
    <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-wide text-violet-600">Aplicación psicosocial</p>
          <h3 className="mt-1 text-xl font-black text-slate-950">{app.nombre}</h3>
          <p className="mt-1 text-sm text-slate-500">{fmtDate(app.fecha_aplicacion || app.created_at)} · Estado: {display(app.estado)}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className={`rounded-full px-3 py-1 text-xs font-black ${app.bateria_completa ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
            {app.estado_bateria}
          </span>
          <RiskBadge value={app.riesgo_mas_alto} />
        </div>
      </div>

      <div className="mt-4">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="text-slate-500">Completitud batería normativa</span>
          <b>{Number(app.completitud_bateria || 0).toFixed(0)}%</b>
        </div>
        <div className="h-2 rounded-full bg-slate-100">
          <div className="h-2 rounded-full bg-violet-600" style={{ width: `${Math.min(100, Math.max(0, app.completitud_bateria || 0))}%` }} />
        </div>
      </div>

      <div className="mt-4 grid gap-2 md:grid-cols-2 xl:grid-cols-4">
        {app.evaluaciones.map((ev) => (
          <div key={`${app.aplicacion_id}-${ev.evaluacion_id}`} className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
            <p className="text-xs font-bold text-slate-500">{ev.label || ev.instrument_code}</p>
            <div className="mt-2 flex items-center justify-between gap-2">
              <span className="text-sm font-black text-slate-900">{ev.estado_respuestas}</span>
              {ev.nivel_riesgo ? <RiskBadge value={ev.nivel_riesgo} /> : null}
            </div>
            <p className="mt-2 text-xs text-slate-500">
              {ev.respondidas}/{ev.total_preguntas} respuestas {ev.puntaje_transformado != null ? `· Puntaje ${ev.puntaje_transformado}` : ""}
            </p>
          </div>
        ))}
      </div>

      {app.errores?.length ? (
        <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          {app.errores.map((e) => <p key={e}>• {e}</p>)}
        </div>
      ) : null}

      <div className="mt-5 flex flex-wrap justify-end gap-3">
        <button type="button" onClick={onResults} className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-700 shadow-sm hover:bg-slate-50">
          <Eye className="h-4 w-4" /> Ver resultados
        </button>
        <button
          type="button"
          onClick={onRegister}
          disabled={!app.puede_registrar}
          className="inline-flex items-center gap-2 rounded-2xl bg-violet-700 px-4 py-2 text-sm font-black text-white shadow-sm hover:bg-violet-800 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
        >
          <ClipboardList className="h-4 w-4" /> {app.puede_registrar ? "Registrar / continuar" : "Ya completada"}
        </button>
      </div>
    </article>
  );
}

function ApplicationSelectModal({ apps, onClose, onSelect, onResults }: { apps: PsicoAplicacionEmpleado[]; onClose: () => void; onSelect: (app: PsicoAplicacionEmpleado) => void; onResults: (app: PsicoAplicacionEmpleado) => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm">
      <div className="max-h-[88vh] w-full max-w-4xl overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-slate-100 p-6">
          <div>
            <p className="text-xs font-black uppercase tracking-wide text-violet-600">Registro de respuestas</p>
            <h2 className="mt-1 text-2xl font-black text-slate-950">Seleccionar aplicación</h2>
            <p className="mt-1 text-sm text-slate-500">No se permite registrar de nuevo una batería que ya está completa/calculada para este colaborador.</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-xl border border-slate-200 p-2 hover:bg-slate-50">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="max-h-[64vh] overflow-y-auto p-6">
          {apps.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
              <ShieldAlert className="mx-auto h-10 w-10 text-slate-400" />
              <h3 className="mt-3 text-lg font-black text-slate-900">No hay aplicaciones disponibles</h3>
              <p className="mt-1 text-sm text-slate-500">El colaborador no tiene una aplicación pendiente para registrar. Crea/asigna una batería o revisa las aplicaciones ya completadas.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {apps.map((app) => (
                <div key={`modal-app-${app.aplicacion_id}`} className="rounded-2xl border border-slate-200 p-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <h3 className="font-black text-slate-950">{app.nombre}</h3>
                      <p className="text-sm text-slate-500">{fmtDate(app.fecha_aplicacion || app.created_at)} · {app.formulario_intra} · {app.completitud_bateria}%</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button type="button" onClick={() => onResults(app)} className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-black text-slate-700 hover:bg-slate-50">Ver resultados</button>
                      <button type="button" onClick={() => onSelect(app)} disabled={!app.puede_registrar} className="rounded-xl bg-violet-700 px-3 py-2 text-sm font-black text-white hover:bg-violet-800 disabled:bg-slate-200 disabled:text-slate-500">Continuar registro</button>
                    </div>
                  </div>
                  {app.errores?.length ? <p className="mt-2 text-xs text-amber-700">{app.errores.join(" · ")}</p> : null}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function PsicoEmpleadoPerfilPage() {
  const { empleadoId } = useParams();
  const navigate = useNavigate();
  const [perfil, setPerfil] = useState<PsicoEmpleadoPerfil | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAppModal, setShowAppModal] = useState(false);
  const [tab, setTab] = useState<"perfil" | "aplicaciones">("perfil");

  useEffect(() => {
    let mounted = true;
    async function load() {
      if (!empleadoId) return;
      setLoading(true);
      setError(null);
      try {
        const data = await obtenerPerfilPsicoEmpleado(empleadoId);
        if (mounted) setPerfil(data);
      } catch (e) {
        console.error(e);
        if (mounted) setError(e instanceof Error ? e.message : "No fue posible cargar el perfil.");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, [empleadoId]);

  const apps = perfil?.aplicaciones || [];
  const latestApp = useMemo(() => apps[0], [apps]);
  const availableApps = useMemo(() => apps.filter((a) => a.puede_registrar), [apps]);
  const nombre = perfil?.nombre_completo || `Colaborador ${String(perfil?.cedula || empleadoId || "").slice(-4)} Demo`;
  const completitudPerfil = Number(perfil?.completitud_perfil ?? 0);

  function goRegister(app: PsicoAplicacionEmpleado) {
    navigate(`/psicosocial/empleados/${empleadoId}/aplicaciones/${app.aplicacion_id}/respuestas`);
  }

  function goResults(app: PsicoAplicacionEmpleado) {
    navigate(`/psicosocial/empleados/${empleadoId}/aplicaciones/${app.aplicacion_id}/resultados`);
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-[1500px] space-y-5 p-4 md:p-6">
        <div className="flex items-center gap-3 text-slate-500"><Loader2 className="h-5 w-5 animate-spin" /> Cargando perfil...</div>
        <div className="h-36 animate-pulse rounded-3xl bg-slate-100" />
        <div className="grid gap-5 lg:grid-cols-3"><div className="h-80 animate-pulse rounded-3xl bg-slate-100" /><div className="h-80 animate-pulse rounded-3xl bg-slate-100" /><div className="h-80 animate-pulse rounded-3xl bg-slate-100" /></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <main className="mx-auto max-w-[1500px] space-y-5 p-4 md:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <button type="button" onClick={() => navigate(-1)} className="mb-4 inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600 shadow-sm hover:bg-slate-50">
              <ArrowLeft className="h-4 w-4" /> Volver
            </button>
            <h1 className="text-3xl font-black tracking-tight md:text-4xl">Perfil del empleado</h1>
            <p className="mt-1 text-slate-500">Consulta sociodemográfica, aplicaciones psicosociales, respuestas y resultados individuales.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button type="button" onClick={() => setTab("perfil")} className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 shadow-sm hover:bg-slate-50">
              <FileText className="h-4 w-4" /> Editar perfil
            </button>
            <button type="button" onClick={() => setShowAppModal(true)} className="inline-flex items-center gap-2 rounded-2xl bg-violet-700 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-violet-200 hover:bg-violet-800">
              <ClipboardList className="h-4 w-4" /> Registrar respuestas
            </button>
          </div>
        </div>

        {error && <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

        <section className="grid gap-5 lg:grid-cols-[1fr_430px]">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-5 md:flex-row md:items-center">
              <div className="flex h-28 w-28 shrink-0 items-center justify-center rounded-full bg-violet-100 text-3xl font-black text-violet-700">
                {(nombre.split(" ").filter(Boolean).slice(0, 2).map((p) => p[0]).join("") || "CE").toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-2xl font-black text-slate-950">{nombre}</h2>
                <div className="mt-5 grid gap-4 md:grid-cols-3">
                  <div className="flex items-start gap-3 border-r border-slate-100 pr-4"><IdCard className="mt-0.5 h-5 w-5 text-violet-600" /><div><p className="text-xs text-slate-500">Documento</p><p className="font-bold text-slate-800">{display(perfil?.cedula)}</p></div></div>
                  <div className="flex items-start gap-3 border-r border-slate-100 pr-4"><BriefcaseBusiness className="mt-0.5 h-5 w-5 text-violet-600" /><div><p className="text-xs text-slate-500">Cargo</p><p className="font-bold text-slate-800">{display(perfil?.cargo)}</p></div></div>
                  <div className="flex items-start gap-3"><Building2 className="mt-0.5 h-5 w-5 text-violet-600" /><div><p className="text-xs text-slate-500">Empresa</p><p className="font-bold text-slate-800">{display(perfil?.empresa, "Empresa actual")}</p></div></div>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-slate-500">Última batería</p>
                <div className="mt-2 inline-flex max-w-full rounded-xl bg-violet-100 px-3 py-2 text-sm font-black text-violet-700">{latestApp?.formulario_intra || "Sin aplicación"}</div>
                <p className="mt-2 text-xs text-slate-500 line-clamp-2">{latestApp?.nombre || "No hay aplicación psicosocial vinculada."}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Estado de batería</p>
                <div className={`mt-2 inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-black ${latestApp?.bateria_completa ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                  <CheckCircle2 className="h-4 w-4" /> {latestApp?.estado_bateria || "Sin dato"}
                </div>
              </div>
            </div>
            <div className="mt-5">
              <div className="mb-2 flex items-center justify-between text-sm"><span className="text-slate-500">Completitud del perfil</span><b>{completitudPerfil.toFixed(0)}%</b></div>
              <div className="h-2 rounded-full bg-slate-100"><div className="h-2 rounded-full bg-violet-600" style={{ width: `${Math.min(100, Math.max(0, completitudPerfil))}%` }} /></div>
              <p className="mt-3 text-xs text-slate-500">Baterías: {perfil?.resumen_aplicaciones?.total ?? 0} · Completas: {perfil?.resumen_aplicaciones?.completas ?? 0} · Pendientes: {availableApps.length}</p>
            </div>
          </div>
        </section>

        <div className="rounded-3xl border border-slate-200 bg-white p-2 shadow-sm">
          <button type="button" onClick={() => setTab("perfil")} className={`rounded-2xl px-4 py-2 text-sm font-black ${tab === "perfil" ? "bg-violet-700 text-white" : "text-slate-600 hover:bg-slate-50"}`}>Perfil</button>
          <button type="button" onClick={() => setTab("aplicaciones")} className={`rounded-2xl px-4 py-2 text-sm font-black ${tab === "aplicaciones" ? "bg-violet-700 text-white" : "text-slate-600 hover:bg-slate-50"}`}>Aplicaciones y resultados</button>
        </div>

        {tab === "perfil" ? (
          <section className="grid gap-5 lg:grid-cols-3">
            <SectionCard number={1} title="Información personal">
              <InfoRow label="Nombre completo" value={nombre} /><InfoRow label="Número de documento" value={perfil?.cedula} /><InfoRow label="Sexo" value={perfil?.sexo} /><InfoRow label="Edad" value={perfil?.edad ? `${perfil.edad} años` : null} /><InfoRow label="Año de nacimiento" value={perfil?.anio_nacimiento} /><InfoRow label="Estado civil" value={perfil?.estado_civil} /><InfoRow label="Correo electrónico" value={perfil?.correo} /><InfoRow label="Teléfono" value={perfil?.telefono} />
            </SectionCard>
            <SectionCard number={2} title="Información sociodemográfica">
              <InfoRow label="Nivel de estudios" value={perfil?.nivel_estudios} /><InfoRow label="Ocupación / profesión" value={perfil?.ocupacion} /><InfoRow label="Estrato" value={perfil?.estrato} /><InfoRow label="Tipo de vivienda" value={perfil?.tipo_vivienda} /><InfoRow label="Personas que dependen económicamente" value={perfil?.personas_dependen} />
            </SectionCard>
            <SectionCard number={3} title="Información laboral">
              <InfoRow label="Área / departamento" value={perfil?.area} /><InfoRow label="Cargo" value={perfil?.cargo} /><InfoRow label="Tipo de cargo" value={perfil?.tipo_cargo} /><InfoRow label="Tipo de contrato" value={perfil?.tipo_contrato} /><InfoRow label="Horas diarias de trabajo" value={perfil?.horas_diarias ? `${perfil.horas_diarias} horas` : null} /><InfoRow label="Tipo de salario" value={perfil?.tipo_salario} /><InfoRow label="Antigüedad en la empresa" value={perfil?.antiguedad_empresa_anios != null ? `${perfil.antiguedad_empresa_anios} años` : null} /><InfoRow label="Antigüedad en el cargo" value={perfil?.antiguedad_cargo_anios != null ? `${perfil.antiguedad_cargo_anios} años` : null} />
            </SectionCard>
          </section>
        ) : (
          <section className="space-y-4">
            {apps.length ? apps.map((app) => <ApplicationStatusCard key={`app-${app.aplicacion_id}`} app={app} onRegister={() => goRegister(app)} onResults={() => goResults(app)} />) : (
              <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500">No hay aplicaciones psicosociales para este colaborador.</div>
            )}
          </section>
        )}

        <section className="rounded-3xl border border-violet-100 bg-violet-50/70 p-5 text-sm text-slate-700">
          <div className="flex items-start gap-3"><LockKeyhole className="mt-0.5 h-5 w-5 text-violet-700" /><div><h3 className="font-black text-slate-950">Información confidencial</h3><p className="mt-1">Los datos aquí mostrados son confidenciales. Su uso es exclusivo para evaluación y gestión del riesgo psicosocial.</p></div></div>
        </section>
      </main>

      {showAppModal ? <ApplicationSelectModal apps={apps} onClose={() => setShowAppModal(false)} onSelect={goRegister} onResults={goResults} /> : null}
    </div>
  );
}
