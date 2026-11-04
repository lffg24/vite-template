import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { AlertCircle, BarChart3, Building2, ClipboardList, Eye, Loader2, Plus, Search, Trash2, TriangleAlert, Users, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { EmpresaAsignada } from "@/features/psicosocial/api/psicoAccessService";
import { usePsicoEmpresaActiva } from "@/features/psicosocial/context/PsicoEmpresaActivaContext";
import { EmpresaDeletionPreview, psicoAdminService } from "@/features/psicosocial/api/psicoAdminService";
import { AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

function n(value: unknown) {
  const num = Number(value ?? 0);
  return Number.isFinite(num) ? num : 0;
}

export default function EmpresasPsicoPage() {
  const navigate = useNavigate();
  const { empresas, loading, error, errorStatus, onboardingRequired, message, crearEmpresa, recargarEmpresas } = usePsicoEmpresaActiva();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [empresaToDelete, setEmpresaToDelete] = useState<EmpresaAsignada | null>(null);
  const [deletionPreview, setDeletionPreview] = useState<EmpresaDeletionPreview | null>(null);
  const [deletionLoading, setDeletionLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return empresas;
    return empresas.filter((e) => `${e.nombre} ${e.nit ?? ""} ${e.ciudad ?? ""}`.toLowerCase().includes(term));
  }, [empresas, q]);

  const showEmpty = !loading && !error && empresas.length === 0;

  return (
    <div className="space-y-6">
      <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent text-brand-primary"><Building2 className="h-7 w-7" /></div>
            <div><h1 className="text-3xl font-black text-slate-950">Empresas</h1><p className="text-sm text-slate-500">Crea y administra empresas vinculadas a tu perfil de psicólogo.</p></div>
          </div>
          <button type="button" onClick={() => setOpen(true)} className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-primary-foreground shadow-sm hover:bg-primary-hover"><Plus className="h-4 w-4" /> Nueva empresa</button>
        </div>
      </section>

      <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3"><Search className="h-4 w-4 text-slate-400" /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar empresa, NIT o ciudad..." className="w-full outline-none" /></div>

        {errorStatus === 401 && <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">Tu sesión no está autorizando esta consulta. Vuelve a iniciar sesión para renovar la cookie segura.</div>}
        {error && errorStatus !== 401 && <div className="mb-4 flex items-start justify-between gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"><div className="flex gap-2"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /><span>{error}</span></div><button type="button" onClick={() => void recargarEmpresas()} className="font-bold hover:underline">Reintentar</button></div>}

        {loading ? (
          <div className="flex items-center justify-center gap-2 p-10 text-slate-500"><Loader2 className="h-4 w-4 animate-spin" /> Cargando empresas...</div>
        ) : showEmpty ? (
          <EmptyState onboardingRequired={onboardingRequired} message={message} onCreate={() => setOpen(true)} />
        ) : (
          <div className="overflow-hidden rounded-2xl border border-slate-200">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-4 py-3">Empresa</th><th className="px-4 py-3">Rol / Permisos</th><th className="px-4 py-3">Empleados</th><th className="px-4 py-3">Aplicaciones</th><th className="px-4 py-3">Resultados</th><th className="px-4 py-3 text-right">Acciones</th></tr></thead>
              <tbody className="divide-y divide-slate-100">{filtered.map((e) => <EmpresaRow key={e.empresa_id} empresa={e} onView={() => navigate(`/psicosocial/empresas/${e.empresa_id}`)} onDelete={() => void openDeletionDialog(e)} />)}</tbody>
            </table>
          </div>
        )}
      </section>

      <CrearEmpresaDrawer open={open} onClose={() => setOpen(false)} onCreate={async (payload) => { const result = await crearEmpresa(payload); setOpen(false); const empresaId = result?.empresa_id; if (empresaId) navigate(`/psicosocial/empresas/${empresaId}`); }} />
      <AlertDialog open={Boolean(empresaToDelete)} onOpenChange={(next) => { if (!next && !deletionLoading && !deleting) closeDeletionDialog(); }}>
        <AlertDialogContent className="max-h-[calc(100vh-2rem)] overflow-y-auto rounded-[28px] border-slate-200 p-6 sm:max-w-2xl">
          <AlertDialogHeader>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-destructive">Eliminar empresa</p>
            <AlertDialogTitle className="font-heading text-2xl font-black text-foreground">{empresaToDelete?.nombre}</AlertDialogTitle>
            <AlertDialogDescription className="leading-6">Se eliminarán los colaboradores y las aplicaciones que estén en curso. Esta acción nunca restaura créditos ya consumidos.</AlertDialogDescription>
          </AlertDialogHeader>
          {deletionLoading && <div className="flex items-center gap-3 rounded-2xl border border-sky-200 bg-sky-50 p-4 text-sm font-semibold text-slate-700"><Loader2 className="h-5 w-5 animate-spin text-brand-sky" /> Validando aplicaciones y registros…</div>}
          {!deletionLoading && deletionPreview?.bloqueada && <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4"><div className="flex gap-3"><TriangleAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" /><div><p className="font-heading font-black text-amber-950">La eliminación está bloqueada</p><p className="mt-1 text-sm leading-6 text-amber-900">Hay baterías finalizadas. Conservamos esos resultados y por eso la empresa no puede eliminarse.</p></div></div><ApplicationList title="Baterías finalizadas" items={deletionPreview.aplicaciones_finalizadas} /></div>}
          {!deletionLoading && deletionPreview?.puede_eliminar && <div className="space-y-3 rounded-2xl border border-destructive/25 bg-destructive/5 p-4 text-sm leading-6 text-slate-800"><p className="font-heading font-black text-foreground">Confirmación requerida</p><p>Se eliminarán {deletionPreview.aplicaciones_en_curso.length} aplicación(es) en curso y {deletionPreview.total_colaboradores} colaborador(es) registrado(s).</p><ApplicationList title="Aplicaciones que se eliminarán" items={deletionPreview.aplicaciones_en_curso} /><p className="rounded-xl border border-amber-200 bg-amber-50 p-3 font-semibold text-amber-950">Los {deletionPreview.creditos_consumidos} crédito(s) ya consumido(s) no se restauran.</p></div>}
          {!deletionLoading && !deletionPreview && <div className="rounded-2xl border border-destructive/25 bg-destructive/5 p-4 text-sm text-destructive">No fue posible validar la eliminación. Cierra el modal e inténtalo nuevamente.</div>}
          <AlertDialogFooter className="gap-3 sm:gap-3"><AlertDialogCancel disabled={deletionLoading || deleting} className="rounded-2xl">Cancelar</AlertDialogCancel>{deletionPreview?.puede_eliminar && <Button type="button" variant="destructive" disabled={deleting} onClick={() => void confirmDeletion()} className="rounded-2xl">{deleting ? <Loader2 className="animate-spin" /> : <Trash2 />} Eliminar empresa</Button>}</AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );

  function closeDeletionDialog() {
    setEmpresaToDelete(null);
    setDeletionPreview(null);
  }

  async function openDeletionDialog(empresa: EmpresaAsignada) {
    setEmpresaToDelete(empresa);
    setDeletionPreview(null);
    setDeletionLoading(true);
    try {
      setDeletionPreview(await psicoAdminService.previewEliminarEmpresa(empresa.empresa_id));
    } finally {
      setDeletionLoading(false);
    }
  }

  async function confirmDeletion() {
    if (!empresaToDelete || !deletionPreview?.puede_eliminar) return;
    setDeleting(true);
    try {
      await psicoAdminService.eliminarEmpresa(empresaToDelete.empresa_id);
      closeDeletionDialog();
      await recargarEmpresas();
    } catch (error: any) {
      const detail = error?.detail as EmpresaDeletionPreview | undefined;
      if (error?.status === 409 && detail?.aplicaciones_finalizadas) setDeletionPreview(detail);
    } finally {
      setDeleting(false);
    }
  }
}

function EmpresaRow({ empresa, onView, onDelete }: { empresa: EmpresaAsignada; onView: () => void; onDelete: () => void }) {
  const empleados = n((empresa as any).empleados);
  const aplicaciones = n((empresa as any).aplicaciones);
  const resultados = n((empresa as any).resultados ?? (empresa as any).evaluaciones_calculadas);
  return (
    <tr className="hover:bg-slate-50">
      <td className="px-4 py-4"><button onClick={onView} className="font-black text-slate-950 hover:text-brand-primary hover:underline">{empresa.nombre}</button><p className="text-xs text-slate-500">NIT {empresa.nit || "Sin dato"} · {empresa.estado || "Activa"}</p></td>
      <td className="px-4 py-4 text-slate-600"><span className="rounded-full bg-accent px-2 py-1 text-xs font-bold text-brand-primary">{empresa.rol_en_empresa || "PSICOLOGO_EVALUADOR"}</span><div className="mt-2 flex flex-wrap gap-1 text-[11px]">{empresa.puede_ver_individuales && <Badge>Individuales</Badge>}{empresa.puede_cargar_respuestas && <Badge>Carga</Badge>}{empresa.puede_crear_aplicaciones && <Badge>Aplicaciones</Badge>}{empresa.puede_validar_informes && <Badge>Validación</Badge>}</div></td>
      <td className="px-4 py-4"><Metric icon={<Users className="h-4 w-4 text-brand-primary" />} value={empleados} /></td>
      <td className="px-4 py-4"><Metric icon={<ClipboardList className="h-4 w-4 text-brand-primary" />} value={aplicaciones} /></td>
      <td className="px-4 py-4"><Metric icon={<BarChart3 className="h-4 w-4 text-brand-primary" />} value={resultados} /></td>
      <td className="px-4 py-4 text-right"><div className="flex justify-end gap-2"><button onClick={onView} className="inline-flex items-center gap-2 rounded-xl border px-3 py-2 font-bold hover:bg-slate-50"><Eye className="h-4 w-4" /> Ver</button><button onClick={onDelete} className="inline-flex items-center gap-2 rounded-xl border border-destructive/25 px-3 py-2 font-bold text-destructive hover:bg-destructive/5" aria-label={`Eliminar ${empresa.nombre}`}><Trash2 className="h-4 w-4" /><span className="sr-only sm:not-sr-only">Eliminar</span></button></div></td>
    </tr>
  );
}

function ApplicationList({ title, items }: { title: string; items: EmpresaDeletionPreview["aplicaciones_en_curso"] }) {
  if (!items.length) return null;
  return <div className="mt-3"><p className="text-xs font-black uppercase tracking-wide text-slate-600">{title}</p><ul className="mt-2 max-h-40 space-y-2 overflow-y-auto rounded-xl border border-slate-200 bg-white/80 p-3 text-sm">{items.map((item) => <li key={item.id} className="flex items-center justify-between gap-3"><span className="font-semibold text-slate-800">{item.nombre}</span><span className="shrink-0 text-slate-500">{item.estado_label}</span></li>)}</ul></div>;
}

function Metric({ icon, value }: { icon: ReactNode; value: number }) { return <span className="inline-flex items-center gap-2 font-black text-slate-950">{icon}{value.toLocaleString("es-CO")}</span>; }
function Badge({ children }: { children: ReactNode }) { return <span className="rounded-full bg-slate-100 px-2 py-0.5 font-bold text-slate-600">{children}</span>; }

function EmptyState({ onboardingRequired, message, onCreate }: { onboardingRequired: boolean; message?: string | null; onCreate: () => void }) { return <div className="rounded-3xl border border-dashed border-accent bg-accent/60 p-10 text-center"><div className="mx-auto grid h-16 w-16 place-items-center rounded-3xl bg-white text-brand-primary shadow-sm"><Building2 className="h-8 w-8" /></div><h2 className="mt-4 text-2xl font-black text-slate-950">{onboardingRequired ? "Crea tu primera empresa" : "No hay empresas para mostrar"}</h2><p className="mx-auto mt-2 max-w-2xl text-sm text-slate-600">{message || "Al crear una empresa desde este módulo quedará vinculada automáticamente a tu perfil de psicólogo y podrás iniciar el flujo de empleados, aplicaciones, respuestas y resultados."}</p><button type="button" onClick={onCreate} className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-black text-primary-foreground hover:bg-primary-hover"><Plus className="h-4 w-4" /> Crear empresa</button></div>; }

function CrearEmpresaDrawer({ open, onClose, onCreate }: { open: boolean; onClose: () => void; onCreate: (payload: { nombre: string; nit?: string | null }) => Promise<void>; }) {
  const [nombre, setNombre] = useState("");
  const [nit, setNit] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  if (!open) return null;
  const submit = async (ev: React.FormEvent) => { ev.preventDefault(); setError(null); if (nombre.trim().length < 2) { setError("El nombre de la empresa debe tener al menos 2 caracteres."); return; } setSubmitting(true); try { await onCreate({ nombre, nit: nit || null }); setNombre(""); setNit(""); } catch (err) { setError(err instanceof Error ? err.message : "No fue posible crear la empresa."); } finally { setSubmitting(false); } };
  return <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/40 backdrop-blur-sm"><button type="button" className="absolute inset-0 cursor-default" onClick={onClose} aria-label="Cerrar" /><aside className="relative h-full w-full max-w-xl overflow-y-auto bg-white p-6 shadow-2xl"><div className="flex items-start justify-between gap-4"><div><div className="text-sm font-bold uppercase tracking-wide text-brand-primary">Nueva empresa</div><h2 className="mt-1 text-3xl font-black text-slate-950">Crear empresa vinculada</h2><p className="mt-2 text-sm text-slate-500">Esta empresa quedará asociada automáticamente a tu usuario psicólogo para operar el módulo psicosocial.</p></div><button type="button" onClick={onClose} className="rounded-full border p-2 hover:bg-slate-50"><X className="h-5 w-5" /></button></div><form onSubmit={submit} className="mt-8 space-y-5"><label className="block text-sm font-bold text-slate-700">Nombre o razón social *<input value={nombre} onChange={(e) => setNombre(e.target.value)} className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-input-focus focus:ring-4 focus:ring-input-focus/20" placeholder="Ej. Constructora Andina S.A.S." /></label><label className="block text-sm font-bold text-slate-700">NIT<input value={nit} onChange={(e) => setNit(e.target.value)} className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-input-focus focus:ring-4 focus:ring-input-focus/20" placeholder="Ej. 900123456-7" /></label>{error && <div className="rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}<div className="flex justify-end gap-3 pt-6"><button type="button" onClick={onClose} className="rounded-xl border px-4 py-2 font-bold">Cancelar</button><button disabled={submitting} className="rounded-xl bg-primary px-5 py-2 font-bold text-primary-foreground disabled:opacity-60">{submitting ? "Creando..." : "Crear y vincular"}</button></div></form></aside></div>;
}
