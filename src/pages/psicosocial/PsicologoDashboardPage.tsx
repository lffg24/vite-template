import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BarChart3, Building2, CalendarDays, ClipboardCheck, Coins, FileText, Loader2, Plus, RefreshCw, Upload, Users, WalletCards } from "lucide-react";
import { psicoAdminService, type CreditosResumen, type EmpresaPsico } from "@/features/psicosocial/api/psicoAdminService";

function n(value: unknown) { const num = Number(value ?? 0); return Number.isFinite(num) ? num : 0; }

export default function PsicologoDashboardPage() {
  const navigate = useNavigate();
  const [empresas, setEmpresas] = useState<EmpresaPsico[]>([]);
  const [creditos, setCreditos] = useState<CreditosResumen | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true); setError(null);
    try {
      const [empresasRes, creditosRes] = await Promise.all([
        psicoAdminService.listarEmpresas(true),
        psicoAdminService.creditosResumen(),
      ]);
      setEmpresas(empresasRes.items || []);
      setCreditos(creditosRes);
    }
    catch (e: any) { setError(e?.message || "No fue posible cargar el dashboard."); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const stats = useMemo(() => {
    const empresasActivas = empresas.length;
    const aplicaciones = empresas.reduce((acc, e) => acc + n(e.aplicaciones), 0);
    const empleados = empresas.reduce((acc, e) => acc + n(e.empleados), 0);
    const resultados = empresas.reduce((acc, e) => acc + n(e.evaluaciones_calculadas), 0);
    const creditosDisponibles = n(creditos?.saldo_actual);
    const creditosAsignados = n(creditos?.creditos_asignados);
    const creditosUsados = n(creditos?.creditos_consumidos);
    const registrosConsumidos = n(creditos?.registros_consumidos);
    return { empresasActivas, aplicaciones, empleados, resultados, creditosDisponibles, creditosAsignados, creditosUsados, registrosConsumidos };
  }, [empresas, creditos]);

  return <main className="space-y-6">
    <section className="rounded-[28px] border border-slate-200 bg-white p-7 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div><p className="text-sm font-black uppercase tracking-wide text-violet-600">Panel del psicólogo</p><h1 className="mt-2 text-4xl font-black tracking-tight text-slate-950">Dashboard psicosocial</h1><p className="mt-2 max-w-4xl text-slate-600">Resumen general de empresas, aplicaciones, participantes, captura, resultados e informes. La operación sigue siendo independiente por empresa y batería.</p></div>
        <button onClick={load} className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 hover:bg-slate-50"><RefreshCw className="h-4 w-4" /> Actualizar</button>
      </div>
    </section>
    {error && <section className="rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">{error}</section>}
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
      <Metric icon={<Building2 />} label="Empresas activas" value={loading ? "—" : stats.empresasActivas} sub="vinculadas" />
      <Metric icon={<ClipboardCheck />} label="Aplicaciones" value={loading ? "—" : stats.aplicaciones} sub="baterías creadas" />
      <Metric icon={<Users />} label="Empleados" value={loading ? "—" : stats.empleados} sub="registrados" />
      <Metric icon={<BarChart3 />} label="Con resultados" value={loading ? "—" : stats.resultados} sub="calculados" />
      <Metric icon={<FileText />} label="Informes" value="—" sub="pendientes" />
      <Metric icon={<CalendarDays />} label="Agenda" value="—" sub="próximamente" />
    </section>
    <section className="grid gap-6 xl:grid-cols-[1fr_1.2fr]">
      <article className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4"><div><h2 className="text-xl font-black text-slate-950">Créditos para aplicaciones</h2><p className="mt-1 text-sm text-slate-500">Saldos cargados desde el ledger formal de créditos.</p></div><WalletCards className="h-8 w-8 text-violet-700" /></div>
        <div className="mt-6 grid gap-5 md:grid-cols-[190px_1fr]"><div className="grid h-44 w-44 place-items-center rounded-full border-[18px] border-violet-200 bg-violet-50"><div className="text-center"><p className="text-4xl font-black text-slate-950">{loading ? "—" : stats.creditosDisponibles.toLocaleString("es-CO")}</p><p className="text-sm font-bold text-slate-500">Disponibles</p></div></div><div className="space-y-3 text-sm"><Row label="Asignados" value={loading ? "—" : stats.creditosAsignados.toLocaleString("es-CO")} /><Row label="Consumidos" value={loading ? "—" : stats.creditosUsados.toLocaleString("es-CO")} /><Row label="Disponibles" value={loading ? "—" : stats.creditosDisponibles.toLocaleString("es-CO")} tone="text-emerald-600" /><Row label="Registros consumidos" value={loading ? "—" : stats.registrosConsumidos.toLocaleString("es-CO")} /><button className="mt-3 rounded-2xl bg-violet-700 px-5 py-3 font-black text-white hover:bg-violet-800">Solicitar créditos</button></div></div>
      </article>
      <article className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between"><h2 className="text-xl font-black text-slate-950">Mis empresas</h2><button onClick={() => navigate('/psicosocial/empresas')} className="text-sm font-black text-violet-700 hover:underline">Ver todas</button></div>
        <div className="overflow-hidden rounded-2xl border border-slate-200"><table className="min-w-full text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="px-4 py-3">Empresa</th><th className="px-4 py-3">Empleados</th><th className="px-4 py-3">Aplicaciones</th><th className="px-4 py-3">Resultados</th></tr></thead><tbody className="divide-y divide-slate-100">{loading && <tr><td colSpan={4} className="p-8 text-center text-slate-500"><Loader2 className="mr-2 inline h-4 w-4 animate-spin" />Cargando...</td></tr>}{!loading && empresas.slice(0, 5).map((e) => <tr key={e.id} className="hover:bg-slate-50"><td className="px-4 py-4"><button onClick={() => navigate(`/psicosocial/empresas/${e.id}`)} className="font-black text-slate-900 hover:text-violet-700 hover:underline">{e.nombre}</button><p className="text-xs text-slate-500">NIT {e.nit || 'Sin dato'}</p></td><td className="px-4 py-4 font-bold">{n(e.empleados)}</td><td className="px-4 py-4 font-bold">{n(e.aplicaciones)}</td><td className="px-4 py-4 font-bold">{n(e.evaluaciones_calculadas)}</td></tr>)}</tbody></table></div>
      </article>
    </section>
    <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm"><h2 className="text-xl font-black text-slate-950">Acciones rápidas</h2><div className="mt-4 grid gap-4 md:grid-cols-5"><Action icon={<Plus />} label="Nueva empresa" onClick={() => navigate('/psicosocial/empresas')} /><Action icon={<ClipboardCheck />} label="Nueva batería" onClick={() => navigate('/psicosocial/empresas')} /><Action icon={<Upload />} label="Carga masiva" onClick={() => navigate('/psicosocial/empresas')} /><Action icon={<Users />} label="Ver participantes" onClick={() => navigate('/psicosocial/empresas')} /><Action icon={<BarChart3 />} label="Resultados" onClick={() => navigate('/psicosocial/resultados')} /></div></section>
  </main>;
}
function Metric({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string | number; sub: string }) { return <article className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm"><div className="mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-violet-50 text-violet-700">{icon}</div><p className="text-sm font-bold text-slate-500">{label}</p><p className="mt-1 text-3xl font-black text-slate-950">{typeof value === 'number' ? value.toLocaleString('es-CO') : value}</p><p className="mt-1 text-xs font-semibold text-slate-400">{sub}</p></article>; }
function Row({ label, value, tone = 'text-slate-800' }: { label: string; value: string | number; tone?: string }) { return <div className="flex justify-between gap-4 rounded-xl bg-slate-50 px-3 py-2"><span className="text-slate-500">{label}</span><b className={tone}>{value}</b></div>; }
function Action({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) { return <button onClick={onClick} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-center font-black text-slate-700 hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700"><div className="mx-auto mb-2 grid h-10 w-10 place-items-center rounded-2xl bg-white text-violet-700 shadow-sm">{icon}</div>{label}</button>; }
