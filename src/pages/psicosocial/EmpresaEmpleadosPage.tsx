import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Search, Upload, UserRound, ArrowLeft } from "lucide-react";
import { psicoAdminService, EmpleadoEmpresa } from "@/features/psicosocial/api/psicoAdminService";

export default function EmpresaEmpleadosPage() {
  const { empresaId = "" } = useParams();
  const navigate = useNavigate();
  const [items, setItems] = useState<EmpleadoEmpresa[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!empresaId) return;
    setLoading(true);
    psicoAdminService.empleadosEmpresa(empresaId)
      .then((r) => setItems(r.items || []))
      .catch((e) => setError(e.message || "No fue posible cargar empleados"))
      .finally(() => setLoading(false));
  }, [empresaId]);

  const filtered = useMemo(() => {
    const term = q.toLowerCase().trim();
    if (!term) return items;
    return items.filter((x) => `${x.nombre} ${x.cedula} ${x.area} ${x.cargo}`.toLowerCase().includes(term));
  }, [items, q]);

  return (
    <main className="min-h-screen bg-slate-50 p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <button onClick={() => navigate(`/psicosocial/empresas/${empresaId}`)} className="inline-flex items-center gap-2 rounded-xl border bg-white px-4 py-2 text-sm font-bold shadow-sm"><ArrowLeft className="h-4 w-4" /> Volver a empresa</button>
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-3xl font-black text-slate-950">Empleados</h1>
              <p className="text-sm text-slate-500">Listado de colaboradores vinculados a la empresa.</p>
            </div>
            <button className="inline-flex items-center gap-2 rounded-xl bg-violet-700 px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-violet-800"><Upload className="h-4 w-4" /> Carga masiva</button>
          </div>
        </section>
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3"><Search className="h-4 w-4 text-slate-400" /><input value={q} onChange={(e)=>setQ(e.target.value)} className="w-full outline-none" placeholder="Buscar por cédula, nombre, área o cargo..." /></div>
          {error && <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">{error}</div>}
          {loading ? <div className="p-8 text-center text-slate-500">Cargando empleados...</div> : (
            <div className="overflow-hidden rounded-2xl border border-slate-200">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="px-4 py-3">Colaborador</th><th className="px-4 py-3">Área / cargo</th><th className="px-4 py-3">Contacto</th><th className="px-4 py-3">Estado</th></tr></thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((e) => <tr key={e.id} className="hover:bg-slate-50">
                    <td className="px-4 py-4"><button onClick={() => navigate(`/psicosocial/empleados/${e.id}`)} className="inline-flex items-center gap-3 text-left"><span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-violet-100 text-violet-700"><UserRound className="h-5 w-5" /></span><span><strong className="block hover:text-violet-700 hover:underline">{e.nombre}</strong><span className="text-xs text-slate-500">CC {e.cedula}</span></span></button></td>
                    <td className="px-4 py-4"><strong>{e.area}</strong><br/><span className="text-slate-500">{e.cargo}</span></td>
                    <td className="px-4 py-4 text-slate-600">{e.email || "Sin correo"}<br/>{e.telefono || "Sin teléfono"}</td>
                    <td className="px-4 py-4"><span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">{e.activo === false ? "Inactivo" : "Activo"}</span></td>
                  </tr>)}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
