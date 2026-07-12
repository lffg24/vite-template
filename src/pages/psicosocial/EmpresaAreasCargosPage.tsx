import type { ReactNode } from "react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, BriefcaseBusiness, Building2, Edit3, Loader2, Plus, Power, RefreshCw, Trash2, X } from "lucide-react";
import { AreaEmpresa, CargoEmpresa, psicoAdminService } from "@/features/psicosocial/api/psicoAdminService";
import { ToastCard, type ToastPayload } from "@/components/feedback/ToastCard";
import { StandardPagination } from "@/components/common/StandardPagination";

type DrawerState =
  | { type: "area"; mode: "create"; item?: undefined }
  | { type: "area"; mode: "edit"; item: AreaEmpresa }
  | { type: "cargo"; mode: "create"; item?: undefined }
  | { type: "cargo"; mode: "edit"; item: CargoEmpresa }
  | null;

type CatalogTab = "areas" | "cargos";

export function paginateCatalogItems<T>(items: T[], page: number, pageSize: number) {
  const safePageSize = Math.max(1, Number(pageSize || 10));
  const totalPages = Math.max(1, Math.ceil(items.length / safePageSize));
  const currentPage = Math.min(Math.max(1, Number(page || 1)), totalPages);
  const start = (currentPage - 1) * safePageSize;
  return {
    currentPage,
    items: items.slice(start, start + safePageSize),
  };
}

export default function EmpresaAreasCargosPage() {
  const { empresaId = "" } = useParams();
  const navigate = useNavigate();
  const [areas, setAreas] = useState<AreaEmpresa[]>([]);
  const [cargos, setCargos] = useState<CargoEmpresa[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [drawer, setDrawer] = useState<DrawerState>(null);
  const [toast, setToast] = useState<ToastPayload | null>(null);
  const [activeTab, setActiveTab] = useState<CatalogTab>("areas");
  const [areasPage, setAreasPage] = useState(1);
  const [areasPageSize, setAreasPageSize] = useState(10);
  const [cargosPage, setCargosPage] = useState(1);
  const [cargosPageSize, setCargosPageSize] = useState(10);

  const notify = (payload: Omit<ToastPayload, "id">) => {
    const id = Date.now();
    setToast({ id, ...payload });
    window.setTimeout(() => setToast((current) => (current?.id === id ? null : current)), 4200);
  };

  const load = async () => {
    if (!empresaId) return;
    setLoading(true);
    try {
      const [areasRes, cargosRes] = await Promise.all([
        psicoAdminService.listarAreas(empresaId, true),
        psicoAdminService.listarCargos(empresaId, null, true),
      ]);
      setAreas(areasRes.items || []);
      setCargos(cargosRes.items || []);
    } catch (error: any) {
      notify({ type: "error", title: "No fue posible cargar", message: error?.message || "Revisa la conexión e intenta nuevamente." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [empresaId]);

  const areaById = useMemo(() => new Map(areas.map((area) => [area.id, area])), [areas]);
  const cargosPorArea = useMemo(() => {
    const counts = new Map<number, number>();
    for (const cargo of cargos) {
      if (cargo.area_id) counts.set(cargo.area_id, (counts.get(cargo.area_id) || 0) + 1);
    }
    return counts;
  }, [cargos]);
  const paginatedAreas = useMemo(() => paginateCatalogItems(areas, areasPage, areasPageSize), [areas, areasPage, areasPageSize]);
  const paginatedCargos = useMemo(() => paginateCatalogItems(cargos, cargosPage, cargosPageSize), [cargos, cargosPage, cargosPageSize]);

  useEffect(() => {
    setAreasPage(1);
  }, [areas.length, areasPageSize]);

  useEffect(() => {
    setCargosPage(1);
  }, [cargos.length, cargosPageSize]);

  const disableArea = async (area: AreaEmpresa, activo: boolean) => {
    try {
      await psicoAdminService.actualizarArea(empresaId, area.id, { activo });
      notify({ type: "success", title: activo ? "Área habilitada" : "Área deshabilitada", message: area.nombre });
      await load();
    } catch (error: any) {
      notify({ type: "error", title: "No fue posible actualizar", message: error?.message || "Intenta nuevamente." });
    }
  };

  const disableCargo = async (cargo: CargoEmpresa, activo: boolean) => {
    try {
      await psicoAdminService.actualizarCargo(empresaId, cargo.id, { activo });
      notify({ type: "success", title: activo ? "Cargo habilitado" : "Cargo deshabilitado", message: cargo.nombre });
      await load();
    } catch (error: any) {
      notify({ type: "error", title: "No fue posible actualizar", message: error?.message || "Intenta nuevamente." });
    }
  };

  const deleteArea = async (area: AreaEmpresa) => {
    if ((area.cargos_count ?? cargosPorArea.get(area.id) ?? 0) > 0) {
      notify({ type: "warning", title: "Área con cargos", message: "No se puede eliminar. Puedes deshabilitarla para ocultarla de nuevas cargas." });
      return;
    }
    if (!window.confirm(`¿Eliminar el área "${area.nombre}"?`)) return;
    try {
      await psicoAdminService.eliminarArea(empresaId, area.id);
      notify({ type: "success", title: "Área eliminada", message: area.nombre });
      await load();
    } catch (error: any) {
      notify({ type: "error", title: "No fue posible eliminar", message: error?.message || "Esta área puede tener dependencias." });
    }
  };

  const deleteCargo = async (cargo: CargoEmpresa) => {
    if ((cargo.empleados_count || 0) > 0) {
      notify({ type: "warning", title: "Cargo con colaboradores", message: "No se puede eliminar. Puedes deshabilitarlo para ocultarlo de nuevas cargas." });
      return;
    }
    if (!window.confirm(`¿Eliminar el cargo "${cargo.nombre}"?`)) return;
    try {
      await psicoAdminService.eliminarCargo(empresaId, cargo.id);
      notify({ type: "success", title: "Cargo eliminado", message: cargo.nombre });
      await load();
    } catch (error: any) {
      notify({ type: "error", title: "No fue posible eliminar", message: error?.message || "Este cargo puede tener dependencias." });
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <button onClick={() => navigate(`/psicosocial/empresas/${empresaId}`)} className="inline-flex items-center gap-2 rounded-xl border bg-white px-4 py-2 text-sm font-bold shadow-sm hover:bg-slate-50">
          <ArrowLeft className="h-4 w-4" /> Volver a empresa
        </button>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-violet-700">Configuración de colaboradores</p>
              <h1 className="text-3xl font-black text-slate-950">Áreas y cargos</h1>
              <p className="mt-1 text-sm text-slate-500">Gestiona la estructura base usada al crear colaboradores y aplicaciones.</p>
            </div>
            <button onClick={() => void load()} className="inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-bold hover:bg-slate-50">
              <RefreshCw className="h-4 w-4" /> Actualizar
            </button>
          </div>
        </section>

        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-slate-100 p-5 lg:flex-row lg:items-center lg:justify-between">
            <div role="tablist" aria-label="Gestión de áreas y cargos" className="flex flex-wrap gap-2">
              <CatalogTabButton
                active={activeTab === "areas"}
                icon={<Building2 className="h-4 w-4" />}
                label="Áreas"
                count={areas.length}
                onClick={() => setActiveTab("areas")}
              />
              <CatalogTabButton
                active={activeTab === "cargos"}
                icon={<BriefcaseBusiness className="h-4 w-4" />}
                label="Cargos"
                count={cargos.length}
                onClick={() => setActiveTab("cargos")}
              />
            </div>
            <button
              onClick={() => setDrawer(activeTab === "areas" ? { type: "area", mode: "create" } : { type: "cargo", mode: "create" })}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-700 px-4 py-2 text-sm font-bold text-white hover:bg-violet-800"
            >
              <Plus className="h-4 w-4" /> {activeTab === "areas" ? "Nueva área" : "Nuevo cargo"}
            </button>
          </div>

          {activeTab === "areas" ? (
            <div role="tabpanel" aria-label="Áreas">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                    <tr><th className="px-5 py-4">Área</th><th className="px-5 py-4">Cargos</th><th className="px-5 py-4">Estado</th><th className="px-5 py-4 text-right">Acción</th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {loading ? <EmptyRow colSpan={4} text="Cargando áreas..." /> : areas.length === 0 ? <EmptyRow colSpan={4} text="No hay áreas registradas." /> : paginatedAreas.items.map((area) => {
                      const count = area.cargos_count ?? cargosPorArea.get(area.id) ?? 0;
                      return (
                        <tr key={area.id} className="hover:bg-slate-50">
                          <td className="px-5 py-4"><strong className="block text-slate-950">{area.nombre}</strong><span className="text-xs text-slate-500">{area.descripcion || "Sin descripción"}</span></td>
                          <td className="px-5 py-4 font-bold">{count}</td>
                          <td className="px-5 py-4"><StatusPill active={area.activo !== false} /></td>
                          <td className="px-5 py-4"><RowActions active={area.activo !== false} onEdit={() => setDrawer({ type: "area", mode: "edit", item: area })} onToggle={() => void disableArea(area, area.activo === false)} onDelete={() => void deleteArea(area)} /></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <StandardPagination
                page={paginatedAreas.currentPage}
                pageSize={areasPageSize}
                total={areas.length}
                itemLabel="áreas"
                onPageChange={setAreasPage}
                onPageSizeChange={(size) => { setAreasPageSize(size); setAreasPage(1); }}
              />
            </div>
          ) : (
            <div role="tabpanel" aria-label="Cargos">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[920px] text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                    <tr><th className="px-5 py-4">Cargo</th><th className="px-5 py-4">Área</th><th className="px-5 py-4">Uso</th><th className="px-5 py-4">Estado</th><th className="px-5 py-4 text-right">Acción</th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {loading ? <EmptyRow colSpan={5} text="Cargando cargos..." /> : cargos.length === 0 ? <EmptyRow colSpan={5} text="No hay cargos registrados." /> : paginatedCargos.items.map((cargo) => (
                      <tr key={cargo.id} className="hover:bg-slate-50">
                        <td className="px-5 py-4"><strong className="block text-slate-950">{cargo.nombre}</strong><span className="text-xs text-slate-500">{cargo.nivel || "Sin nivel"}</span></td>
                        <td className="px-5 py-4">{cargo.area_nombre || (cargo.area_id ? areaById.get(cargo.area_id)?.nombre : "") || "Sin área"}</td>
                        <td className="px-5 py-4 font-bold">{cargo.empleados_count || 0}</td>
                        <td className="px-5 py-4"><StatusPill active={cargo.activo !== false} /></td>
                        <td className="px-5 py-4"><RowActions active={cargo.activo !== false} onEdit={() => setDrawer({ type: "cargo", mode: "edit", item: cargo })} onToggle={() => void disableCargo(cargo, cargo.activo === false)} onDelete={() => void deleteCargo(cargo)} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <StandardPagination
                page={paginatedCargos.currentPage}
                pageSize={cargosPageSize}
                total={cargos.length}
                itemLabel="cargos"
                onPageChange={setCargosPage}
                onPageSizeChange={(size) => { setCargosPageSize(size); setCargosPage(1); }}
              />
            </div>
          )}
        </section>
      </div>

      {drawer && <CatalogDrawer drawer={drawer} areas={areas.filter((area) => area.activo !== false)} saving={saving} setSaving={setSaving} onClose={() => setDrawer(null)} onSaved={async () => { setDrawer(null); await load(); }} notify={notify} empresaId={empresaId} />}
      {toast && <ToastCard toast={toast} onClose={() => setToast(null)} />}
    </main>
  );
}

function CatalogTabButton({ active, icon, label, count, onClick }: { active: boolean; icon: ReactNode; label: string; count: number; onClick: () => void }) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-black transition ${
        active ? "bg-violet-700 text-white shadow-sm shadow-violet-200" : "bg-slate-100 text-slate-600 hover:bg-violet-50 hover:text-violet-700"
      }`}
    >
      {icon}
      {label}
      <span className={`rounded-full px-2 py-0.5 text-[11px] ${active ? "bg-white/20 text-white" : "bg-white text-slate-500"}`}>{count}</span>
    </button>
  );
}

function EmptyRow({ colSpan, text }: { colSpan: number; text: string }) {
  return <tr><td colSpan={colSpan} className="px-4 py-10 text-center text-slate-500">{text}</td></tr>;
}

function StatusPill({ active }: { active: boolean }) {
  return <span className={`inline-flex whitespace-nowrap rounded-full px-3 py-1 text-xs font-black ${active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>{active ? "Activo" : "Inactivo"}</span>;
}

function RowActions({ active, onEdit, onToggle, onDelete }: { active: boolean; onEdit: () => void; onToggle: () => void; onDelete: () => void }) {
  return (
    <div className="flex justify-end gap-2">
      <button onClick={onEdit} className="rounded-xl border p-2 text-slate-600 hover:bg-slate-50" title="Editar"><Edit3 className="h-4 w-4" /></button>
      <button onClick={onToggle} className="rounded-xl border p-2 text-violet-700 hover:bg-violet-50" title={active ? "Deshabilitar" : "Habilitar"}><Power className="h-4 w-4" /></button>
      <button onClick={onDelete} className="rounded-xl border border-red-100 bg-red-50 p-2 text-red-600 hover:bg-red-100" title="Eliminar"><Trash2 className="h-4 w-4" /></button>
    </div>
  );
}

function CatalogDrawer({ drawer, areas, saving, setSaving, onClose, onSaved, notify, empresaId }: { drawer: NonNullable<DrawerState>; areas: AreaEmpresa[]; saving: boolean; setSaving: (value: boolean) => void; onClose: () => void; onSaved: () => Promise<void>; notify: (payload: Omit<ToastPayload, "id">) => void; empresaId: string }) {
  const isArea = drawer.type === "area";
  const [nombre, setNombre] = useState(drawer.item?.nombre || "");
  const [descripcion, setDescripcion] = useState(isArea ? (drawer.item as AreaEmpresa | undefined)?.descripcion || "" : "");
  const [areaId, setAreaId] = useState(!isArea ? String((drawer.item as CargoEmpresa | undefined)?.area_id || "") : "");
  const [nivel, setNivel] = useState(!isArea ? (drawer.item as CargoEmpresa | undefined)?.nivel || "" : "");

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!nombre.trim()) {
      notify({ type: "warning", title: "Nombre requerido", message: "Completa el nombre antes de guardar." });
      return;
    }
    if (!isArea && !areaId) {
      notify({ type: "warning", title: "Área requerida", message: "Todo cargo debe estar asociado a un área activa." });
      return;
    }
    setSaving(true);
    try {
      if (isArea) {
        if (drawer.mode === "create") {
          await psicoAdminService.crearArea(empresaId, { nombre: nombre.trim(), descripcion: descripcion.trim() || undefined });
        } else {
          await psicoAdminService.actualizarArea(empresaId, drawer.item.id, { nombre: nombre.trim(), descripcion: descripcion.trim() });
        }
      } else if (drawer.mode === "create") {
        await psicoAdminService.crearCargo(empresaId, { nombre: nombre.trim(), area_id: Number(areaId), nivel: nivel.trim() || undefined });
      } else {
        await psicoAdminService.actualizarCargo(empresaId, drawer.item.id, { nombre: nombre.trim(), area_id: Number(areaId), nivel: nivel.trim() });
      }
      notify({ type: "success", title: isArea ? "Área guardada" : "Cargo guardado", message: nombre.trim() });
      await onSaved();
    } catch (error: any) {
      notify({ type: "error", title: "No fue posible guardar", message: error?.message || "Revisa los datos e intenta nuevamente." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/45 backdrop-blur-sm">
      <aside className="h-full w-full max-w-xl overflow-y-auto bg-white p-6 shadow-2xl">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-violet-700">{drawer.mode === "create" ? "Nuevo registro" : "Editar registro"}</p>
            <h2 className="text-2xl font-black text-slate-950">{isArea ? "Área" : "Cargo"}</h2>
          </div>
          <button onClick={onClose} className="rounded-2xl border p-2 hover:bg-slate-50"><X className="h-5 w-5" /></button>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <Field label={isArea ? "Nombre del área *" : "Nombre del cargo *"}><Input value={nombre} onChange={setNombre} /></Field>
          {isArea ? (
            <Field label="Descripción"><Input value={descripcion} onChange={setDescripcion} /></Field>
          ) : (
            <>
              <Field label="Área *">
                <select value={areaId} onChange={(event) => setAreaId(event.target.value)} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-100">
                  <option value="">Selecciona área</option>
                  {areas.map((area) => <option key={area.id} value={area.id}>{area.nombre}</option>)}
                </select>
              </Field>
              <Field label="Nivel"><Input value={nivel} onChange={setNivel} /></Field>
            </>
          )}
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={onClose} className="rounded-2xl border px-5 py-3 font-bold">Cancelar</button>
            <button disabled={saving} className="inline-flex items-center gap-2 rounded-2xl bg-violet-700 px-6 py-3 font-bold text-white disabled:opacity-60">
              {saving && <Loader2 className="h-4 w-4 animate-spin" />} Guardar
            </button>
          </div>
        </form>
      </aside>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return <label className="block space-y-1 text-sm font-bold text-slate-700"><span>{label}</span>{children}</label>;
}

function Input({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return <input value={value} onChange={(event) => onChange(event.target.value)} className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-100" />;
}
