import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ClipboardList, Plus, BarChart3 } from "lucide-react";
import { psicoAdminService, AplicacionEmpresa } from "@/features/psicosocial/api/psicoAdminService";

export default function EmpresaAplicacionesPage() {
  const { empresaId = "" } = useParams();
  const navigate = useNavigate();
  const [items, setItems] = useState<AplicacionEmpresa[]>([]);
  const [nombre, setNombre] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    psicoAdminService.aplicacionesEmpresa(empresaId).then((r) => setItems(r.items || [])).catch((e) => setError(e.message)).finally(() => setLoading(false));
  };
  useEffect(() => { if (empresaId) load(); }, [empresaId]);

  const crear = async () => {
    if (!nombre.trim()) return;
    setSaving(true);
    try {
      await psicoAdminService.crearBateria(empresaId, nombre.trim());
      setNombre("");
      load();
    } catch (e: any) { setError(e.message || "No fue posible crear batería"); }
    finally { setSaving(false); }
  };

  return <main className="min-h-screen bg-slate-50 p-6 lg:p-8"><div className="mx-auto max-w-7xl space-y-6">
    <button onClick={() => navigate(`/psicosocial/empresas/${empresaId}`)} className="inline-flex items-center gap-2 rounded-xl border bg-white px-4 py-2 text-sm font-bold shadow-sm"><ArrowLeft className="h-4 w-4" /> Volver a empresa</button>
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"><h1 className="text-3xl font-black">Aplicaciones de batería</h1><p className="text-sm text-slate-500">Crea y consulta aplicaciones psicosociales por empresa. Cada batería crea A, B, Extralaboral y Estrés.</p></section>
    <section className="rounded-3xl border border-violet-100 bg-violet-50/60 p-5"><div className="flex flex-wrap items-center gap-3"><input value={nombre} onChange={(e)=>setNombre(e.target.value)} placeholder="Nombre de la nueva batería" className="min-w-[280px] flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none"/><button disabled={saving || !nombre.trim()} onClick={crear} className="inline-flex items-center gap-2 rounded-2xl bg-violet-700 px-5 py-3 font-bold text-white disabled:opacity-50"><Plus className="h-4 w-4" /> Crear batería</button></div>{error && <p className="mt-3 text-sm text-red-700">{error}</p>}</section>
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">{loading ? <div className="p-8 text-center text-slate-500">Cargando aplicaciones...</div> : <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{items.map((a)=><div key={a.id} className="rounded-2xl border border-slate-200 p-5"><div className="flex items-start justify-between gap-3"><div><ClipboardList className="mb-3 h-7 w-7 text-violet-700"/><h3 className="text-lg font-black">{a.nombre}</h3><p className="text-sm text-slate-500">#{a.id} · {a.estado}</p></div><span className="rounded-full border px-3 py-1 text-xs font-bold">{a.evaluaciones?.length || 0} evals</span></div><p className="mt-4 text-sm text-slate-600">Participantes calculados: <strong>{a.participantes_calculados || 0}</strong></p><button onClick={()=>navigate(`/psicosocial/empresas/${empresaId}/aplicaciones/${a.id}/resultados`)} className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border px-4 py-2 font-bold hover:bg-slate-50"><BarChart3 className="h-4 w-4"/> Ver resultados</button></div>)}</div>}</section>
  </div></main>;
}
