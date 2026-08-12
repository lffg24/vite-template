import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BarChart3, Building2, CalendarDays, ClipboardCheck, FileText, Loader2, MessageCircle, Plus, RefreshCw, Upload, Users, WalletCards } from "lucide-react";
import { psicoAdminService, type CreditosResumen, type EmpresaPsico } from "@/features/psicosocial/api/psicoAdminService";

function n(value: unknown) { const num = Number(value ?? 0); return Number.isFinite(num) ? num : 0; }

export const CREDIT_PURCHASE_WHATSAPP_URL = "https://wa.me/573002458438";

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
    <section className="rounded-[28px] border border-border/70 bg-surface p-7 shadow-card">
      <div className="flex flex-wrap items-start justify-between gap-4">
      <div><p className="text-sm font-black uppercase tracking-[0.18em] text-brand-primary">Panel del psicólogo</p><h1 className="mt-2 text-4xl font-black tracking-tight text-foreground">Dashboard <span className="marker-highlight">psicosocial</span></h1><p className="mt-2 max-w-4xl text-muted-foreground">Resumen general de empresas, aplicaciones, participantes, captura, resultados e informes. La operación sigue siendo independiente por empresa y batería.</p></div>
        <button onClick={load} className="inline-flex items-center gap-2 rounded-2xl border border-border bg-surface px-4 py-3 text-sm font-black text-foreground-soft hover:bg-surface-subtle"><RefreshCw className="h-4 w-4" /> Actualizar</button>
      </div>
    </section>
    {error && <section className="rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">{error}</section>}
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
      <Metric icon={<Building2 />} label="Empresas activas" value={loading ? "—" : stats.empresasActivas} sub="vinculadas" />
      <Metric icon={<ClipboardCheck />} label="Aplicaciones" value={loading ? "—" : stats.aplicaciones} sub="baterías creadas" />
      <Metric icon={<Users />} label="Empleados" value={loading ? "—" : stats.empleados} sub="registrados" />
      <Metric icon={<BarChart3 />} label="Con resultados" value={loading ? "—" : stats.resultados} sub="calculados" />
      <Metric icon={<FileText />} label="Informes" value={loading ? "—" : stats.resultados} sub="listos para revisar" />
      <Metric icon={<CalendarDays />} label="Agenda" value="—" sub="próximamente" />
    </section>
    <section className="grid gap-6 xl:grid-cols-[1fr_1.2fr]">
      <article className="rounded-[28px] border border-border/70 bg-surface p-6 shadow-card">
        <div className="flex items-start justify-between gap-4"><div><h2 className="text-xl font-black text-foreground">Créditos para aplicaciones</h2><p className="mt-1 text-sm text-muted-foreground">Saldos cargados desde el ledger formal de créditos.</p></div><WalletCards className="h-8 w-8 text-brand-primary" /></div>
        <div className="mt-6 grid gap-5 md:grid-cols-[190px_1fr]"><div className="grid h-44 w-44 place-items-center rounded-full border-[18px] border-brand-primary/12 bg-accent/70"><div className="text-center"><p className="text-4xl font-black text-foreground">{loading ? "—" : stats.creditosDisponibles.toLocaleString("es-CO")}</p><p className="text-sm font-bold text-muted-foreground">Disponibles</p></div></div><div className="space-y-3 text-sm"><Row label="Asignados" value={loading ? "—" : stats.creditosAsignados.toLocaleString("es-CO")} /><Row label="Consumidos" value={loading ? "—" : stats.creditosUsados.toLocaleString("es-CO")} /><Row label="Disponibles" value={loading ? "—" : stats.creditosDisponibles.toLocaleString("es-CO")} tone="text-success" /><Row label="Registros consumidos" value={loading ? "—" : stats.registrosConsumidos.toLocaleString("es-CO")} /><a href={CREDIT_PURCHASE_WHATSAPP_URL} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-2 rounded-2xl bg-primary px-5 py-3 font-black text-primary-foreground hover:bg-primary-hover"><MessageCircle className="h-4 w-4" /> Comprar más créditos</a></div></div>
      </article>
      <article className="rounded-[28px] border border-border/70 bg-surface p-6 shadow-card">
        <div className="mb-4 flex items-center justify-between"><h2 className="text-xl font-black text-foreground">Mis empresas</h2><button onClick={() => navigate('/psicosocial/empresas')} className="text-sm font-black text-brand-primary hover:underline">Ver todas</button></div>
        <div className="overflow-hidden rounded-2xl border border-border/70"><table className="min-w-full text-left text-sm"><thead className="bg-surface-subtle text-xs uppercase text-muted-foreground"><tr><th className="px-4 py-3">Empresa</th><th className="px-4 py-3">Empleados</th><th className="px-4 py-3">Aplicaciones</th><th className="px-4 py-3">Resultados</th></tr></thead><tbody className="divide-y divide-border/60">{loading && <tr><td colSpan={4} className="p-8 text-center text-muted-foreground"><Loader2 className="mr-2 inline h-4 w-4 animate-spin" />Cargando...</td></tr>}{!loading && empresas.slice(0, 5).map((e) => <tr key={e.id} className="hover:bg-surface-subtle/70"><td className="px-4 py-4"><button onClick={() => navigate(`/psicosocial/empresas/${e.id}`)} className="font-black text-foreground hover:text-brand-primary hover:underline">{e.nombre}</button><p className="text-xs text-muted-foreground">NIT {e.nit || 'Sin dato'}</p></td><td className="px-4 py-4 font-bold">{n(e.empleados)}</td><td className="px-4 py-4 font-bold">{n(e.aplicaciones)}</td><td className="px-4 py-4 font-bold">{n(e.evaluaciones_calculadas)}</td></tr>)}</tbody></table></div>
      </article>
    </section>
    <section className="rounded-[28px] border border-border/70 bg-surface p-6 shadow-card"><h2 className="text-xl font-black text-foreground">Acciones rápidas</h2><div className="mt-4 grid gap-4 md:grid-cols-6"><Action icon={<Plus />} label="Nueva empresa" onClick={() => navigate('/psicosocial/empresas')} /><Action icon={<ClipboardCheck />} label="Nueva batería" onClick={() => navigate('/psicosocial/empresas')} /><Action icon={<Upload />} label="Carga masiva" onClick={() => navigate('/psicosocial/empresas')} /><Action icon={<Users />} label="Ver participantes" onClick={() => navigate('/psicosocial/empresas')} /><Action icon={<BarChart3 />} label="Resultados" onClick={() => navigate('/psicosocial/resultados')} /><Action icon={<FileText />} label="Informes" onClick={() => navigate('/psicosocial/reportes-oficiales')} /></div></section>
  </main>;
}
function Metric({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string | number; sub: string }) { return <article className="rounded-[24px] border border-border/70 bg-surface p-5 shadow-card"><div className="flex items-start gap-4"><div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-accent text-brand-primary">{icon}</div><div className="min-w-0"><p className="text-sm font-bold leading-6 text-muted-foreground">{label}</p><p className="mt-1 text-3xl font-black leading-none text-foreground">{typeof value === 'number' ? value.toLocaleString('es-CO') : value}</p><p className="mt-2 text-xs font-semibold text-muted-foreground">{sub}</p></div></div></article>; }
function Row({ label, value, tone = 'text-foreground' }: { label: string; value: string | number; tone?: string }) { return <div className="flex justify-between gap-4 rounded-xl bg-surface-subtle px-3 py-2"><span className="text-muted-foreground">{label}</span><b className={tone}>{value}</b></div>; }
function Action({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) { return <button onClick={onClick} className="rounded-2xl border border-border bg-surface-subtle p-4 text-center font-black text-foreground-soft hover:border-brand-primary/20 hover:bg-accent hover:text-brand-primary"><div className="mx-auto mb-2 grid h-10 w-10 place-items-center rounded-2xl bg-surface text-brand-primary shadow-sm">{icon}</div>{label}</button>; }
