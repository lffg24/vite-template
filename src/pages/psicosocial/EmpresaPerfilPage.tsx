import { FormEvent, ReactNode, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  BarChart3,
  BriefcaseBusiness,
  Building2,
  Edit3,
  Eye,
  FileText,
  Loader2,
  Plus,
  Save,
  Users,
  X,
} from "lucide-react";
import {
  ActualizarEmpresaPayload,
  AplicacionEmpresa,
  EmpresaPsico,
  psicoAdminService,
} from "@/features/psicosocial/api/psicoAdminService";
import { ToastCard, type ToastPayload } from "@/components/feedback/ToastCard";

function n(value: unknown) {
  const num = Number(value ?? 0);
  return Number.isFinite(num) ? num : 0;
}

const ESTADO_LABELS: Record<string, string> = {
  BORRADOR: "Borrador",
  EN_CAPTURA: "En captura",
  CALCULANDO: "Calculando",
  FINALIZADA: "Finalizada",
  REABIERTA: "Reabierta",
  ERROR_CALCULO: "Error de cálculo",
};

function estadoLabel(estado?: string | null) {
  const key = String(estado || "BORRADOR").trim().toUpperCase();
  return ESTADO_LABELS[key] || estado || "Borrador";
}

function isFinalizada(estado?: string | null) {
  return String(estado || "").trim().toUpperCase() === "FINALIZADA" || String(estado || "").toLowerCase().includes("final");
}

function resultsButtonClass(enabled: boolean) {
  return enabled
    ? "rounded-xl border px-3 py-2 font-bold hover:bg-slate-50"
    : "cursor-not-allowed rounded-xl border border-slate-200 bg-slate-100 px-3 py-2 font-bold text-slate-400";
}

export default function EmpresaPerfilPage() {
  const { empresaId = "" } = useParams();
  const navigate = useNavigate();
  const [empresa, setEmpresa] = useState<EmpresaPsico | null>(null);
  const [resumen, setResumen] = useState<any>({});
  const [apps, setApps] = useState<AplicacionEmpresa[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [toast, setToast] = useState<ToastPayload | null>(null);

  const notify = (payload: Omit<ToastPayload, "id">) => {
    const id = Date.now();
    setToast({ id, ...payload });
    window.setTimeout(() => setToast((current) => (current?.id === id ? null : current)), 4200);
  };

  const load = async () => {
    if (!empresaId) return;
    setLoading(true);
    setError(null);
    try {
      const response = await psicoAdminService.perfilEmpresa(empresaId);
      setEmpresa(response.empresa);
      setResumen(response.resumen || {});
      setApps(response.aplicaciones_recientes || []);
    } catch (err: any) {
      setError(err?.message || "No fue posible cargar la empresa");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [empresaId]);

  if (loading) return <main className="min-h-screen bg-slate-50 p-8 text-slate-500">Cargando perfil de empresa...</main>;
  if (error || !empresa) return <main className="min-h-screen bg-slate-50 p-8 text-red-700">{error || "Empresa no encontrada"}</main>;

  return (
    <main className="min-h-screen bg-slate-50 p-6 lg:p-8">
      {toast && <ToastCard toast={toast} onClose={() => setToast(null)} />}
      <div className="mx-auto max-w-7xl space-y-6">
        <button
          onClick={() => navigate("/psicosocial/empresas")}
          className="inline-flex items-center gap-2 rounded-xl border bg-white px-4 py-2 text-sm font-bold shadow-sm hover:bg-slate-50"
        >
          <ArrowLeft className="h-4 w-4" /> Volver a empresas
        </button>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="grid gap-5 lg:grid-cols-[1fr_420px]">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-3xl bg-accent text-brand-primary">
                <Building2 className="h-10 w-10" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-black uppercase tracking-widest text-brand-primary">Perfil de empresa</p>
                <h1 className="mt-1 break-words text-3xl font-black text-slate-950">{empresa.nombre}</h1>
                <p className="mt-1 text-sm text-slate-500">
                  NIT {empresa.nit || "Sin dato"} · {empresa.ciudad || "Sin ciudad"} · {empresa.email || "Sin correo"}
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <span className="inline-flex whitespace-nowrap rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                    {empresa.estado || "Activa"}
                  </span>
                  <button
                    onClick={() => setEditOpen(true)}
                    className="inline-flex items-center gap-2 rounded-xl border border-accent bg-accent px-4 py-2 text-sm font-black text-brand-primary hover:bg-accent-hover"
                  >
                    <Edit3 className="h-4 w-4" /> Editar información
                  </button>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-3 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 text-center">
              <Metric label="Empleados" value={n(resumen.empleados)} />
              <Metric label="Aplicaciones" value={n(resumen.aplicaciones)} />
              <Metric label="Con resultados" value={n(resumen.aplicaciones_con_resultados)} />
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-black text-slate-950">Información de la empresa</h2>
                <p className="mt-1 text-sm text-slate-500">Datos base para identificación, contacto y contexto de operación.</p>
              </div>
              <button onClick={() => setEditOpen(true)} className="inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-bold hover:bg-slate-50">
                <Edit3 className="h-4 w-4" /> Completar
              </button>
            </div>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <Info label="Razón social" value={empresa.razon_social || empresa.nombre} />
              <Info label="NIT" value={empresa.nit || "Sin dato"} />
              <Info label="Dirección" value={empresa.direccion || "Sin dato"} />
              <Info label="Ciudad" value={empresa.ciudad || "Sin dato"} />
              <Info label="Teléfono" value={empresa.telefono || "Sin dato"} />
              <Info label="Correo" value={empresa.email || "Sin dato"} />
              <Info label="País" value={empresa.pais || "Colombia"} />
              <Info label="Sitio web" value={empresa.sitio_web || "Sin dato"} />
              <Info label="Representante legal" value={empresa.representante_legal || "Sin dato"} />
              <Info label="Actividad económica" value={empresa.actividad_economica || "Sin dato"} />
            </div>
          </div>

          <aside className="space-y-4">
            <Action icon={<Plus />} title="Nueva batería" desc="Crear aplicación A/B + Extra + Estrés" onClick={() => navigate(`/psicosocial/empresas/${empresaId}/aplicaciones`)} />
            <Action icon={<BriefcaseBusiness />} title="Áreas y cargos" desc="Gestionar estructura de colaboradores" onClick={() => navigate(`/psicosocial/empresas/${empresaId}/areas-cargos`)} />
            <Action icon={<Users />} title="Ver empleados" desc="Listado y perfiles de colaboradores" onClick={() => navigate(`/psicosocial/empresas/${empresaId}/empleados`)} />
            <Action icon={<BarChart3 />} title="Resultados" desc="Dashboard por aplicación" onClick={() => navigate("/psicosocial/resultados")} />
          </aside>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-black text-slate-950">Aplicaciones recientes</h2>
            <button onClick={() => navigate(`/psicosocial/empresas/${empresaId}/aplicaciones`)} className="text-sm font-bold text-brand-primary hover:underline">Ver todas</button>
          </div>
          <div className="overflow-hidden rounded-2xl border border-slate-200">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">Nombre</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3">Participantes</th>
                  <th className="px-4 py-3">Instrumentos</th>
                  <th className="px-4 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {apps.length === 0 && <tr><td colSpan={5} className="px-4 py-10 text-center text-slate-500">No hay aplicaciones recientes.</td></tr>}
                {apps.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50">
                    <td className="px-4 py-4">
                      <Link to={`/psicosocial/empresas/${empresaId}/aplicaciones/${a.id}`} className="font-black text-slate-950 hover:text-brand-primary hover:underline">
                        {a.nombre}
                      </Link>
                      <p className="text-xs text-slate-500">Aplicación #{a.id}</p>
                    </td>
                    <td className="px-4 py-4">
                      <span className="inline-flex whitespace-nowrap rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-bold text-slate-700">
                        {estadoLabel(a.estado)}
                      </span>
                    </td>
                    <td className="px-4 py-4 font-bold">{n((a as any).participantes ?? a.participantes_calculados)}</td>
                    <td className="px-4 py-4 text-xs text-slate-500">{(a.evaluaciones || []).length || "—"}</td>
                    <td className="px-4 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => navigate(`/psicosocial/empresas/${empresaId}/aplicaciones/${a.id}`)} className="rounded-xl border px-3 py-2 font-bold hover:bg-slate-50">
                          <Eye className="inline h-4 w-4" /> Detalle
                        </button>
                        {isFinalizada(a.estado) ? (
                          <>
                            <button onClick={() => navigate(`/psicosocial/resultados?aplicacionId=${a.id}`)} className={resultsButtonClass(true)}>
                              <BarChart3 className="inline h-4 w-4" /> Resultados
                            </button>
                            <button onClick={() => navigate(`/psicosocial/reportes-oficiales?aplicacionId=${a.id}&tipo=resultados`)} className="rounded-xl border px-3 py-2 font-bold hover:bg-slate-50">
                              <FileText className="inline h-4 w-4" /> Informes
                            </button>
                          </>
                        ) : (
                          <button disabled title="Disponible al finalizar y calcular la aplicación" className={resultsButtonClass(false)}>
                            <BarChart3 className="inline h-4 w-4" /> Resultados
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {editOpen && (
        <EmpresaEditDrawer
          empresa={empresa}
          onClose={() => setEditOpen(false)}
          onSaved={(updated) => {
            setEmpresa(updated);
            setEditOpen(false);
            notify({
              type: "success",
              title: "Empresa actualizada",
              message: "La información quedó guardada y ya está visible en el perfil.",
            });
          }}
          onError={(message) => notify({ type: "error", title: "No fue posible guardar", message })}
        />
      )}
    </main>
  );
}

function EmpresaEditDrawer({ empresa, onClose, onSaved, onError }: { empresa: EmpresaPsico; onClose: () => void; onSaved: (empresa: EmpresaPsico) => void; onError: (message: string) => void }) {
  const { empresaId = "" } = useParams();
  const [form, setForm] = useState<ActualizarEmpresaPayload>({
    nombre: empresa.nombre || "",
    razon_social: empresa.razon_social || "",
    nit: empresa.nit || "",
    email: empresa.email || "",
    telefono: empresa.telefono || "",
    direccion: empresa.direccion || "",
    ciudad: empresa.ciudad || "",
    pais: empresa.pais || "Colombia",
    sitio_web: empresa.sitio_web || "",
    representante_legal: empresa.representante_legal || "",
    actividad_economica: empresa.actividad_economica || "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setValue = (field: keyof ActualizarEmpresaPayload, value: string) => {
    setError(null);
    setForm((current) => ({ ...current, [field]: value }));
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!String(form.nombre || "").trim()) {
      setError("El nombre de la empresa es obligatorio.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const payload = normalizePayload(form);
      const response = await psicoAdminService.actualizarEmpresa(empresaId, payload);
      if (!response?.ok || !response.empresa || !companyUpdateWasPersisted(response.empresa, payload)) {
        throw new Error("El servidor no confirmó todos los cambios. Intenta nuevamente.");
      }
      onSaved(response.empresa);
    } catch (err: any) {
      onError(err?.message || "No fue posible guardar la información.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/45 backdrop-blur-sm">
      <button type="button" className="absolute inset-0 cursor-default" onClick={onClose} aria-label="Cerrar edición" />
      <aside className="relative h-full w-full max-w-2xl overflow-y-auto bg-white p-6 shadow-2xl">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-brand-primary">Editar empresa</p>
            <h2 className="mt-1 text-2xl font-black text-slate-950">Completar información base</h2>
            <p className="mt-2 text-sm text-slate-500">Estos datos identifican a la empresa en ABRIL360. No modifican aplicaciones, resultados ni reportes calculados.</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-2xl border p-2 hover:bg-slate-50"><X className="h-5 w-5" /></button>
        </div>

        <form onSubmit={submit} className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Nombre comercial *"><Input value={form.nombre || ""} onChange={(value) => setValue("nombre", value)} /></Field>
            <Field label="Razón social"><Input value={form.razon_social || ""} onChange={(value) => setValue("razon_social", value)} /></Field>
            <Field label="NIT"><Input value={form.nit || ""} onChange={(value) => setValue("nit", value)} /></Field>
            <Field label="Correo"><Input type="email" value={form.email || ""} onChange={(value) => setValue("email", value)} /></Field>
            <Field label="Teléfono"><Input value={form.telefono || ""} onChange={(value) => setValue("telefono", value)} /></Field>
            <Field label="Ciudad"><Input value={form.ciudad || ""} onChange={(value) => setValue("ciudad", value)} /></Field>
            <Field label="País"><Input value={form.pais || ""} onChange={(value) => setValue("pais", value)} /></Field>
            <Field label="Sitio web"><Input value={form.sitio_web || ""} onChange={(value) => setValue("sitio_web", value)} /></Field>
          </div>
          <Field label="Dirección"><Input value={form.direccion || ""} onChange={(value) => setValue("direccion", value)} /></Field>
          <Field label="Representante legal"><Input value={form.representante_legal || ""} onChange={(value) => setValue("representante_legal", value)} /></Field>
          <Field label="Actividad económica">
            <textarea
              value={form.actividad_economica || ""}
              onChange={(event) => setValue("actividad_economica", event.target.value)}
              rows={3}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-brand-primary focus:ring-4 focus:ring-accent"
            />
          </Field>
          {error && <div className="rounded-2xl border border-red-200 bg-red-50 p-3 text-sm font-bold text-red-700">{error}</div>}
          <div className="flex justify-end gap-3 border-t pt-5">
            <button type="button" onClick={onClose} className="rounded-2xl border px-5 py-3 font-bold hover:bg-slate-50">Cancelar</button>
            <button disabled={saving} className="inline-flex items-center gap-2 rounded-2xl bg-brand-primary hover:bg-primary-hover px-6 py-3 font-bold text-white disabled:opacity-60">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Guardar cambios
            </button>
          </div>
        </form>
      </aside>
    </div>
  );
}

export function normalizePayload(payload: ActualizarEmpresaPayload): ActualizarEmpresaPayload {
  return Object.fromEntries(
    Object.entries(payload).map(([key, value]) => [key, typeof value === "string" ? value.trim() || null : value])
  ) as ActualizarEmpresaPayload;
}

export function companyUpdateWasPersisted(empresa: EmpresaPsico, payload: ActualizarEmpresaPayload) {
  return Object.entries(payload).every(([field, expected]) => {
    if (expected == null) return true;
    const actual = empresa[field as keyof EmpresaPsico];
    return String(actual ?? "").trim() === String(expected).trim();
  });
}

function Metric({ label, value }: { label: string; value: number }) {
  return <div className="border-r border-slate-200 p-4 last:border-r-0"><p className="text-2xl font-black">{value.toLocaleString("es-CO")}</p><p className="text-xs text-slate-500">{label}</p></div>;
}

function Info({ label, value }: { label: string; value: string }) {
  return <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">{label}</p><p className="mt-1 break-words font-semibold text-slate-800">{value}</p></div>;
}

function Action({ icon, title, desc, onClick }: { icon: ReactNode; title: string; desc: string; onClick: () => void }) {
  return <button onClick={onClick} className="flex w-full items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm hover:bg-slate-50"><span className="text-brand-primary">{icon}</span><span><strong className="block text-slate-950">{title}</strong><span className="text-xs text-slate-500">{desc}</span></span></button>;
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return <label className="block space-y-1 text-sm font-bold text-slate-700"><span>{label}</span>{children}</label>;
}

function Input({ value, onChange, type = "text" }: { value: string; onChange: (value: string) => void; type?: string }) {
  return <input type={type} value={value} onChange={(event) => onChange(event.target.value)} className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-brand-primary focus:ring-4 focus:ring-accent" />;
}
