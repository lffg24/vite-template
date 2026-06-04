import type { ReactNode } from "react";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ArrowLeft, Check, ChevronDown, ChevronLeft, ChevronRight, Loader2, Plus, Search, Upload, UserRound, X } from "lucide-react";
import {
  AreaEmpresa,
  CargoEmpresa,
  CrearEmpleadoPayload,
  EmpleadoEmpresa,
  psicoAdminService,
} from "@/features/psicosocial/api/psicoAdminService";
import { ToastCard, type ToastPayload } from "@/components/feedback/ToastCard";


type FormState = { nombres: string; apellidos: string; cedula: string; identificador_externo: string; email: string; telefono: string; area_id: string; cargo_id: string };
const emptyForm: FormState = { nombres: "", apellidos: "", cedula: "", identificador_externo: "", email: "", telefono: "", area_id: "", cargo_id: "" };

function validateEmail(value: string) { return !value.trim() || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()); }
function digitsOnly(value: string) { return value.replace(/\D/g, ""); }

export default function EmpresaEmpleadosPage() {
  const { empresaId = "" } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [items, setItems] = useState<EmpleadoEmpresa[]>([]);
  const [areas, setAreas] = useState<AreaEmpresa[]>([]);
  const [cargos, setCargos] = useState<CargoEmpresa[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openManual, setOpenManual] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [catalogModal, setCatalogModal] = useState<null | "area" | "cargo">(null);
  const [catalogName, setCatalogName] = useState("");
  const [catalogSaving, setCatalogSaving] = useState(false);
  const [toast, setToast] = useState<ToastPayload | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const returnTo = searchParams.get("returnTo") || "";

  useEffect(() => {
    if (searchParams.get("openManual") === "1") {
      setOpenManual(true);
      const next = new URLSearchParams(searchParams);
      next.delete("openManual");
      setSearchParams(next, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const notify = (payload: Omit<ToastPayload, "id">) => {
    const id = Date.now();
    setToast({ id, ...payload });
    window.setTimeout(() => setToast((t) => (t?.id === id ? null : t)), 4200);
  };

  useEffect(() => {
    const onExpired = () => {
      notify({ type: "warning", title: "Sesión vencida", message: "Vuelve a iniciar sesión. Conservamos esta pantalla para que no pierdas contexto." });
      window.setTimeout(() => navigate(`/login?next=${encodeURIComponent(window.location.pathname)}`), 1600);
    };
    window.addEventListener("abril360:session-expired", onExpired);
    return () => window.removeEventListener("abril360:session-expired", onExpired);
  }, [navigate]);

  const load = async () => {
    if (!empresaId) return;
    setLoading(true);
    setError(null);
    try {
      const [empleadosRes, areasRes, cargosRes] = await Promise.all([
        psicoAdminService.empleadosEmpresa(empresaId, q.trim()),
        psicoAdminService.listarAreas(empresaId),
        psicoAdminService.listarCargos(empresaId),
      ]);
      setItems(empleadosRes.items || []);
      setAreas(areasRes.items || []);
      setCargos(cargosRes.items || []);
    } catch (e: any) {
      setError(e?.message || "No fue posible cargar empleados.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const t = window.setTimeout(load, 250);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [empresaId, q]);

  useEffect(() => {
    setPage(1);
  }, [q, pageSize]);

  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paginatedItems = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return items.slice(start, start + pageSize);
  }, [items, safePage, pageSize]);

  const visibleCargos = useMemo(() => !form.area_id ? cargos : cargos.filter((c) => !c.area_id || String(c.area_id) === form.area_id), [cargos, form.area_id]);
  const selectedArea = areas.find((a) => String(a.id) === form.area_id);
  const selectedCargo = cargos.find((c) => String(c.id) === form.cargo_id);

  const updateForm = (key: keyof FormState, value: string) => {
    if (key === "cedula" || key === "telefono") value = digitsOnly(value);
    setForm((prev) => ({ ...prev, [key]: value, ...(key === "area_id" ? { cargo_id: "" } : {}) }));
    setFieldErrors((prev) => ({ ...prev, [key]: "" }));
  };

  const validateManual = () => {
    const next: Record<string, string> = {};
    if (!form.nombres.trim()) next.nombres = "Nombres es obligatorio.";
    if (!form.apellidos.trim()) next.apellidos = "Apellidos es obligatorio.";
    if (!form.cedula.trim()) next.cedula = "Cédula es obligatoria.";
    if (form.cedula.trim() && form.cedula.trim().length < 5) next.cedula = "Cédula debe tener mínimo 5 dígitos.";
    if (form.email.trim() && !validateEmail(form.email)) next.email = "Correo inválido.";
    if (form.telefono.trim() && form.telefono.trim().length < 7) next.telefono = "Teléfono debe tener mínimo 7 dígitos.";
    if (!form.area_id) next.area_id = "Área es obligatoria.";
    if (!form.cargo_id) next.cargo_id = "Cargo es obligatorio.";
    setFieldErrors(next);
    if (Object.keys(next).length) notify({ type: "warning", title: "Faltan datos obligatorios", message: "Revisa nombres, apellidos, cédula, área y cargo." });
    return Object.keys(next).length === 0;
  };

  const submitManual = async (event: FormEvent) => {
    event.preventDefault();
    if (!validateManual()) return;
    setSaving(true);
    setError(null);
    try {
      const payload: CrearEmpleadoPayload = {
        nombres: form.nombres.trim(),
        apellidos: form.apellidos.trim(),
        cedula: form.cedula.trim(),
        area_id: Number(form.area_id),
        cargo_id: Number(form.cargo_id),
        identificador_externo: form.identificador_externo.trim() || undefined,
        email: form.email.trim().toLowerCase() || undefined,
        telefono: form.telefono.trim() || undefined,
      };
      await psicoAdminService.crearEmpleado(empresaId, payload);
      setForm(emptyForm);
      setOpenManual(false);
      notify({ type: "success", title: "Empleado creado", message: "El colaborador quedó vinculado a esta empresa." });
      await load();
      if (returnTo) {
        window.setTimeout(() => navigate(returnTo), 450);
      }
    } catch (e: any) {
      notify({ type: "error", title: "No fue posible guardar", message: e?.message || "Revisa los datos e intenta nuevamente." });
    } finally {
      setSaving(false);
    }
  };

  const saveCatalog = async (event: FormEvent) => {
    event.preventDefault();
    const name = catalogName.trim();
    if (!name || !catalogModal) return;
    setCatalogSaving(true);
    try {
      if (catalogModal === "area") {
        const res = await psicoAdminService.crearArea(empresaId, { nombre: name });
        setAreas((await psicoAdminService.listarAreas(empresaId)).items || []);
        if (res.item?.id) updateForm("area_id", String(res.item.id));
        notify({ type: "success", title: "Área creada", message: `${name} quedó disponible para esta empresa.` });
      } else {
        const res = await psicoAdminService.crearCargo(empresaId, { nombre: name, area_id: form.area_id ? Number(form.area_id) : undefined });
        setCargos((await psicoAdminService.listarCargos(empresaId)).items || []);
        if (res.item?.id) updateForm("cargo_id", String(res.item.id));
        notify({ type: "success", title: "Cargo creado", message: `${name} quedó asociado al área seleccionada.` });
      }
      setCatalogModal(null);
      setCatalogName("");
    } catch (e: any) {
      notify({ type: "error", title: "No fue posible crear catálogo", message: e?.message || "Intenta nuevamente." });
    } finally {
      setCatalogSaving(false);
    }
  };

  return <main className="min-h-screen bg-slate-50 p-6 lg:p-8">
    {toast && <ToastCard toast={toast} onClose={() => setToast(null)} />}
    <div className="mx-auto max-w-7xl space-y-6">
      <button onClick={() => navigate(`/psicosocial/empresas/${empresaId}`)} className="inline-flex items-center gap-2 rounded-xl border bg-white px-4 py-2 text-sm font-bold shadow-sm"><ArrowLeft className="h-4 w-4" /> Volver a empresa</button>
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"><div className="flex flex-wrap items-center justify-between gap-4"><div><h1 className="text-3xl font-black text-slate-950">Empleados</h1><p className="text-sm text-slate-500">Listado de colaboradores vinculados a esta empresa.</p></div><div className="flex flex-wrap gap-3"><button onClick={() => setOpenManual(true)} className="inline-flex items-center gap-2 rounded-2xl bg-violet-700 px-5 py-3 text-sm font-bold text-white hover:bg-violet-800"><Plus className="h-4 w-4" /> Agregar manualmente</button><button className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-800 hover:bg-slate-50"><Upload className="h-4 w-4" /> Carga masiva</button></div></div></section>
      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"><div className="mb-4 flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3"><Search className="h-4 w-4 text-slate-400" /><input value={q} onChange={(e) => setQ(e.target.value)} className="w-full outline-none" placeholder="Buscar por cédula, nombre, área o cargo..." /></div>{error && <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}<button onClick={load} className="ml-3 font-bold underline">Reintentar</button></div>}{loading ? <div className="p-8 text-center text-slate-500">Cargando empleados...</div> : <EmployeeTable items={paginatedItems} totalItems={items.length} page={safePage} pageSize={pageSize} totalPages={totalPages} onPageChange={setPage} onPageSizeChange={setPageSize} navigate={navigate} />}</section>
    </div>
    {openManual && <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/45 backdrop-blur-sm"><aside className="h-full w-full max-w-3xl overflow-y-auto bg-white p-6 shadow-2xl"><div className="mb-6 flex items-start justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-widest text-violet-700">Nuevo colaborador</p><h2 className="text-2xl font-black text-slate-950">Agregar empleado manualmente</h2><p className="mt-1 text-sm text-slate-500">Nombres, apellidos, cédula, área y cargo son obligatorios.</p></div><button onClick={() => setOpenManual(false)} className="rounded-2xl border p-2 hover:bg-slate-50"><X className="h-5 w-5" /></button></div><form onSubmit={submitManual} className="space-y-4"><div className="grid gap-4 sm:grid-cols-2"><Field label="Nombres *" error={fieldErrors.nombres}><Input value={form.nombres} onChange={(v) => updateForm("nombres", v)} /></Field><Field label="Apellidos *" error={fieldErrors.apellidos}><Input value={form.apellidos} onChange={(v) => updateForm("apellidos", v)} /></Field><Field label="Cédula *" error={fieldErrors.cedula}><Input value={form.cedula} onChange={(v) => updateForm("cedula", v)} inputMode="numeric" /></Field><Field label="Identificador externo"><Input value={form.identificador_externo} onChange={(v) => updateForm("identificador_externo", v)} /></Field><Field label="Correo" error={fieldErrors.email}><Input value={form.email} onChange={(v) => updateForm("email", v)} type="email" /></Field><Field label="Teléfono" error={fieldErrors.telefono}><Input value={form.telefono} onChange={(v) => updateForm("telefono", v)} inputMode="numeric" /></Field><Field label="Área *" error={fieldErrors.area_id}><div className="flex gap-2"><Combo value={form.area_id} label={selectedArea?.nombre || "Selecciona área"} options={areas.map((a) => ({ value: String(a.id), label: a.nombre }))} onChange={(v) => updateForm("area_id", v)} placeholder="Selecciona área" emptyMessage="No hay áreas registradas" /><button type="button" onClick={() => setCatalogModal("area")} className="rounded-2xl border px-4 font-bold text-violet-700 hover:bg-violet-50">Nuevo</button></div></Field><Field label="Cargo *" error={fieldErrors.cargo_id}><div className="flex gap-2"><Combo value={form.cargo_id} label={selectedCargo?.nombre || "Selecciona cargo"} options={visibleCargos.map((c) => ({ value: String(c.id), label: c.nombre }))} onChange={(v) => updateForm("cargo_id", v)} disabled={!form.area_id} placeholder="Selecciona cargo" emptyMessage="No hay cargos asociados a esta área" helper={form.area_id ? "Selecciona el cargo correspondiente" : "Selecciona primero un área"} /><button type="button" disabled={!form.area_id} onClick={() => setCatalogModal("cargo")} title={form.area_id ? "Crear cargo para el área seleccionada" : "Selecciona primero un área"} className="rounded-2xl border px-4 font-bold text-violet-700 hover:bg-violet-50 disabled:cursor-not-allowed disabled:opacity-50">Nuevo</button></div></Field></div><div className="flex justify-end gap-3 pt-4"><button type="button" onClick={() => setOpenManual(false)} className="rounded-2xl border px-5 py-3 font-bold">Cancelar</button><button disabled={saving} className="inline-flex items-center gap-2 rounded-2xl bg-violet-700 px-6 py-3 font-bold text-white disabled:opacity-60">{saving && <Loader2 className="h-4 w-4 animate-spin" />} Guardar empleado</button></div></form></aside></div>}
    {catalogModal && <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm"><form onSubmit={saveCatalog} className="w-full max-w-md rounded-[28px] border border-slate-200 bg-white p-6 shadow-2xl"><div className="mb-5 flex items-start justify-between"><div><p className="text-xs font-black uppercase tracking-widest text-violet-700">Catálogo</p><h3 className="text-xl font-black">Agregar {catalogModal === "area" ? "área" : "cargo"}</h3><p className="text-sm text-slate-500">{catalogModal === "cargo" ? `Se vinculará al área: ${selectedArea?.nombre || "seleccionada"}.` : "Se vinculará únicamente a esta empresa."}</p></div><button type="button" onClick={() => setCatalogModal(null)} className="rounded-2xl border p-2"><X className="h-4 w-4" /></button></div>{catalogModal === "cargo" && !form.area_id && <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">Selecciona primero un área para vincular el cargo.</div>}<Field label="Nombre"><Input value={catalogName} onChange={setCatalogName} placeholder={catalogModal === "area" ? "Ej. Operaciones" : "Ej. Analista SST"} autoFocus /></Field><div className="mt-6 flex justify-end gap-3"><button type="button" onClick={() => setCatalogModal(null)} className="rounded-2xl border px-5 py-3 font-bold">Cancelar</button><button disabled={catalogSaving || !catalogName.trim() || (catalogModal === "cargo" && !form.area_id)} className="rounded-2xl bg-violet-700 px-5 py-3 font-bold text-white disabled:opacity-50">Crear</button></div></form></div>}
  </main>;
}

function EmployeeTable({
  items,
  totalItems,
  page,
  pageSize,
  totalPages,
  onPageChange,
  onPageSizeChange,
  navigate,
}: {
  items: EmpleadoEmpresa[];
  totalItems: number;
  page: number;
  pageSize: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  navigate: ReturnType<typeof useNavigate>;
}) {
  const from = totalItems === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(totalItems, page * pageSize);
  const canPrev = page > 1;
  const canNext = page < totalPages;

  return <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
    <div className="flex flex-col gap-3 border-b border-slate-100 bg-gradient-to-r from-white to-slate-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-sm font-black text-slate-900">Listado paginado</p>
        <p className="text-xs font-semibold text-slate-500">Mostrando {from}-{to} de {totalItems} colaboradores</p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-bold text-slate-500">Filas</span>
        <select
          value={pageSize}
          onChange={(event) => onPageSizeChange(Number(event.target.value))}
          className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700 outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-100"
        >
          {[10, 25, 50, 100].map((size) => <option key={size} value={size}>{size}</option>)}
        </select>
      </div>
    </div>

    <div className="overflow-x-auto">
      <table className="min-w-[860px] w-full text-left text-sm">
        <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
          <tr>
            <th className="px-4 py-3">Colaborador</th>
            <th className="px-4 py-3">Área / cargo</th>
            <th className="px-4 py-3">Contacto</th>
            <th className="px-4 py-3">Estado</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {items.length === 0 && <tr><td colSpan={4} className="px-4 py-12 text-center text-slate-500">No hay colaboradores para mostrar. Ajusta la búsqueda o agrega uno manualmente.</td></tr>}
          {items.map((e) => <tr key={e.id} className="transition hover:bg-violet-50/40">
            <td className="px-4 py-4">
              <button onClick={() => navigate(`/psicosocial/empleados/${e.id}`)} className="group inline-flex items-center gap-3 text-left">
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-violet-100 text-violet-700 ring-1 ring-violet-100 transition group-hover:bg-violet-700 group-hover:text-white"><UserRound className="h-5 w-5" /></span>
                <span className="min-w-0">
                  <strong className="block max-w-[280px] truncate text-slate-900 group-hover:text-violet-700 group-hover:underline">{e.nombre}</strong>
                  <span className="text-xs font-semibold text-slate-500">CC {e.cedula || "Sin documento"}</span>
                </span>
              </button>
            </td>
            <td className="px-4 py-4"><strong className="text-slate-900">{e.area || "Sin área"}</strong><br /><span className="text-slate-500">{e.cargo || "Sin cargo"}</span></td>
            <td className="px-4 py-4 text-slate-600"><span className="block max-w-[260px] truncate">{e.email || "Sin correo"}</span><span>{e.telefono || "Sin teléfono"}</span></td>
            <td className="px-4 py-4"><span className={`rounded-full border px-3 py-1 text-xs font-black ${e.activo === false ? "border-slate-200 bg-slate-50 text-slate-500" : "border-emerald-200 bg-emerald-50 text-emerald-700"}`}>{e.activo === false ? "Inactivo" : "Activo"}</span></td>
          </tr>)}
        </tbody>
      </table>
    </div>

    <div className="flex flex-col gap-3 border-t border-slate-100 bg-slate-50/70 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-xs font-semibold text-slate-500">Página <span className="font-black text-slate-800">{page}</span> de <span className="font-black text-slate-800">{totalPages}</span></p>
      <div className="flex items-center gap-2">
        <button disabled={!canPrev} onClick={() => onPageChange(1)} className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50">Primera</button>
        <button disabled={!canPrev} onClick={() => onPageChange(page - 1)} className="inline-flex items-center gap-1 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"><ChevronLeft className="h-4 w-4" /> Anterior</button>
        <button disabled={!canNext} onClick={() => onPageChange(page + 1)} className="inline-flex items-center gap-1 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50">Siguiente <ChevronRight className="h-4 w-4" /></button>
        <button disabled={!canNext} onClick={() => onPageChange(totalPages)} className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50">Última</button>
      </div>
    </div>
  </div>;
}
function Field({ label, error, children }: { label: string; error?: string; children: ReactNode }) { return <label className="space-y-1 text-sm font-bold text-slate-700">{label}{children}{error && <span className="block text-xs font-semibold text-red-600">{error}</span>}</label>; }
function Input({ value, onChange, className = "", ...props }: any) { return <input {...props} value={value} onChange={(e) => onChange(e.target.value)} className={`w-full rounded-2xl border border-slate-200 px-4 py-3 font-normal outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-100 ${className}`} />; }
function Combo({ value, label, options, onChange, disabled, placeholder, emptyMessage, helper }: { value: string; label: string; options: Array<{ value: string; label: string }>; onChange: (v: string) => void; disabled?: boolean; placeholder?: string; emptyMessage?: string; helper?: string }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    function handleClick(event: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false);
    }
    window.addEventListener("mousedown", handleClick);
    return () => window.removeEventListener("mousedown", handleClick);
  }, []);
  return <div ref={rootRef} className="relative flex-1"><button type="button" disabled={disabled} onClick={() => setOpen((v) => !v)} className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left font-normal outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-100 ${disabled ? "cursor-not-allowed border-slate-200 bg-slate-50 text-slate-400" : open ? "border-violet-300 bg-violet-50/60" : "border-slate-200 bg-white hover:border-violet-300"}`}><div className="min-w-0"><span className={`block truncate font-semibold ${value ? "text-slate-800" : "text-slate-400"}`}>{disabled ? (helper || "Selecciona primero un área") : label}</span>{helper && !disabled && <span className="mt-0.5 block text-xs text-slate-400">{helper}</span>}</div><ChevronDown className={`h-4 w-4 shrink-0 text-slate-400 transition ${open ? "rotate-180 text-violet-600" : ""}`} /></button>{open && !disabled && <div className="absolute z-[70] mt-2 w-full overflow-hidden rounded-[22px] border border-slate-200 bg-white shadow-[0_24px_60px_rgba(15,23,42,0.16)]"><div className="border-b border-slate-100 bg-slate-50 px-4 py-3"><p className="text-xs font-black uppercase tracking-[0.16em] text-violet-700">Catálogo</p><p className="mt-1 text-sm font-semibold text-slate-600">{placeholder || "Selecciona una opción"}</p></div><div className="max-h-64 overflow-auto p-2">{options.length > 0 ? <><button type="button" onClick={() => { onChange(""); setOpen(false); }} className="mb-1 flex w-full items-center justify-between rounded-2xl px-3 py-2.5 text-left text-sm font-semibold text-slate-500 transition hover:bg-slate-50">Limpiar</button>{options.map((opt) => <button key={opt.value} type="button" onClick={() => { onChange(opt.value); setOpen(false); }} className={`flex w-full items-center justify-between rounded-2xl px-3 py-3 text-left text-sm font-bold transition ${value === opt.value ? "bg-violet-50 text-violet-700 ring-1 ring-violet-100" : "text-slate-700 hover:bg-slate-50"}`}><div className="min-w-0"><span className="block truncate">{opt.label}</span>{value === opt.value && <span className="mt-0.5 block text-xs font-semibold text-violet-500">Seleccionado</span>}</div>{value === opt.value && <Check className="h-4 w-4" />}</button>)}</> : <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-5 text-center text-sm text-slate-500">{emptyMessage || "No hay opciones disponibles"}</div>}</div></div>}</div>; }
