import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { AlertCircle, BarChart3, Building2, ClipboardList, Eye, Loader2, Plus, Search, Users, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { EmpresaAsignada } from "@/features/psicosocial/api/psicoAccessService";
import { usePsicoEmpresaActiva } from "@/features/psicosocial/context/PsicoEmpresaActivaContext";

function n(value: unknown) {
  const num = Number(value ?? 0);
  return Number.isFinite(num) ? num : 0;
}

export default function EmpresasPsicoPage() {
  const navigate = useNavigate();
  const { empresas, loading, error, errorStatus, onboardingRequired, message, crearEmpresa, recargarEmpresas } = usePsicoEmpresaActiva();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return empresas;
    return empresas.filter((e) => `${e.nombre} ${e.nit ?? ""} ${e.ciudad ?? ""}`.toLowerCase().includes(term));
  }, [empresas, q]);

  const showEmpty = !loading && !error && empresas.length === 0;

  return (
    <div className="space-y-6">
      <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-100 text-violet-700"><Building2 className="h-7 w-7" /></div>
            <div><h1 className="text-3xl font-black text-slate-950">Empresas</h1><p className="text-sm text-slate-500">Crea y administra empresas vinculadas a tu perfil de psicólogo.</p></div>
          </div>
          <button type="button" onClick={() => setOpen(true)} className="inline-flex items-center gap-2 rounded-xl bg-violet-700 px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-violet-800"><Plus className="h-4 w-4" /> Nueva empresa</button>
        </div>
      </section>

      <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3"><Search className="h-4 w-4 text-slate-400" /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar empresa, NIT o ciudad..." className="w-full outline-none" /></div>

        {errorStatus === 401 && <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">Tu sesión no está autorizando esta consulta. Vuelve a iniciar sesión para renovar la cookie segura.</div>}
        {error && errorStatus !== 401 && <div className="mb-4 flex items-start justify-between gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"><div className="flex gap-2"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /><span>{error}</span></div><button type="button" onClick={() => void recargarEmpresas()} className="font-bold hover:underline">Reintentar</button></div>}

        {loading ? (
          <div className="flex items-center justify-center gap-2 p-10 text-slate-500"><Loader2 className="h-4 w-4 animate-spin" /> Cargando empresas...</div>
        ) : showEmpty ? (
          <EmptyState onboardingRequired={onboardingRequired} message={message} onCreate={() => setOpen(true)} />
        ) : (
          <div className="overflow-hidden rounded-2xl border border-slate-200">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-4 py-3">Empresa</th><th className="px-4 py-3">Rol / Permisos</th><th className="px-4 py-3">Empleados</th><th className="px-4 py-3">Aplicaciones</th><th className="px-4 py-3">Resultados</th><th className="px-4 py-3 text-right">Acciones</th></tr></thead>
              <tbody className="divide-y divide-slate-100">{filtered.map((e) => <EmpresaRow key={e.empresa_id} empresa={e} onView={() => navigate(`/psicosocial/empresas/${e.empresa_id}`)} />)}</tbody>
            </table>
          </div>
        )}
      </section>

      <CrearEmpresaDrawer open={open} onClose={() => setOpen(false)} onCreate={async (payload) => { const result = await crearEmpresa(payload); setOpen(false); const empresaId = result?.empresa_id; if (empresaId) navigate(`/psicosocial/empresas/${empresaId}`); }} />
    </div>
  );
}

function EmpresaRow({ empresa, onView }: { empresa: EmpresaAsignada; onView: () => void }) {
  const empleados = n((empresa as any).empleados);
  const aplicaciones = n((empresa as any).aplicaciones);
  const resultados = n((empresa as any).resultados ?? (empresa as any).evaluaciones_calculadas);
  return (
    <tr className="hover:bg-slate-50">
      <td className="px-4 py-4"><button onClick={onView} className="font-black text-slate-950 hover:text-violet-700 hover:underline">{empresa.nombre}</button><p className="text-xs text-slate-500">NIT {empresa.nit || "Sin dato"} · {empresa.estado || "Activa"}</p></td>
      <td className="px-4 py-4 text-slate-600"><span className="rounded-full bg-violet-50 px-2 py-1 text-xs font-bold text-violet-700">{empresa.rol_en_empresa || "PSICOLOGO_EVALUADOR"}</span><div className="mt-2 flex flex-wrap gap-1 text-[11px]">{empresa.puede_ver_individuales && <Badge>Individuales</Badge>}{empresa.puede_cargar_respuestas && <Badge>Carga</Badge>}{empresa.puede_crear_aplicaciones && <Badge>Aplicaciones</Badge>}{empresa.puede_validar_informes && <Badge>Validación</Badge>}</div></td>
      <td className="px-4 py-4"><Metric icon={<Users className="h-4 w-4 text-violet-600" />} value={empleados} /></td>
      <td className="px-4 py-4"><Metric icon={<ClipboardList className="h-4 w-4 text-violet-600" />} value={aplicaciones} /></td>
      <td className="px-4 py-4"><Metric icon={<BarChart3 className="h-4 w-4 text-violet-600" />} value={resultados} /></td>
      <td className="px-4 py-4 text-right"><button onClick={onView} className="inline-flex items-center gap-2 rounded-xl border px-3 py-2 font-bold hover:bg-slate-50"><Eye className="h-4 w-4" /> Ver</button></td>
    </tr>
  );
}

function Metric({ icon, value }: { icon: ReactNode; value: number }) { return <span className="inline-flex items-center gap-2 font-black text-slate-950">{icon}{value.toLocaleString("es-CO")}</span>; }
function Badge({ children }: { children: ReactNode }) { return <span className="rounded-full bg-slate-100 px-2 py-0.5 font-bold text-slate-600">{children}</span>; }

function EmptyState({ onboardingRequired, message, onCreate }: { onboardingRequired: boolean; message?: string | null; onCreate: () => void }) { return <div className="rounded-3xl border border-dashed border-violet-200 bg-violet-50/60 p-10 text-center"><div className="mx-auto grid h-16 w-16 place-items-center rounded-3xl bg-white text-violet-700 shadow-sm"><Building2 className="h-8 w-8" /></div><h2 className="mt-4 text-2xl font-black text-slate-950">{onboardingRequired ? "Crea tu primera empresa" : "No hay empresas para mostrar"}</h2><p className="mx-auto mt-2 max-w-2xl text-sm text-slate-600">{message || "Al crear una empresa desde este módulo quedará vinculada automáticamente a tu perfil de psicólogo y podrás iniciar el flujo de empleados, aplicaciones, respuestas y resultados."}</p><button type="button" onClick={onCreate} className="mt-6 inline-flex items-center gap-2 rounded-xl bg-violet-700 px-5 py-3 text-sm font-black text-white hover:bg-violet-800"><Plus className="h-4 w-4" /> Crear empresa</button></div>; }

function CrearEmpresaDrawer({ open, onClose, onCreate }: { open: boolean; onClose: () => void; onCreate: (payload: { nombre: string; nit?: string | null }) => Promise<void>; }) {
  const [nombre, setNombre] = useState("");
  const [nit, setNit] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  if (!open) return null;
  const submit = async (ev: React.FormEvent) => { ev.preventDefault(); setError(null); if (nombre.trim().length < 2) { setError("El nombre de la empresa debe tener al menos 2 caracteres."); return; } setSubmitting(true); try { await onCreate({ nombre, nit: nit || null }); setNombre(""); setNit(""); } catch (err) { setError(err instanceof Error ? err.message : "No fue posible crear la empresa."); } finally { setSubmitting(false); } };
  return <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/40 backdrop-blur-sm"><button type="button" className="absolute inset-0 cursor-default" onClick={onClose} aria-label="Cerrar" /><aside className="relative h-full w-full max-w-xl overflow-y-auto bg-white p-6 shadow-2xl"><div className="flex items-start justify-between gap-4"><div><div className="text-sm font-bold uppercase tracking-wide text-violet-600">Nueva empresa</div><h2 className="mt-1 text-3xl font-black text-slate-950">Crear empresa vinculada</h2><p className="mt-2 text-sm text-slate-500">Esta empresa quedará asociada automáticamente a tu usuario psicólogo para operar el módulo psicosocial.</p></div><button type="button" onClick={onClose} className="rounded-full border p-2 hover:bg-slate-50"><X className="h-5 w-5" /></button></div><form onSubmit={submit} className="mt-8 space-y-5"><label className="block text-sm font-bold text-slate-700">Nombre o razón social *<input value={nombre} onChange={(e) => setNombre(e.target.value)} className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-violet-500" placeholder="Ej. Constructora Andina S.A.S." /></label><label className="block text-sm font-bold text-slate-700">NIT<input value={nit} onChange={(e) => setNit(e.target.value)} className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-violet-500" placeholder="Ej. 900123456-7" /></label>{error && <div className="rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}<div className="flex justify-end gap-3 pt-6"><button type="button" onClick={onClose} className="rounded-xl border px-4 py-2 font-bold">Cancelar</button><button disabled={submitting} className="rounded-xl bg-violet-700 px-5 py-2 font-bold text-white disabled:opacity-60">{submitting ? "Creando..." : "Crear y vincular"}</button></div></form></aside></div>;
}
