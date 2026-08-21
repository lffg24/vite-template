import { FormEvent, useEffect, useMemo, useState } from "react";
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
  actualizarPerfilBasePsicoEmpleado,
  obtenerPerfilPsicoEmpleado,
  type PsicoAplicacionEmpleado,
  type PsicoEmpleadoPerfil,
} from "@/features/psicosocial/api/psicoEmpleadoService";
import { psicoAdminService, type AreaEmpresa, type CargoEmpresa } from "@/features/psicosocial/api/psicoAdminService";

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

function digitsOnly(value: string) {
  return value.replace(/\D/g, "");
}

function validEmail(value: string) {
  return !value.trim() || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
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

type BaseEmployeeForm = {
  nombres: string;
  apellidos: string;
  cedula: string;
  identificador_externo: string;
  correo: string;
  telefono: string;
  area_id: string;
  cargo_id: string;
};

function formFromPerfil(perfil: PsicoEmpleadoPerfil): BaseEmployeeForm {
  return {
    nombres: perfil.nombres || "",
    apellidos: perfil.apellidos || "",
    cedula: perfil.cedula || "",
    identificador_externo: perfil.identificador_externo || "",
    correo: perfil.correo || "",
    telefono: perfil.telefono || "",
    area_id: perfil.area_id ? String(perfil.area_id) : "",
    cargo_id: perfil.cargo_id ? String(perfil.cargo_id) : "",
  };
}

function TextInput({ value, onChange, type = "text", inputMode }: { value: string; onChange: (value: string) => void; type?: string; inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"] }) {
  return (
    <input
      type={type}
      inputMode={inputMode}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-800 outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
    />
  );
}

function BaseField({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-black text-slate-800">{label}</span>
      {children}
      {error ? <span className="mt-1 block text-xs font-semibold text-red-600">{error}</span> : null}
    </label>
  );
}

function EditBaseEmployeeModal({ perfil, onClose, onSaved }: { perfil: PsicoEmpleadoPerfil; onClose: () => void; onSaved: (perfil: PsicoEmpleadoPerfil) => void }) {
  const [form, setForm] = useState<BaseEmployeeForm>(() => formFromPerfil(perfil));
  const [areas, setAreas] = useState<AreaEmpresa[]>([]);
  const [cargos, setCargos] = useState<CargoEmpresa[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loadingCatalogs, setLoadingCatalogs] = useState(false);
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    async function loadCatalogs() {
      if (!perfil.empresa_id) return;
      setLoadingCatalogs(true);
      try {
        const [areasRes, cargosRes] = await Promise.all([
          psicoAdminService.listarAreas(perfil.empresa_id),
          psicoAdminService.listarCargos(perfil.empresa_id),
        ]);
        if (!alive) return;
        setAreas(areasRes.items || []);
        setCargos(cargosRes.items || []);
      } catch (err) {
        if (alive) setSubmitError(err instanceof Error ? err.message : "No fue posible cargar áreas y cargos.");
      } finally {
        if (alive) setLoadingCatalogs(false);
      }
    }
    loadCatalogs();
    return () => {
      alive = false;
    };
  }, [perfil.empresa_id]);

  const visibleCargos = useMemo(
    () => (!form.area_id ? cargos : cargos.filter((cargo) => !cargo.area_id || String(cargo.area_id) === form.area_id)),
    [cargos, form.area_id],
  );

  function update(key: keyof BaseEmployeeForm, value: string) {
    const clean = key === "cedula" || key === "telefono" ? digitsOnly(value) : value;
    setForm((prev) => ({ ...prev, [key]: clean, ...(key === "area_id" ? { cargo_id: "" } : {}) }));
    setErrors((prev) => ({ ...prev, [key]: "" }));
  }

  function validate() {
    const next: Record<string, string> = {};
    if (!form.nombres.trim()) next.nombres = "Nombres es obligatorio.";
    if (!form.apellidos.trim()) next.apellidos = "Apellidos es obligatorio.";
    if (!form.cedula.trim()) next.cedula = "Cédula es obligatoria.";
    if (form.cedula.trim() && form.cedula.trim().length < 5) next.cedula = "Cédula debe tener mínimo 5 dígitos.";
    if (form.correo.trim() && !validEmail(form.correo)) next.correo = "Correo inválido.";
    if (form.telefono.trim() && form.telefono.trim().length < 7) next.telefono = "Teléfono debe tener mínimo 7 dígitos.";
    if (!form.area_id) next.area_id = "Área es obligatoria.";
    if (!form.cargo_id) next.cargo_id = "Cargo es obligatorio.";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!validate()) return;
    setSaving(true);
    setSubmitError(null);
    try {
      const updated = await actualizarPerfilBasePsicoEmpleado(
        perfil.empleado_id,
        {
          nombres: form.nombres.trim(),
          apellidos: form.apellidos.trim(),
          cedula: form.cedula.trim(),
          identificador_externo: form.identificador_externo.trim() || null,
          email: form.correo.trim().toLowerCase() || null,
          telefono: form.telefono.trim() || null,
          area_id: form.area_id ? Number(form.area_id) : null,
          cargo_id: form.cargo_id ? Number(form.cargo_id) : null,
        },
        perfil.empresa_id,
      );
      onSaved(updated);
      onClose();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "No fue posible actualizar el perfil base.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/45 backdrop-blur-sm">
      <aside className="h-full w-full max-w-3xl overflow-y-auto bg-white p-6 shadow-2xl">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-violet-700">Base del colaborador</p>
            <h2 className="text-2xl font-black text-slate-950">Editar información transversal</h2>
            <p className="mt-1 text-sm text-slate-500">Estos datos aplican a ABRIL360. La ficha sociodemográfica se mantiene por aplicación.</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-2xl border border-slate-200 p-2 hover:bg-slate-50">
            <X className="h-5 w-5" />
          </button>
        </div>

        {submitError ? <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{submitError}</div> : null}

        <form onSubmit={submit} className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <BaseField label="Nombres *" error={errors.nombres}><TextInput value={form.nombres} onChange={(value) => update("nombres", value)} /></BaseField>
            <BaseField label="Apellidos *" error={errors.apellidos}><TextInput value={form.apellidos} onChange={(value) => update("apellidos", value)} /></BaseField>
            <BaseField label="Cédula *" error={errors.cedula}><TextInput value={form.cedula} onChange={(value) => update("cedula", value)} inputMode="numeric" /></BaseField>
            <BaseField label="Identificador externo"><TextInput value={form.identificador_externo} onChange={(value) => update("identificador_externo", value)} /></BaseField>
            <BaseField label="Correo" error={errors.correo}><TextInput type="email" value={form.correo} onChange={(value) => update("correo", value)} /></BaseField>
            <BaseField label="Teléfono" error={errors.telefono}><TextInput value={form.telefono} onChange={(value) => update("telefono", value)} inputMode="numeric" /></BaseField>
            <BaseField label="Área *" error={errors.area_id}>
              <select
                value={form.area_id}
                onChange={(event) => update("area_id", event.target.value)}
                disabled={loadingCatalogs}
                className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-800 outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100 disabled:bg-slate-50"
              >
                <option value="">{loadingCatalogs ? "Cargando áreas..." : "Selecciona área"}</option>
                {areas.map((area) => <option key={area.id} value={area.id}>{area.nombre}</option>)}
              </select>
            </BaseField>
            <BaseField label="Cargo *" error={errors.cargo_id}>
              <select
                value={form.cargo_id}
                onChange={(event) => update("cargo_id", event.target.value)}
                disabled={loadingCatalogs || !form.area_id}
                className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-800 outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100 disabled:bg-slate-50"
              >
                <option value="">{form.area_id ? "Selecciona cargo" : "Selecciona primero un área"}</option>
                {visibleCargos.map((cargo) => <option key={cargo.id} value={cargo.id}>{cargo.nombre}</option>)}
              </select>
            </BaseField>
          </div>

          <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">
            <button type="button" onClick={onClose} className="rounded-2xl border border-slate-200 px-5 py-3 font-bold text-slate-700 hover:bg-slate-50">Cancelar</button>
            <button disabled={saving} className="inline-flex items-center gap-2 rounded-2xl bg-violet-700 px-6 py-3 font-bold text-white hover:bg-violet-800 disabled:opacity-60">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Guardar cambios
            </button>
          </div>
        </form>
      </aside>
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
  const [showEditModal, setShowEditModal] = useState(false);
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
            <p className="mt-1 text-slate-500">Consulta la base transversal del colaborador y sus aplicaciones psicosociales.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button type="button" onClick={() => perfil && setShowEditModal(true)} className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 shadow-sm hover:bg-slate-50">
              <FileText className="h-4 w-4" /> Editar colaborador
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
              <div className="mb-2 flex items-center justify-between text-sm"><span className="text-slate-500">Completitud base</span><b>{completitudPerfil.toFixed(0)}%</b></div>
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
            <SectionCard number={1} title="Identificación y contacto">
              <InfoRow label="Nombre completo" value={nombre} /><InfoRow label="Nombres" value={perfil?.nombres} /><InfoRow label="Apellidos" value={perfil?.apellidos} /><InfoRow label="Número de documento" value={perfil?.cedula} /><InfoRow label="Identificador externo" value={perfil?.identificador_externo} /><InfoRow label="Correo electrónico" value={perfil?.correo} /><InfoRow label="Teléfono" value={perfil?.telefono} />
            </SectionCard>
            <SectionCard number={2} title="Asignación organizacional">
              <InfoRow label="Empresa" value={perfil?.empresa} /><InfoRow label="Área / departamento" value={perfil?.area} /><InfoRow label="Cargo" value={perfil?.cargo} />
            </SectionCard>
            <SectionCard number={3} title="Trazabilidad ABRIL360">
              <InfoRow label="Alcance del perfil" value="Base transversal del colaborador" /><InfoRow label="Aplicaciones vinculadas" value={perfil?.resumen_aplicaciones?.total ?? 0} /><InfoRow label="Aplicaciones completas" value={perfil?.resumen_aplicaciones?.completas ?? 0} /><InfoRow label="En curso" value={perfil?.resumen_aplicaciones?.activas ?? 0} /><InfoRow label="Última actualización" value={perfil?.ultima_actualizacion ? fmtDate(perfil.ultima_actualizacion) : null} />
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
      {showEditModal && perfil ? <EditBaseEmployeeModal perfil={perfil} onClose={() => setShowEditModal(false)} onSaved={setPerfil} /> : null}
    </div>
  );
}
