import { useEffect, useMemo, useState } from "react";
import { Building2, Plus, Search, Users, ClipboardList, BarChart3, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { psicoAdminService, EmpresaPsico } from "@/features/psicosocial/api/psicoAdminService";

export default function EmpresasPsicoPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState<EmpresaPsico[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    psicoAdminService
      .listarEmpresas(true)
      .then((r) => setItems(r.items || []))
      .catch((e) => setError(e.message || "No fue posible cargar empresas"))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return items;
    return items.filter((e) => `${e.nombre} ${e.nit} ${e.ciudad}`.toLowerCase().includes(term));
  }, [items, q]);

  return (
    <main className="min-h-screen bg-slate-50 p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-100 text-violet-700">
                <Building2 className="h-7 w-7" />
              </div>
              <div>
                <h1 className="text-3xl font-black text-slate-950">Empresas</h1>
                <p className="text-sm text-slate-500">Gestión multiempresa para riesgo psicosocial.</p>
              </div>
            </div>
            <button className="inline-flex items-center gap-2 rounded-xl bg-violet-700 px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-violet-800">
              <Plus className="h-4 w-4" /> Nueva empresa
            </button>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3">
            <Search className="h-4 w-4 text-slate-400" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar empresa, NIT o ciudad..."
              className="w-full outline-none"
            />
          </div>

          {error && <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}
          {loading ? (
            <div className="p-8 text-center text-slate-500">Cargando empresas...</div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-slate-200">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Empresa</th>
                    <th className="px-4 py-3">Contacto</th>
                    <th className="px-4 py-3">Empleados</th>
                    <th className="px-4 py-3">Aplicaciones</th>
                    <th className="px-4 py-3">Resultados</th>
                    <th className="px-4 py-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((e) => (
                    <tr key={e.id} className="hover:bg-slate-50">
                      <td className="px-4 py-4">
                        <button
                          onClick={() => navigate(`/psicosocial/empresas/${e.id}`)}
                          className="font-black text-slate-950 hover:text-violet-700 hover:underline"
                        >
                          {e.nombre}
                        </button>
                        <p className="text-xs text-slate-500">NIT {e.nit || "Sin dato"} · {e.estado || "Activa"}</p>
                      </td>
                      <td className="px-4 py-4 text-slate-600">{e.ciudad || "Sin ciudad"}<br />{e.email || "Sin correo"}</td>
                      <td className="px-4 py-4"><span className="inline-flex items-center gap-2 font-bold"><Users className="h-4 w-4 text-violet-600" />{e.empleados || 0}</span></td>
                      <td className="px-4 py-4"><span className="inline-flex items-center gap-2 font-bold"><ClipboardList className="h-4 w-4 text-violet-600" />{e.aplicaciones || 0}</span></td>
                      <td className="px-4 py-4"><span className="inline-flex items-center gap-2 font-bold"><BarChart3 className="h-4 w-4 text-violet-600" />{e.evaluaciones_calculadas || 0}</span></td>
                      <td className="px-4 py-4 text-right">
                        <button onClick={() => navigate(`/psicosocial/empresas/${e.id}`)} className="inline-flex items-center gap-2 rounded-xl border px-3 py-2 font-bold hover:bg-slate-50">
                          <Eye className="h-4 w-4" /> Ver
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
