import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Building2, Users, BriefcaseBusiness, BarChart3, Plus, Eye, FileText } from "lucide-react";
import { psicoAdminService, EmpresaPsico, AplicacionEmpresa } from "@/features/psicosocial/api/psicoAdminService";

function n(value: unknown) { const num = Number(value ?? 0); return Number.isFinite(num) ? num : 0; }

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

  useEffect(() => {
    if (!empresaId) return;
    setLoading(true);
    setError(null);
    psicoAdminService.perfilEmpresa(empresaId).then((r) => { setEmpresa(r.empresa); setResumen(r.resumen || {}); setApps(r.aplicaciones_recientes || []); }).catch((e) => setError(e.message || "No fue posible cargar la empresa")).finally(() => setLoading(false));
  }, [empresaId]);

  if (loading) return <main className="min-h-screen bg-slate-50 p-8 text-slate-500">Cargando perfil de empresa...</main>;
  if (error || !empresa) return <main className="min-h-screen bg-slate-50 p-8 text-red-700">{error || "Empresa no encontrada"}</main>;

  return (
    <main className="min-h-screen bg-slate-50 p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="grid gap-5 lg:grid-cols-[1fr_420px]">
            <div className="flex items-start gap-5"><div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-violet-100 text-violet-700"><Building2 className="h-10 w-10" /></div><div><h1 className="text-3xl font-black text-slate-950">{empresa.nombre}</h1><p className="mt-1 text-sm text-slate-500">NIT {empresa.nit || "Sin dato"} · {empresa.ciudad || "Sin ciudad"} · {empresa.email || "Sin correo"}</p><span className="mt-3 inline-flex whitespace-nowrap rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">{empresa.estado || "Activa"}</span></div></div>
            <div className="grid grid-cols-3 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 text-center"><Metric label="Empleados" value={n(resumen.empleados)} /><Metric label="Aplicaciones" value={n(resumen.aplicaciones)} /><Metric label="Con resultados" value={n(resumen.aplicaciones_con_resultados)} /></div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"><h2 className="text-xl font-black text-slate-950">Información de la empresa</h2><div className="mt-5 grid gap-4 md:grid-cols-2"><Info label="Razón social" value={empresa.razon_social || empresa.nombre} /><Info label="Dirección" value={(empresa as any).direccion || "Sin dato"} /><Info label="Teléfono" value={empresa.telefono || "Sin dato"} /><Info label="País" value={empresa.pais || "Colombia"} /><Info label="Representante legal" value={(empresa as any).representante_legal || "Sin dato"} /><Info label="Actividad económica" value={(empresa as any).actividad_economica || "Sin dato"} /></div></div>
          <aside className="space-y-4"><Action icon={<Plus />} title="Nueva batería" desc="Crear aplicación A/B + Extra + Estrés" onClick={() => navigate(`/psicosocial/empresas/${empresaId}/aplicaciones`)} /><Action icon={<BriefcaseBusiness />} title="Áreas y cargos" desc="Gestionar estructura de colaboradores" onClick={() => navigate(`/psicosocial/empresas/${empresaId}/areas-cargos`)} /><Action icon={<Users />} title="Ver empleados" desc="Listado y perfiles de colaboradores" onClick={() => navigate(`/psicosocial/empresas/${empresaId}/empleados`)} /><Action icon={<BarChart3 />} title="Resultados" desc="Dashboard por aplicación" onClick={() => navigate(`/psicosocial/resultados`)} /></aside>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between"><h2 className="text-xl font-black text-slate-950">Aplicaciones recientes</h2><button onClick={() => navigate(`/psicosocial/empresas/${empresaId}/aplicaciones`)} className="text-sm font-bold text-violet-700 hover:underline">Ver todas</button></div>
          <div className="overflow-hidden rounded-2xl border border-slate-200"><table className="min-w-full text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="px-4 py-3">Nombre</th><th className="px-4 py-3">Estado</th><th className="px-4 py-3">Participantes</th><th className="px-4 py-3">Instrumentos</th><th className="px-4 py-3 text-right">Acciones</th></tr></thead><tbody className="divide-y divide-slate-100">{apps.length === 0 && <tr><td colSpan={5} className="px-4 py-10 text-center text-slate-500">No hay aplicaciones recientes.</td></tr>}{apps.map((a) => <tr key={a.id} className="hover:bg-slate-50"><td className="px-4 py-4"><Link to={`/psicosocial/empresas/${empresaId}/aplicaciones/${a.id}`} className="font-black text-slate-950 hover:text-violet-700 hover:underline">{a.nombre}</Link><p className="text-xs text-slate-500">Aplicación #{a.id}</p></td><td className="px-4 py-4"><span className="inline-flex whitespace-nowrap rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-bold text-slate-700">{estadoLabel(a.estado)}</span></td><td className="px-4 py-4 font-bold">{n((a as any).participantes ?? a.participantes_calculados)}</td><td className="px-4 py-4 text-xs text-slate-500">{(a.evaluaciones || []).length || "—"}</td><td className="px-4 py-4 text-right"><div className="flex justify-end gap-2"><button onClick={() => navigate(`/psicosocial/empresas/${empresaId}/aplicaciones/${a.id}`)} className="rounded-xl border px-3 py-2 font-bold hover:bg-slate-50"><Eye className="inline h-4 w-4" /> Detalle</button>{isFinalizada(a.estado) ? <><button onClick={() => navigate(`/psicosocial/resultados?aplicacionId=${a.id}`)} className={resultsButtonClass(true)}><BarChart3 className="inline h-4 w-4" /> Resultados</button><button onClick={() => navigate(`/psicosocial/reportes-oficiales?aplicacionId=${a.id}&tipo=resultados`)} className="rounded-xl border px-3 py-2 font-bold hover:bg-slate-50"><FileText className="inline h-4 w-4" /> Informes</button></> : <button disabled title="Disponible al finalizar y calcular la aplicación" className={resultsButtonClass(false)}><BarChart3 className="inline h-4 w-4" /> Resultados</button>}</div></td></tr>)}</tbody></table></div>
        </section>
      </div>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: number }) { return <div className="border-r border-slate-200 p-4 last:border-r-0"><p className="text-2xl font-black">{value.toLocaleString("es-CO")}</p><p className="text-xs text-slate-500">{label}</p></div>; }
function Info({ label, value }: { label: string; value: string }) { return <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">{label}</p><p className="mt-1 font-semibold text-slate-800">{value}</p></div>; }
function Action({ icon, title, desc, onClick }: { icon: any; title: string; desc: string; onClick: () => void }) { return <button onClick={onClick} className="flex w-full items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm hover:bg-slate-50"><span className="text-violet-700">{icon}</span><span><strong className="block text-slate-950">{title}</strong><span className="text-xs text-slate-500">{desc}</span></span></button>; }
