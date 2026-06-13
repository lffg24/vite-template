import type { ReactNode } from "react";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ArrowLeft, Check, ChevronDown, ChevronLeft, ChevronRight, CloudUpload, Download, FileDown, FileSpreadsheet, Info, Loader2, Plus, Search, ShieldCheck, Table2, TriangleAlert, Upload, UserRound, UsersRound, X } from "lucide-react";
import {
  AreaEmpresa,
  CargoEmpresa,
  CrearEmpleadoPayload,
  EmpleadoEmpresa,
  EmpleadoImportResponse,
  psicoAdminService,
} from "@/features/psicosocial/api/psicoAdminService";
import { ToastCard, type ToastPayload } from "@/components/feedback/ToastCard";


type FormState = { nombres: string; apellidos: string; cedula: string; identificador_externo: string; email: string; telefono: string; area_id: string; cargo_id: string };
const emptyForm: FormState = { nombres: "", apellidos: "", cedula: "", identificador_externo: "", email: "", telefono: "", area_id: "", cargo_id: "" };
export const BULK_EMPLOYEE_MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;
export const BULK_EMPLOYEE_ALLOWED_EXTENSIONS = [".xlsx", ".csv"] as const;

function validateEmail(value: string) { return !value.trim() || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()); }
function digitsOnly(value: string) { return value.replace(/\D/g, ""); }
function bulkErrorResult(message: string): EmpleadoImportResponse {
  return {
    ok: false,
    dry_run: true,
    total_rows: 0,
    valid_rows: 0,
    created: 0,
    updated: 0,
    errors: [{ row: null, field: "archivo", message }],
    preview: [],
  };
}

export function validateBulkEmployeeFile(file: Pick<File, "name" | "size">): string | null {
  const fileName = file.name.trim().toLowerCase();
  const hasValidExtension = BULK_EMPLOYEE_ALLOWED_EXTENSIONS.some((extension) => fileName.endsWith(extension));

  if (!file.size) return "El archivo está vacío.";
  if (!hasValidExtension) return "Formato no soportado. Usa .xlsx o .csv.";
  if (file.size > BULK_EMPLOYEE_MAX_FILE_SIZE_BYTES) return "El archivo supera el máximo permitido de 5 MB.";
  return null;
}

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
  const [openBulk, setOpenBulk] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [catalogModal, setCatalogModal] = useState<null | "area" | "cargo">(null);
  const [catalogName, setCatalogName] = useState("");
  const [catalogSaving, setCatalogSaving] = useState(false);
  const [bulkFile, setBulkFile] = useState<File | null>(null);
  const [bulkResult, setBulkResult] = useState<EmpleadoImportResponse | null>(null);
  const [bulkSaving, setBulkSaving] = useState(false);
  const bulkRunId = useRef(0);
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

  const resetBulk = () => {
    bulkRunId.current += 1;
    setBulkFile(null);
    setBulkResult(null);
    setBulkSaving(false);
  };

  const closeBulk = () => {
    setOpenBulk(false);
    resetBulk();
  };

  const runBulkImport = async (dryRun: boolean, fileOverride?: File | null, runIdOverride?: number) => {
    const selectedFile = fileOverride ?? bulkFile;
    if (!selectedFile) {
      notify({ type: "warning", title: "Selecciona un archivo", message: "Carga la plantilla diligenciada en formato .xlsx o .csv." });
      return;
    }
    const fileError = validateBulkEmployeeFile(selectedFile);
    if (fileError) {
      setBulkResult(bulkErrorResult(fileError));
      notify({ type: "warning", title: "Archivo no permitido", message: fileError });
      return;
    }
    const runId = runIdOverride ?? bulkRunId.current + 1;
    bulkRunId.current = runId;
    setBulkSaving(true);
    try {
      const result = await psicoAdminService.importarEmpleados(empresaId, selectedFile, dryRun);
      if (runId !== bulkRunId.current) return;
      setBulkResult(result);
      if (!result.ok) {
        notify({ type: "warning", title: "Archivo con observaciones", message: "Revisa los errores detectados antes de importar." });
        return;
      }
      if (dryRun) {
        notify({ type: "success", title: "Archivo validado", message: `${result.valid_rows} colaboradores listos para importar.` });
      } else {
        notify({ type: "success", title: "Carga completada", message: `${result.created} creados y ${result.updated} actualizados.` });
        await load();
        if (runId !== bulkRunId.current) return;
        closeBulk();
      }
    } catch (e: any) {
      if (runId !== bulkRunId.current) return;
      notify({ type: "error", title: "No fue posible procesar", message: e?.message || "Intenta nuevamente." });
    } finally {
      if (runId === bulkRunId.current) setBulkSaving(false);
    }
  };

  const handleBulkFileChange = (file: File | null) => {
    const runId = bulkRunId.current + 1;
    bulkRunId.current = runId;
    setBulkFile(file);
    setBulkResult(null);
    setBulkSaving(false);
    if (file) {
      const fileError = validateBulkEmployeeFile(file);
      if (fileError) {
        setBulkResult(bulkErrorResult(fileError));
        notify({ type: "warning", title: "Archivo no permitido", message: fileError });
        return;
      }
      window.setTimeout(() => void runBulkImport(true, file, runId), 0);
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
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"><div className="flex flex-wrap items-center justify-between gap-4"><div><h1 className="text-3xl font-black text-slate-950">Empleados</h1><p className="text-sm text-slate-500">Listado de colaboradores vinculados a esta empresa.</p></div><div className="flex flex-wrap gap-3"><button onClick={() => setOpenManual(true)} className="inline-flex items-center gap-2 rounded-2xl bg-violet-700 px-5 py-3 text-sm font-bold text-white hover:bg-violet-800"><Plus className="h-4 w-4" /> Agregar manualmente</button><button onClick={() => setOpenBulk(true)} className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-800 hover:bg-slate-50"><Upload className="h-4 w-4" /> Carga masiva</button></div></div></section>
      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"><div className="mb-4 flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3"><Search className="h-4 w-4 text-slate-400" /><input value={q} onChange={(e) => setQ(e.target.value)} className="w-full outline-none" placeholder="Buscar por cédula, nombre, área o cargo..." /></div>{error && <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}<button onClick={load} className="ml-3 font-bold underline">Reintentar</button></div>}{loading ? <div className="p-8 text-center text-slate-500">Cargando empleados...</div> : <EmployeeTable items={paginatedItems} totalItems={items.length} page={safePage} pageSize={pageSize} totalPages={totalPages} onPageChange={setPage} onPageSizeChange={setPageSize} navigate={navigate} />}</section>
    </div>
    {openManual && <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/45 backdrop-blur-sm"><aside className="h-full w-full max-w-3xl overflow-y-auto bg-white p-6 shadow-2xl"><div className="mb-6 flex items-start justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-widest text-violet-700">Nuevo colaborador</p><h2 className="text-2xl font-black text-slate-950">Agregar empleado manualmente</h2><p className="mt-1 text-sm text-slate-500">Nombres, apellidos, cédula, área y cargo son obligatorios.</p></div><button onClick={() => setOpenManual(false)} className="rounded-2xl border p-2 hover:bg-slate-50"><X className="h-5 w-5" /></button></div><form onSubmit={submitManual} className="space-y-4"><div className="grid gap-4 sm:grid-cols-2"><Field label="Nombres *" error={fieldErrors.nombres}><Input value={form.nombres} onChange={(v) => updateForm("nombres", v)} /></Field><Field label="Apellidos *" error={fieldErrors.apellidos}><Input value={form.apellidos} onChange={(v) => updateForm("apellidos", v)} /></Field><Field label="Cédula *" error={fieldErrors.cedula}><Input value={form.cedula} onChange={(v) => updateForm("cedula", v)} inputMode="numeric" /></Field><Field label="Identificador externo"><Input value={form.identificador_externo} onChange={(v) => updateForm("identificador_externo", v)} /></Field><Field label="Correo" error={fieldErrors.email}><Input value={form.email} onChange={(v) => updateForm("email", v)} type="email" /></Field><Field label="Teléfono" error={fieldErrors.telefono}><Input value={form.telefono} onChange={(v) => updateForm("telefono", v)} inputMode="numeric" /></Field><Field label="Área *" error={fieldErrors.area_id}><div className="flex gap-2"><Combo value={form.area_id} label={selectedArea?.nombre || "Selecciona área"} options={areas.map((a) => ({ value: String(a.id), label: a.nombre }))} onChange={(v) => updateForm("area_id", v)} placeholder="Selecciona área" emptyMessage="No hay áreas registradas" /><button type="button" onClick={() => setCatalogModal("area")} className="rounded-2xl border px-4 font-bold text-violet-700 hover:bg-violet-50">Nuevo</button></div></Field><Field label="Cargo *" error={fieldErrors.cargo_id}><div className="flex gap-2"><Combo value={form.cargo_id} label={selectedCargo?.nombre || "Selecciona cargo"} options={visibleCargos.map((c) => ({ value: String(c.id), label: c.nombre }))} onChange={(v) => updateForm("cargo_id", v)} disabled={!form.area_id} placeholder="Selecciona cargo" emptyMessage="No hay cargos asociados a esta área" helper={form.area_id ? "Selecciona el cargo correspondiente" : "Selecciona primero un área"} /><button type="button" disabled={!form.area_id} onClick={() => setCatalogModal("cargo")} title={form.area_id ? "Crear cargo para el área seleccionada" : "Selecciona primero un área"} className="rounded-2xl border px-4 font-bold text-violet-700 hover:bg-violet-50 disabled:cursor-not-allowed disabled:opacity-50">Nuevo</button></div></Field></div><div className="flex justify-end gap-3 pt-4"><button type="button" onClick={() => setOpenManual(false)} className="rounded-2xl border px-5 py-3 font-bold">Cancelar</button><button disabled={saving} className="inline-flex items-center gap-2 rounded-2xl bg-violet-700 px-6 py-3 font-bold text-white disabled:opacity-60">{saving && <Loader2 className="h-4 w-4 animate-spin" />} Guardar empleado</button></div></form></aside></div>}
    {openBulk && <BulkUploadModal file={bulkFile} result={bulkResult} saving={bulkSaving} onFileChange={handleBulkFileChange} onValidate={() => runBulkImport(true)} onImport={() => runBulkImport(false)} onClose={closeBulk} />}
    {catalogModal && <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm"><form onSubmit={saveCatalog} className="w-full max-w-md rounded-[28px] border border-slate-200 bg-white p-6 shadow-2xl"><div className="mb-5 flex items-start justify-between"><div><p className="text-xs font-black uppercase tracking-widest text-violet-700">Catálogo</p><h3 className="text-xl font-black">Agregar {catalogModal === "area" ? "área" : "cargo"}</h3><p className="text-sm text-slate-500">{catalogModal === "cargo" ? `Se vinculará al área: ${selectedArea?.nombre || "seleccionada"}.` : "Se vinculará únicamente a esta empresa."}</p></div><button type="button" onClick={() => setCatalogModal(null)} className="rounded-2xl border p-2"><X className="h-4 w-4" /></button></div>{catalogModal === "cargo" && !form.area_id && <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">Selecciona primero un área para vincular el cargo.</div>}<Field label="Nombre"><Input value={catalogName} onChange={setCatalogName} placeholder={catalogModal === "area" ? "Ej. Operaciones" : "Ej. Analista SST"} autoFocus /></Field><div className="mt-6 flex justify-end gap-3"><button type="button" onClick={() => setCatalogModal(null)} className="rounded-2xl border px-5 py-3 font-bold">Cancelar</button><button disabled={catalogSaving || !catalogName.trim() || (catalogModal === "cargo" && !form.area_id)} className="rounded-2xl bg-violet-700 px-5 py-3 font-bold text-white disabled:opacity-50">Crear</button></div></form></div>}
  </main>;
}

function BulkUploadModal({
  file,
  result,
  saving,
  onFileChange,
  onValidate,
  onImport,
  onClose,
}: {
  file: File | null;
  result: EmpleadoImportResponse | null;
  saving: boolean;
  onFileChange: (file: File | null) => void;
  onValidate: () => void;
  onImport: () => void;
  onClose: () => void;
}) {
  const canImport = Boolean(file && result?.ok && result.dry_run);
  const hasErrors = Boolean(result && result.errors.length > 0);
  const activeStep = result?.ok && result.dry_run ? 3 : result ? 2 : 1;
  const fileReady = Boolean(file && !result);
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm">
    <section className="flex max-h-[88vh] w-full max-w-4xl flex-col overflow-hidden rounded-[24px] border border-white/60 bg-white shadow-[0_30px_90px_rgba(15,23,42,0.35)]">
      <div className="relative shrink-0 overflow-hidden border-b border-slate-200 bg-gradient-to-r from-white via-white to-violet-50 px-5 py-4 sm:px-6">
        <div className="absolute inset-y-0 right-0 w-1/3 bg-violet-100/60 [clip-path:ellipse(80%_70%_at_80%_50%)]" />
        <div className="relative flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-violet-700 text-white shadow-[0_14px_28px_rgba(109,40,217,0.28)]">
              <UsersRound className="h-8 w-8" />
            </div>
            <div className="min-w-0">
              <h2 className="text-xl font-black text-slate-950 sm:text-2xl">Cargar empleados de forma masiva</h2>
              <p className="mt-1 text-sm font-semibold text-slate-500">Importa colaboradores desde una plantilla Excel o CSV.</p>
              <span className="mt-2 inline-flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700 ring-1 ring-emerald-100"><Check className="h-3.5 w-3.5" /> Empresa activa</span>
            </div>
          </div>
          <button onClick={onClose} className="relative rounded-2xl p-2 text-slate-500 transition hover:bg-white hover:text-slate-900"><X className="h-5 w-5" /></button>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4 sm:px-6">
        <div className="mb-4 grid gap-3 md:grid-cols-[1fr_44px_1fr_44px_1fr] md:items-center">
          <StepPill active={activeStep >= 1} number={1} title="Subir archivo" subtitle="Selecciona tu archivo" />
          <div className="hidden h-px bg-slate-300 md:block" />
          <StepPill active={activeStep >= 2} number={2} title="Validar datos" subtitle="Revisa la información" />
          <div className="hidden h-px bg-slate-300 md:block" />
          <StepPill active={activeStep >= 3} number={3} title="Confirmar" subtitle="Finaliza la importación" />
        </div>

        <label className={`flex cursor-pointer flex-col items-center justify-center rounded-[22px] border-2 border-dashed border-violet-300 bg-gradient-to-br from-violet-50 via-white to-sky-50 px-5 text-center transition hover:border-violet-500 hover:from-violet-100/80 ${file ? "min-h-32 py-4" : "min-h-44 py-6"}`}>
          <div className="relative">
            <FileSpreadsheet className={`${file ? "h-12 w-12" : "h-16 w-16"} text-emerald-600`} />
            <span className="absolute -right-3 bottom-0 flex h-9 w-9 items-center justify-center rounded-full bg-violet-700 text-white shadow-lg"><Upload className="h-4 w-4" /></span>
          </div>
          <span className="mt-3 max-w-full truncate text-base font-black text-slate-950">{file?.name || "Arrastra y suelta tu archivo aquí"}</span>
          <span className="mt-1 text-sm font-semibold text-slate-500">{file ? `${formatFileSize(file.size)} seleccionado` : "o haz clic para seleccionarlo desde tu computador"}</span>
          <span className="mt-3 text-xs font-bold text-slate-500">Formatos permitidos: .xlsx, .csv &nbsp; • &nbsp; Tamaño máximo: 5 MB</span>
          <input
            type="file"
            accept=".xlsx,.csv"
            className="sr-only"
            onChange={(event) => {
              onFileChange(event.target.files?.[0] || null);
              event.currentTarget.value = "";
            }}
          />
        </label>

        {(fileReady || saving || result) && <div className="mt-4 rounded-[20px] border border-slate-200 bg-white p-3 shadow-sm">
          {result ? <div className="grid gap-3 md:grid-cols-3 md:items-center">
            <MetricInline icon={<Table2 className="h-5 w-5" />} label="Filas detectadas" value={result.total_rows} tone="violet" />
            <MetricInline icon={<Check className="h-5 w-5" />} label="Válidas" value={result.valid_rows} tone="emerald" />
            <MetricInline icon={<TriangleAlert className="h-5 w-5" />} label="Con observaciones" value={result.errors.length} tone="amber" />
          </div> : <div className="flex items-center gap-3 px-2 py-1 text-sm font-bold text-slate-600">
            {saving ? <Loader2 className="h-5 w-5 animate-spin text-violet-700" /> : <FileSpreadsheet className="h-5 w-5 text-violet-700" />}
            {saving ? "Validando archivo..." : "Archivo seleccionado. Validaremos la estructura antes de importar."}
          </div>
          }
        </div>}

        <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_1.2fr]">
          <div className="rounded-[20px] border border-violet-200 bg-violet-50/70 p-4 sm:flex sm:items-center sm:justify-between lg:block">
            <div className="flex items-center gap-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-violet-700 ring-1 ring-violet-100"><FileDown className="h-5 w-5" /></span>
              <div>
                <p className="text-sm font-black text-violet-950">¿No tienes el archivo?</p>
                <p className="mt-1 text-xs font-semibold text-slate-600">Usa el formato estándar.</p>
              </div>
            </div>
            <a href="/templates/plantilla_carga_colaboradores.xlsx" download className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-violet-300 bg-white px-4 py-2.5 text-sm font-black text-violet-700 hover:bg-violet-50 sm:mt-0 sm:w-auto lg:mt-3 lg:w-full"><Download className="h-4 w-4" /> Descargar formato</a>
          </div>

          <div className="rounded-[20px] border border-sky-200 bg-sky-50/70 p-4">
            <div className="flex gap-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-sky-100 text-sky-700"><Info className="h-5 w-5" /></span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-black text-slate-950">Antes de cargar</p>
                <div className="mt-2 grid gap-1.5 text-xs font-semibold text-slate-600 sm:grid-cols-2">
                  <p className="flex gap-2"><Check className="h-4 w-4 shrink-0 text-emerald-600" /> No modifiques los encabezados del formato.</p>
                  <p className="flex gap-2"><Check className="h-4 w-4 shrink-0 text-emerald-600" /> No repitas cédulas dentro del archivo.</p>
                  <p className="flex gap-2"><Check className="h-4 w-4 shrink-0 text-emerald-600" /> Completa todos los campos obligatorios.</p>
                  <p className="flex gap-2"><Check className="h-4 w-4 shrink-0 text-emerald-600" /> Usa áreas, cargos y niveles académicos consistentes.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {result && <div className="mt-5 space-y-4">
          {hasErrors && <div className="overflow-hidden rounded-[22px] border border-amber-200 bg-white">
            <div className="border-b border-amber-100 bg-amber-50 px-4 py-3 text-sm font-black text-amber-900">Errores detectados</div>
            <div className="max-h-72 overflow-auto">
              <table className="w-full min-w-[680px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="px-4 py-3">Fila</th><th className="px-4 py-3">Campo</th><th className="px-4 py-3">Detalle</th></tr></thead>
                <tbody className="divide-y divide-slate-100">{result.errors.slice(0, 30).map((error, idx) => <tr key={`${error.row}-${error.field}-${idx}`}><td className="px-4 py-3 font-bold">{error.row || "Archivo"}</td><td className="px-4 py-3">{error.field}</td><td className="px-4 py-3 text-slate-700">{error.message}</td></tr>)}</tbody>
              </table>
            </div>
          </div>}

          {!hasErrors && result.preview.length > 0 && <div className="overflow-hidden rounded-[22px] border border-slate-200 bg-white">
            <div className="border-b border-slate-100 bg-slate-50 px-4 py-3 text-sm font-black text-slate-900">Vista previa</div>
            <div className="max-h-80 overflow-auto">
              <table className="w-full min-w-[860px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="px-4 py-3">Fila</th><th className="px-4 py-3">Cédula</th><th className="px-4 py-3">Nombre</th><th className="px-4 py-3">Cargo</th><th className="px-4 py-3">Nivel</th><th className="px-4 py-3">Área</th><th className="px-4 py-3">Acción</th></tr></thead>
                <tbody className="divide-y divide-slate-100">{result.preview.map((row) => <tr key={`${row.row}-${row.cedula}`}><td className="px-4 py-3 font-bold">{row.row}</td><td className="px-4 py-3">{row.cedula}</td><td className="px-4 py-3">{row.nombres} {row.apellidos}</td><td className="px-4 py-3">{row.cargo}</td><td className="px-4 py-3">{row.nivel_academico}</td><td className="px-4 py-3">{row.area_departamento}</td><td className="px-4 py-3"><span className={`rounded-full px-3 py-1 text-xs font-black ${row.action === "update" ? "bg-sky-50 text-sky-700" : "bg-emerald-50 text-emerald-700"}`}>{row.action === "update" ? "Actualizar" : "Crear"}</span></td></tr>)}</tbody>
              </table>
            </div>
          </div>}
        </div>}
      </div>

      <div className="sticky bottom-0 z-10 flex shrink-0 flex-col gap-3 border-t border-slate-200 bg-white/95 px-5 py-3 backdrop-blur sm:flex-row sm:justify-end sm:px-6">
        <button onClick={onClose} className="rounded-2xl border border-slate-200 px-5 py-2.5 text-sm font-black text-slate-600 hover:bg-slate-50">Cancelar</button>
        <button disabled={!file || saving} onClick={onValidate} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-violet-300 px-5 py-2.5 text-sm font-black text-violet-700 hover:bg-violet-50 disabled:opacity-50">{saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <ShieldCheck className="h-5 w-5" />} Validar archivo</button>
        <button disabled={!canImport || saving} onClick={onImport} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-violet-700 px-5 py-2.5 text-sm font-black text-white hover:bg-violet-800 disabled:opacity-50">{saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <CloudUpload className="h-5 w-5" />} Importar empleados</button>
      </div>
    </section>
  </div>;
}

function StepPill({ active, number, title, subtitle }: { active: boolean; number: number; title: string; subtitle: string }) {
  return <div className="flex items-center gap-3">
    <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-black ${active ? "bg-violet-700 text-white shadow-lg shadow-violet-200" : "border border-slate-300 bg-slate-50 text-slate-600"}`}>{number}</span>
    <span className="min-w-0">
      <strong className="block text-xs text-slate-900 sm:text-sm">{title}</strong>
      <span className="block text-xs font-semibold text-slate-500">{subtitle}</span>
    </span>
  </div>;
}

function MetricInline({ icon, label, value, tone }: { icon: ReactNode; label: string; value: number; tone: "violet" | "emerald" | "amber" }) {
  const toneClass = {
    violet: "bg-violet-100 text-violet-700",
    emerald: "bg-emerald-100 text-emerald-700",
    amber: "bg-amber-100 text-amber-700",
  }[tone];
  return <div className="flex items-center gap-3 border-slate-200 md:border-r md:pr-4 last:md:border-r-0">
    <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${toneClass}`}>{icon}</span>
    <span>
      <strong className="block text-lg font-black text-slate-950">{value}</strong>
      <span className="text-xs font-semibold text-slate-500">{label}</span>
    </span>
  </div>;
}

function formatFileSize(bytes: number) {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 KB";
  const mb = bytes / (1024 * 1024);
  if (mb >= 1) return `${mb.toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
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
