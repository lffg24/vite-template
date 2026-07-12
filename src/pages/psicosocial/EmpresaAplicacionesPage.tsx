import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, BarChart3, CalendarDays, ClipboardList, FileText, Loader2, Plus, Search, X } from "lucide-react";
import { AplicacionEmpresa, CrearBateriaPayload, psicoAdminService } from "@/features/psicosocial/api/psicoAdminService";
import AbrilDatePicker from "@/features/psicosocial/components/AbrilDatePicker";

type FormState = {
  nombre: string;
  fecha_aplicacion: string;
  include_intra_a: boolean;
  include_intra_b: boolean;
  include_extra: boolean;
  include_estres: boolean;
};

const emptyForm: FormState = {
  nombre: "",
  fecha_aplicacion: "",
  include_intra_a: true,
  include_intra_b: true,
  include_extra: true,
  include_estres: true,
};

function instrumentLabel(code: string) {
  const labels: Record<string, string> = {
    PSICO_INTRA_A: "Forma A",
    PSICO_INTRA_B: "Forma B",
    PSICO_EXTRA: "Extralaboral",
    PSICO_ESTRES: "Estrés",
  };
  return labels[code] || code;
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

export default function EmpresaAplicacionesPage() {
  const { empresaId = "" } = useParams();
  const navigate = useNavigate();
  const [items, setItems] = useState<AplicacionEmpresa[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openCreate, setOpenCreate] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const load = async () => {
    if (!empresaId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await psicoAdminService.aplicacionesEmpresa(empresaId);
      setItems(res.items || []);
    } catch (e: any) {
      setError(e?.message || "No fue posible cargar aplicaciones.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [empresaId]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return items;
    return items.filter((a) => `${a.nombre} ${a.estado}`.toLowerCase().includes(term));
  }, [items, q]);

  const updateForm = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setFieldErrors((prev) => ({ ...prev, [key]: "" }));
  };

  const validate = () => {
    const next: Record<string, string> = {};
    if (!form.nombre.trim()) next.nombre = "Nombre de batería es obligatorio.";
    if (form.nombre.trim() && form.nombre.trim().length < 3) next.nombre = "Debe tener mínimo 3 caracteres.";
    if (!form.include_intra_a && !form.include_intra_b && !form.include_extra && !form.include_estres) {
      next.instrumentos = "Selecciona al menos un instrumento.";
    }
    setFieldErrors(next);
    return Object.keys(next).length === 0;
  };

  const crear = async (event: FormEvent) => {
    event.preventDefault();
    if (!validate()) return;
    setSaving(true);
    setError(null);
    try {
      const payload: CrearBateriaPayload = {
        nombre: form.nombre.trim(),
        fecha_aplicacion: form.fecha_aplicacion || undefined,
        include_intra_a: form.include_intra_a,
        include_intra_b: form.include_intra_b,
        include_extra: form.include_extra,
        include_estres: form.include_estres,
      };
      await psicoAdminService.crearBateria(empresaId, payload);
      setForm(emptyForm);
      setOpenCreate(false);
      await load();
    } catch (e: any) {
      setError(e?.message || "No fue posible crear la batería.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <button onClick={() => navigate(`/psicosocial/empresas/${empresaId}`)} className="inline-flex items-center gap-2 rounded-xl border bg-white px-4 py-2 text-sm font-bold shadow-sm">
          <ArrowLeft className="h-4 w-4" /> Volver a empresa
        </button>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-black text-slate-950">Aplicaciones de batería</h1>
              <p className="text-sm text-slate-500">Crea y consulta aplicaciones psicosociales por empresa. Cada aplicación puede incluir Forma A, Forma B, Extralaboral y Estrés.</p>
            </div>
            <button onClick={() => setOpenCreate(true)} className="inline-flex items-center gap-2 rounded-2xl bg-violet-700 px-5 py-3 text-sm font-bold text-white hover:bg-violet-800">
              <Plus className="h-4 w-4" /> Crear batería
            </button>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3">
            <Search className="h-4 w-4 text-slate-400" />
            <input value={q} onChange={(e) => setQ(e.target.value)} className="w-full outline-none" placeholder="Buscar por nombre o estado..." />
          </div>

          {error && <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}<button onClick={load} className="ml-3 font-bold underline">Reintentar</button></div>}

          {loading ? (
            <div className="p-8 text-center text-slate-500">Cargando aplicaciones...</div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-slate-200">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="px-4 py-3">Aplicación</th><th className="px-4 py-3">Instrumentos</th><th className="px-4 py-3">Participantes</th><th className="px-4 py-3">Estado</th><th className="px-4 py-3 text-right">Acciones</th></tr></thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.length === 0 && <tr><td colSpan={5} className="px-4 py-10 text-center text-slate-500">No hay aplicaciones registradas. Crea la primera batería para esta empresa.</td></tr>}
                  {filtered.map((a) => (
                    <tr key={a.id} className="hover:bg-slate-50">
                      <td className="px-4 py-4"><div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-violet-100 text-violet-700"><ClipboardList className="h-5 w-5" /></span><div><Link to={`/psicosocial/empresas/${empresaId}/aplicaciones/${a.id}`} className="block font-black text-slate-950 hover:text-violet-700 hover:underline">{a.nombre}</Link><span className="text-xs text-slate-500">#{a.id}{a.created_at || a.creado_en ? ` · ${new Date(a.created_at || a.creado_en || "").toLocaleDateString()}` : ""}</span></div></div></td>
                      <td className="px-4 py-4"><div className="flex flex-wrap gap-2">{(a.evaluaciones || []).length === 0 ? <span className="text-slate-400">Sin instrumentos</span> : a.evaluaciones?.map((ev) => <span key={`${a.id}-${ev.evaluacion_id}`} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">{instrumentLabel(ev.instrument_code)}</span>)}</div></td>
                      <td className="px-4 py-4 font-bold">{a.participantes ?? a.participantes_calculados ?? 0}</td>
                      <td className="px-4 py-4"><span className="inline-flex whitespace-nowrap rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-bold text-slate-700">{estadoLabel(a.estado)}</span></td>
                      <td className="px-4 py-4 text-right"><div className="flex justify-end gap-2"><button onClick={() => navigate(`/psicosocial/empresas/${empresaId}/aplicaciones/${a.id}`)} className="rounded-xl border px-4 py-2 font-bold hover:bg-slate-50">Detalle</button>{isFinalizada(a.estado) ? <><button onClick={() => navigate(`/psicosocial/resultados?aplicacionId=${a.id}`)} className="inline-flex items-center gap-2 rounded-xl border px-4 py-2 font-bold hover:bg-slate-50"><BarChart3 className="h-4 w-4" /> Resultados</button><button onClick={() => navigate(`/psicosocial/reportes-oficiales?aplicacionId=${a.id}&tipo=resultados`)} className="inline-flex items-center gap-2 rounded-xl border px-4 py-2 font-bold hover:bg-slate-50"><FileText className="h-4 w-4" /> Informes</button></> : <button disabled title="Disponible al finalizar y calcular la aplicación" className="inline-flex cursor-not-allowed items-center gap-2 rounded-xl border border-slate-200 bg-slate-100 px-4 py-2 font-bold text-slate-400"><BarChart3 className="h-4 w-4" /> Resultados</button>}</div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      {openCreate && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/45 backdrop-blur-sm">
          <aside className="h-full w-full max-w-xl overflow-y-auto bg-white p-6 shadow-2xl">
            <div className="mb-6 flex items-start justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-widest text-violet-700">Nueva aplicación</p><h2 className="text-2xl font-black text-slate-950">Crear batería psicosocial</h2><p className="mt-1 text-sm text-slate-500">La batería queda vinculada a esta empresa y crea las evaluaciones seleccionadas.</p></div><button onClick={() => setOpenCreate(false)} className="rounded-2xl border p-2 hover:bg-slate-50"><X className="h-5 w-5" /></button></div>
            <form onSubmit={crear} className="space-y-5">
              <label className="space-y-1 text-sm font-bold text-slate-700">Nombre de la batería *<input value={form.nombre} onChange={(e) => updateForm("nombre", e.target.value)} className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-3 font-normal outline-none focus:border-violet-500" placeholder="Ej. Batería planta operativa mayo 2026" />{fieldErrors.nombre && <span className="block text-xs font-semibold text-red-600">{fieldErrors.nombre}</span>}</label>
              <AbrilDatePicker label="Fecha de aplicación" value={form.fecha_aplicacion} onChange={(value) => updateForm("fecha_aplicacion", value)} />
              <div className="rounded-2xl border border-slate-200 p-4"><div className="mb-3 flex items-center gap-2 font-black"><CalendarDays className="h-4 w-4 text-violet-700" /> Instrumentos</div><div className="grid gap-3 sm:grid-cols-2">{([
                ["include_intra_a", "Intralaboral Forma A"],
                ["include_intra_b", "Intralaboral Forma B"],
                ["include_extra", "Extralaboral"],
                ["include_estres", "Estrés"],
              ] as const).map(([key, label]) => <label key={key} className="flex items-center gap-3 rounded-2xl border p-3 text-sm font-bold"><input type="checkbox" checked={form[key]} onChange={(e) => updateForm(key, e.target.checked)} className="h-4 w-4 accent-violet-700" />{label}</label>)}</div>{fieldErrors.instrumentos && <span className="mt-2 block text-xs font-semibold text-red-600">{fieldErrors.instrumentos}</span>}</div>
              <div className="flex justify-end gap-3 pt-4"><button type="button" onClick={() => setOpenCreate(false)} className="rounded-2xl border px-5 py-3 font-bold">Cancelar</button><button disabled={saving} className="inline-flex items-center gap-2 rounded-2xl bg-violet-700 px-6 py-3 font-bold text-white disabled:opacity-60">{saving && <Loader2 className="h-4 w-4 animate-spin" />} Crear batería</button></div>
            </form>
          </aside>
        </div>
      )}
    </main>
  );
}
