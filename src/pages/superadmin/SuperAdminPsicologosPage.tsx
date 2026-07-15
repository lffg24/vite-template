// src/pages/superadmin/SuperAdminPsicologosPage.tsx
import { FormEvent, ReactNode, useEffect, useMemo, useState } from "react";
import { Building2, Check, Eye, EyeOff, KeyRound, Loader2, Pencil, Plus, ShieldCheck, UserRound, WalletCards, X } from "lucide-react";

import { ToastCard, type ToastPayload } from "@/components/feedback/ToastCard";
import { StandardPagination } from "@/components/common/StandardPagination";
import { Input as UiInput } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  superadminService,
  type ActualizarPsicologoPayload,
  type CrearPsicologoPayload,
  type SuperEmpresa,
  type SuperPsicologo,
} from "@/features/superadmin/api/superadminService";
import AbrilDatePicker from "@/features/psicosocial/components/AbrilDatePicker";
import SuperAdminPageHeader from "./SuperAdminPageHeader";

type FormState = {
  nombre: string;
  email: string;
  password: string;
  confirmPassword: string;
  empresa_ids: string[];
  identificacion_profesional: string;
  profesion: string;
  postgrado: string;
  tarjeta_profesional: string;
  licencia_sst: string;
  fecha_expedicion_licencia: string;
  puede_validar_informes: boolean;
  puede_ver_individuales: boolean;
  puede_cargar_respuestas: boolean;
  puede_crear_aplicaciones: boolean;
};

const emptyForm: FormState = {
  nombre: "",
  email: "",
  password: "",
  confirmPassword: "",
  empresa_ids: [],
  identificacion_profesional: "",
  profesion: "Psicóloga",
  postgrado: "",
  tarjeta_profesional: "",
  licencia_sst: "",
  fecha_expedicion_licencia: "",
  puede_validar_informes: false,
  puede_ver_individuales: true,
  puede_cargar_respuestas: true,
  puede_crear_aplicaciones: true,
};

const defaultCreditReason = "Compra de créditos";

function validateEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export default function SuperAdminPsicologosPage() {
  const [items, setItems] = useState<SuperPsicologo[]>([]);
  const [empresas, setEmpresas] = useState<SuperEmpresa[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [q, setQ] = useState("");
  const [empresaEstado, setEmpresaEstado] = useState("ALL");
  const [creditoEstado, setCreditoEstado] = useState("ALL");
  const [empresaQ, setEmpresaQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingCredits, setSavingCredits] = useState(false);
  const [savingPasswordReset, setSavingPasswordReset] = useState(false);
  const [openCreate, setOpenCreate] = useState(false);
  const [editingTarget, setEditingTarget] = useState<SuperPsicologo | null>(null);
  const [passwordResetTarget, setPasswordResetTarget] = useState<SuperPsicologo | null>(null);
  const [resetPassword, setResetPassword] = useState("");
  const [resetConfirmPassword, setResetConfirmPassword] = useState("");
  const [creditTarget, setCreditTarget] = useState<SuperPsicologo | null>(null);
  const [creditAmount, setCreditAmount] = useState("");
  const [creditReason, setCreditReason] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastPayload | null>(null);

  const notify = (payload: Omit<ToastPayload, "id">) => {
    const id = Date.now();
    setToast({ id, ...payload });
    window.setTimeout(() => setToast((current) => (current?.id === id ? null : current)), 4200);
  };

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [psicologosRes, empresasRes] = await Promise.all([
        superadminService.psicologos({
          q,
          page,
          page_size: pageSize,
          empresa_estado: empresaEstado === "ALL" ? undefined : empresaEstado,
          credito_estado: creditoEstado === "ALL" ? undefined : creditoEstado,
        }),
        superadminService.empresas({ page: 1, page_size: 100 }),
      ]);
      setItems(psicologosRes.items || []);
      setTotal(psicologosRes.total || 0);
      setEmpresas(empresasRes.items || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No fue posible cargar psicólogos.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(load, 250);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, empresaEstado, creditoEstado, page, pageSize]);

  useEffect(() => {
    setPage(1);
  }, [q, empresaEstado, creditoEstado, pageSize]);

  const filteredEmpresas = useMemo(() => {
    const term = empresaQ.trim().toLowerCase();
    if (!term) return empresas;
    return empresas.filter((empresa) => `${empresa.nombre || ""} ${empresa.nit || ""}`.toLowerCase().includes(term));
  }, [empresas, empresaQ]);

  const updateForm = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setFieldErrors((prev) => ({ ...prev, [key]: "" }));
  };

  const openCreateModal = () => {
    setEditingTarget(null);
    setForm(emptyForm);
    setFieldErrors({});
    setShowPassword(false);
    setOpenCreate(true);
  };

  const openEditModal = (psicologo: SuperPsicologo) => {
    setEditingTarget(psicologo);
    setForm({
      ...emptyForm,
      nombre: psicologo.nombre || "",
      email: psicologo.email || "",
      empresa_ids: psicologo.empresa_ids || [],
      identificacion_profesional: psicologo.identificacion_profesional || "",
      profesion: psicologo.profesion || "Psicóloga",
      postgrado: psicologo.postgrado || "",
      tarjeta_profesional: psicologo.tarjeta_profesional || "",
      licencia_sst: psicologo.licencia_sst || "",
      fecha_expedicion_licencia: psicologo.fecha_expedicion_licencia || "",
      password: "",
      confirmPassword: "",
    });
    setFieldErrors({});
    setOpenCreate(true);
  };

  const closeFormModal = () => {
    setOpenCreate(false);
    setEditingTarget(null);
    setForm(emptyForm);
    setFieldErrors({});
  };

  const toggleEmpresa = (empresaId: string) => {
    setForm((prev) => {
      const exists = prev.empresa_ids.includes(empresaId);
      return {
        ...prev,
        empresa_ids: exists ? prev.empresa_ids.filter((id) => id !== empresaId) : [...prev.empresa_ids, empresaId],
      };
    });
    setFieldErrors((prev) => ({ ...prev, empresa_ids: "" }));
  };

  const validateForm = () => {
    const next: Record<string, string> = {};
    if (!form.nombre.trim()) next.nombre = "El nombre es obligatorio.";
    if (!validateEmail(form.email)) next.email = "Correo inválido.";
    if (!editingTarget) {
      if (form.password.length < 12) next.password = "La contraseña temporal debe tener mínimo 12 caracteres.";
      if (form.password !== form.confirmPassword) next.confirmPassword = "Las contraseñas no coinciden.";
    }
    if (form.identificacion_profesional.trim() && form.identificacion_profesional.trim().length < 5) {
      next.identificacion_profesional = "La identificación debe tener mínimo 5 caracteres.";
    }
    setFieldErrors(next);
    if (Object.keys(next).length) {
      notify({ type: "warning", title: "Revisa los datos", message: "Faltan campos obligatorios o hay datos inválidos." });
    }
    return Object.keys(next).length === 0;
  };

  const submitCreate = async (event: FormEvent) => {
    event.preventDefault();
    if (!validateForm()) return;
    setSaving(true);
    setError(null);
    try {
      const basePayload: ActualizarPsicologoPayload = {
        nombre: form.nombre.trim(),
        email: form.email.trim().toLowerCase(),
        empresa_ids: form.empresa_ids,
        identificacion_profesional: form.identificacion_profesional.trim() || undefined,
        profesion: form.profesion.trim() || undefined,
        postgrado: form.postgrado.trim() || undefined,
        tarjeta_profesional: form.tarjeta_profesional.trim() || undefined,
        licencia_sst: form.licencia_sst.trim() || undefined,
        fecha_expedicion_licencia: form.fecha_expedicion_licencia || undefined,
        puede_validar_informes: form.puede_validar_informes,
        puede_ver_individuales: form.puede_ver_individuales,
        puede_cargar_respuestas: form.puede_cargar_respuestas,
        puede_crear_aplicaciones: form.puede_crear_aplicaciones,
      };
      if (editingTarget) {
        await superadminService.updatePsicologo(editingTarget.id, basePayload);
      } else {
        const payload: CrearPsicologoPayload = { ...basePayload, password: form.password };
        await superadminService.createPsicologo(payload);
      }
      setForm(emptyForm);
      setOpenCreate(false);
      setEditingTarget(null);
      notify({
        type: "success",
        title: editingTarget ? "Psicólogo actualizado" : "Psicólogo creado",
        message: editingTarget ? "Los datos profesionales y asignaciones quedaron actualizados." : "La cuenta quedó activa. Podrá gestionar empresas asignadas o crear las propias.",
      });
      await load();
    } catch (err) {
      notify({ type: "error", title: "No fue posible crear el psicólogo", message: err instanceof Error ? err.message : "Intenta nuevamente." });
    } finally {
      setSaving(false);
    }
  };

  const openPasswordReset = (psicologo: SuperPsicologo) => {
    setPasswordResetTarget(psicologo);
    setResetPassword("");
    setResetConfirmPassword("");
  };

  const submitPasswordReset = async (event: FormEvent) => {
    event.preventDefault();
    if (!passwordResetTarget) return;
    if (resetPassword.length < 12) {
      notify({ type: "warning", title: "Contraseña temporal inválida", message: "Debe tener mínimo 12 caracteres." });
      return;
    }
    if (resetPassword !== resetConfirmPassword) {
      notify({ type: "warning", title: "Contraseñas distintas", message: "La confirmación no coincide." });
      return;
    }
    setSavingPasswordReset(true);
    try {
      await superadminService.resetPsicologoPassword(passwordResetTarget.id, {
        password: resetPassword,
        confirm_password: resetConfirmPassword,
      });
      notify({
        type: "success",
        title: "Contraseña reiniciada",
        message: "Se asignó una contraseña temporal y se solicitará cambio obligatorio al iniciar sesión.",
      });
      setPasswordResetTarget(null);
      setResetPassword("");
      setResetConfirmPassword("");
    } catch (err) {
      notify({ type: "error", title: "No fue posible reiniciar la contraseña", message: err instanceof Error ? err.message : "Intenta nuevamente." });
    } finally {
      setSavingPasswordReset(false);
    }
  };

  const openCreditModal = (psicologo: SuperPsicologo) => {
    setCreditTarget(psicologo);
    setCreditAmount("");
    setCreditReason(defaultCreditReason);
  };

  const submitCredits = async (event: FormEvent) => {
    event.preventDefault();
    if (!creditTarget) return;
    const cantidad = Number(creditAmount);
    if (!Number.isInteger(cantidad) || cantidad <= 0) {
      notify({ type: "warning", title: "Cantidad inválida", message: "Ingresa una cantidad entera mayor a cero." });
      return;
    }
    const descripcion = creditReason.trim() || defaultCreditReason;
    setSavingCredits(true);
    try {
      const idempotency = typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `assign-${creditTarget.id}-${Date.now()}`;
      const result = await superadminService.assignCredits({
        psicologo_usuario_id: creditTarget.id,
        empresa_id: null,
        cantidad,
        descripcion,
        idempotency_key: idempotency,
      });
      const saldoNuevo = Number(result?.saldo_nuevo ?? (Number(creditTarget.creditos_disponibles ?? 0) + cantidad));
      notify({ type: "success", title: "Créditos asignados", message: `${creditTarget.nombre} quedó con ${saldoNuevo.toLocaleString("es-CO")} créditos disponibles.` });
      setCreditTarget(null);
      await load();
    } catch (err) {
      notify({ type: "error", title: "No fue posible asignar créditos", message: err instanceof Error ? err.message : "Intenta nuevamente." });
    } finally {
      setSavingCredits(false);
    }
  };

  return (
    <div>
      {toast && <ToastCard toast={toast} onClose={() => setToast(null)} />}
      <SuperAdminPageHeader
        title="Psicólogos"
        subtitle="Usuarios profesionales, empresas asignadas y saldos globales."
        action={
          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 rounded-2xl bg-violet-600 px-5 py-3 font-black text-white shadow-sm transition hover:bg-violet-700"
          >
            <Plus className="h-5 w-5" /> Nuevo psicólogo
          </button>
        }
      />

      {error && (
        <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">
          {error}
          <button type="button" onClick={load} className="ml-3 font-black underline">Reintentar</button>
        </div>
      )}

      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_220px_220px]">
          <UiInput
            value={q}
            onChange={(event) => setQ(event.target.value)}
            placeholder="Buscar por nombre, correo, documento..."
          />
          <Select value={empresaEstado} onValueChange={setEmpresaEstado}>
            <SelectTrigger><SelectValue placeholder="Empresas" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todas las empresas</SelectItem>
              <SelectItem value="CON_EMPRESAS">Con empresas</SelectItem>
              <SelectItem value="SIN_EMPRESAS">Sin empresas</SelectItem>
            </SelectContent>
          </Select>
          <Select value={creditoEstado} onValueChange={setCreditoEstado}>
            <SelectTrigger><SelectValue placeholder="Créditos" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todos los créditos</SelectItem>
              <SelectItem value="CON_SALDO">Con saldo</SelectItem>
              <SelectItem value="SIN_SALDO">Sin saldo</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="overflow-x-auto rounded-2xl border bg-white">
          <Table className="min-w-[1180px] text-left">
            <TableHeader className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <TableRow className="hover:bg-slate-50">
                <TableHead className="px-4 py-3 font-semibold">Psicólogo</TableHead>
                <TableHead className="px-4 py-3 font-semibold">Credenciales profesionales</TableHead>
                <TableHead className="px-4 py-3 font-semibold">Empresas</TableHead>
                <TableHead className="px-4 py-3 text-center font-semibold">Asignados</TableHead>
                <TableHead className="px-4 py-3 text-center font-semibold">Disponibles</TableHead>
                <TableHead className="px-4 py-3 text-right font-semibold">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y">
              {loading && <TableRow><TableCell colSpan={6} className="px-4 py-12 text-center text-slate-500">Cargando psicólogos...</TableCell></TableRow>}
              {!loading && items.length === 0 && <TableRow><TableCell colSpan={6} className="px-4 py-12 text-center text-slate-500">No hay psicólogos para mostrar.</TableCell></TableRow>}
              {!loading && items.map((psicologo) => (
                <TableRow key={psicologo.id} className="transition hover:bg-slate-50/70">
                  <TableCell className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className="grid h-10 w-10 place-items-center rounded-2xl bg-violet-50 text-violet-700">
                        <UserRound className="h-5 w-5" />
                      </span>
                      <span className="min-w-0">
                        <strong className="block max-w-[260px] truncate font-semibold text-slate-900">{psicologo.nombre}</strong>
                        <span className="block max-w-[260px] truncate text-xs text-slate-500">{psicologo.email || "Sin correo"}</span>
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <strong className="block font-semibold text-slate-900">{psicologo.profesion || "Sin profesión"}</strong>
                    <span className="block text-xs text-slate-500">ID {psicologo.identificacion_profesional || "Sin dato"}</span>
                    <span className="block text-xs text-slate-500">Postgrado: {psicologo.postgrado || "Sin dato"}</span>
                    <span className="block text-xs text-slate-500">TP {psicologo.tarjeta_profesional || "Sin dato"} · Lic. {psicologo.licencia_sst || "Sin dato"}</span>
                    <span className="block text-xs text-slate-500">Expedición: {psicologo.fecha_expedicion_licencia || "Sin dato"}</span>
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700">{psicologo.empresas_asignadas} asignadas</span>
                    <p className="mt-1 max-w-[260px] truncate text-xs text-slate-500">{psicologo.empresas_nombres || "Sin empresas vinculadas"}</p>
                  </TableCell>
                  <TableCell className="px-4 py-3 text-center font-semibold text-slate-900">{psicologo.creditos_asignados ?? 0}</TableCell>
                  <TableCell className="px-4 py-3 text-center font-semibold text-violet-700">{psicologo.creditos_disponibles ?? 0}</TableCell>
                  <TableCell className="px-4 py-3 text-right">
                    <div className="flex flex-wrap justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => openEditModal(psicologo)}
                        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 font-bold text-slate-700 transition hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700"
                      >
                        <Pencil className="h-4 w-4" /> Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => openPasswordReset(psicologo)}
                        className="inline-flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 font-bold text-amber-800 transition hover:bg-amber-100"
                      >
                        <KeyRound className="h-4 w-4" /> Clave
                      </button>
                      <button
                        type="button"
                        onClick={() => openCreditModal(psicologo)}
                        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 font-bold text-slate-700 transition hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700"
                      >
                        <WalletCards className="h-4 w-4" /> Créditos
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <StandardPagination
          page={page}
          pageSize={pageSize}
          total={total}
          itemLabel="psicólogos"
          onPageChange={setPage}
          onPageSizeChange={(size) => { setPageSize(size); setPage(1); }}
        />
      </div>

      {openCreate && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/45 backdrop-blur-sm">
          <aside className="h-full w-full max-w-4xl overflow-y-auto bg-white p-6 shadow-2xl">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-violet-700">SuperAdmin</p>
                <h2 className="text-2xl font-black text-slate-950">{editingTarget ? "Editar psicólogo" : "Crear psicólogo"}</h2>
                <p className="mt-1 max-w-2xl text-sm text-slate-500">
                  {editingTarget
                    ? "Actualiza datos de acceso, credenciales profesionales, empresas y permisos. La contraseña se gestiona por reinicio seguro."
                    : "Crea la cuenta de acceso, registra credenciales profesionales y, si aplica, vincula empresas iniciales."}
                </p>
              </div>
              <button type="button" onClick={closeFormModal} className="rounded-2xl border p-2 hover:bg-slate-50" aria-label="Cerrar">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={submitCreate} className="space-y-6">
              <SectionTitle icon={<UserRound className="h-4 w-4" />} title="Cuenta de acceso" />
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Nombre completo *" error={fieldErrors.nombre}><Input value={form.nombre} onChange={(value) => updateForm("nombre", value)} /></Field>
                <Field label="Correo de acceso *" error={fieldErrors.email}><Input type="email" value={form.email} onChange={(value) => updateForm("email", value)} /></Field>
                {!editingTarget && (
                  <>
                    <Field label="Contraseña *" error={fieldErrors.password}>
                      <PasswordInput value={form.password} onChange={(value) => updateForm("password", value)} visible={showPassword} onToggle={() => setShowPassword((value) => !value)} />
                    </Field>
                    <Field label="Confirmar contraseña *" error={fieldErrors.confirmPassword}>
                      <PasswordInput value={form.confirmPassword} onChange={(value) => updateForm("confirmPassword", value)} visible={showPassword} onToggle={() => setShowPassword((value) => !value)} />
                    </Field>
                  </>
                )}
              </div>

              <SectionTitle icon={<ShieldCheck className="h-4 w-4" />} title="Información profesional" />
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Número de identificación profesional" error={fieldErrors.identificacion_profesional}><Input value={form.identificacion_profesional} onChange={(value) => updateForm("identificacion_profesional", value.replace(/\D/g, ""))} inputMode="numeric" /></Field>
                <Field label="Profesión"><Input value={form.profesion} onChange={(value) => updateForm("profesion", value)} /></Field>
                <Field label="Postgrado"><Input value={form.postgrado} onChange={(value) => updateForm("postgrado", value)} /></Field>
                <Field label="Tarjeta profesional"><Input value={form.tarjeta_profesional} onChange={(value) => updateForm("tarjeta_profesional", value)} /></Field>
                <Field label="Nro. licencia SST"><Input value={form.licencia_sst} onChange={(value) => updateForm("licencia_sst", value)} /></Field>
                <AbrilDatePicker label="Fecha expedición licencia" value={form.fecha_expedicion_licencia} onChange={(value) => updateForm("fecha_expedicion_licencia", value)} />
              </div>

              <SectionTitle icon={<Building2 className="h-4 w-4" />} title="Empresas y permisos psicosociales" />
              <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
                <Field label="Empresas asignadas iniciales" error={fieldErrors.empresa_ids}>
                  <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white">
                    <div className="border-b border-slate-100 bg-slate-50/70 p-3">
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <p className="text-xs font-black uppercase tracking-wide text-slate-500">Listado de empresas</p>
                        <span className="rounded-full bg-white px-2.5 py-1 text-xs font-black text-violet-700">{form.empresa_ids.length} seleccionadas</span>
                      </div>
                      <input value={empresaQ} onChange={(event) => setEmpresaQ(event.target.value)} className="h-10 w-full rounded-2xl border border-slate-200 px-3 text-sm outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-100" placeholder="Buscar empresa..." />
                    </div>
                    <div className="max-h-72 divide-y divide-slate-100 overflow-auto">
                      {filteredEmpresas.length === 0 && <div className="rounded-2xl border border-dashed border-slate-200 p-5 text-center text-sm text-slate-500">No hay empresas para seleccionar. Puedes crear el psicólogo sin asignaciones iniciales.</div>}
                      {filteredEmpresas.map((empresa) => {
                        const checked = form.empresa_ids.includes(empresa.id);
                        return (
                          <button key={empresa.id} type="button" onClick={() => toggleEmpresa(empresa.id)} className={`flex w-full items-center justify-between px-3 py-3 text-left text-sm transition ${checked ? "bg-violet-50 text-violet-800" : "hover:bg-slate-50"}`}>
                            <span className="min-w-0">
                              <strong className="block truncate">{empresa.nombre}</strong>
                              <span className="text-xs text-slate-500">{empresa.nit || empresa.id}</span>
                            </span>
                            <span className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border ${checked ? "border-violet-600 bg-violet-600 text-white" : "border-slate-300"}`}>{checked && <Check className="h-3.5 w-3.5" />}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </Field>
                <div className="space-y-3 rounded-3xl border border-slate-200 bg-slate-50 p-4">
                  <Toggle label="Puede ver informes individuales" checked={form.puede_ver_individuales} onChange={(value) => updateForm("puede_ver_individuales", value)} />
                  <Toggle label="Puede cargar respuestas" checked={form.puede_cargar_respuestas} onChange={(value) => updateForm("puede_cargar_respuestas", value)} />
                  <Toggle label="Puede crear aplicaciones" checked={form.puede_crear_aplicaciones} onChange={(value) => updateForm("puede_crear_aplicaciones", value)} />
                  <Toggle label="Puede validar informes" checked={form.puede_validar_informes} onChange={(value) => updateForm("puede_validar_informes", value)} />
                  <p className="pt-2 text-xs leading-5 text-slate-500">El usuario se crea con rol PSICOLOGO_EVALUADOR y podrá ingresar con el correo y contraseña definidos. Las empresas iniciales son opcionales.</p>
                </div>
              </div>

              <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">
                <button type="button" onClick={closeFormModal} className="rounded-2xl border px-5 py-3 font-bold">Cancelar</button>
                <button disabled={saving} className="inline-flex items-center gap-2 rounded-2xl bg-violet-700 px-6 py-3 font-bold text-white disabled:opacity-60">
                  {saving && <Loader2 className="h-4 w-4 animate-spin" />} {editingTarget ? "Guardar cambios" : "Crear psicólogo"}
                </button>
              </div>
            </form>
          </aside>
        </div>
      )}

      {passwordResetTarget && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/45 backdrop-blur-sm">
          <aside className="h-full w-full max-w-xl overflow-y-auto bg-white p-6 shadow-2xl">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-violet-700">Seguridad de acceso</p>
                <h2 className="text-2xl font-black text-slate-950">Reiniciar contraseña</h2>
                <p className="mt-1 text-sm text-slate-500">Define una contraseña temporal. El psicólogo deberá cambiarla obligatoriamente al iniciar sesión.</p>
              </div>
              <button type="button" onClick={() => setPasswordResetTarget(null)} className="rounded-2xl border p-2 hover:bg-slate-50" aria-label="Cerrar">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mb-6 rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center gap-3">
                <span className="grid h-11 w-11 place-items-center rounded-2xl bg-amber-100 text-amber-700">
                  <KeyRound className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <strong className="block truncate text-slate-950">{passwordResetTarget.nombre}</strong>
                  <span className="block truncate text-sm text-slate-500">{passwordResetTarget.email || "Sin correo"}</span>
                </div>
              </div>
            </div>

            <form onSubmit={submitPasswordReset} className="space-y-4">
              <Field label="Contraseña temporal *">
                <PasswordInput value={resetPassword} onChange={setResetPassword} visible={showPassword} onToggle={() => setShowPassword((value) => !value)} />
              </Field>
              <Field label="Confirmar contraseña temporal *">
                <PasswordInput value={resetConfirmPassword} onChange={setResetConfirmPassword} visible={showPassword} onToggle={() => setShowPassword((value) => !value)} />
              </Field>
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-800">
                Usa una clave temporal robusta y comunícala por un canal seguro. ABRIL-360 no la enviará ni la mostrará después de guardar.
              </div>
              <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">
                <button type="button" onClick={() => setPasswordResetTarget(null)} className="rounded-2xl border px-5 py-3 font-bold">Cancelar</button>
                <button disabled={savingPasswordReset} className="inline-flex items-center gap-2 rounded-2xl bg-amber-600 px-6 py-3 font-bold text-white disabled:opacity-60">
                  {savingPasswordReset && <Loader2 className="h-4 w-4 animate-spin" />} Reiniciar contraseña
                </button>
              </div>
            </form>
          </aside>
        </div>
      )}

      {creditTarget && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/45 backdrop-blur-sm">
          <aside className="h-full w-full max-w-xl overflow-y-auto bg-white p-6 shadow-2xl">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-violet-700">Créditos globales</p>
                <h2 className="text-2xl font-black text-slate-950">Cargar créditos</h2>
                <p className="mt-1 text-sm text-slate-500">La asignación aplica al saldo global del psicólogo.</p>
              </div>
              <button type="button" onClick={() => setCreditTarget(null)} className="rounded-2xl border p-2 hover:bg-slate-50" aria-label="Cerrar">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mb-6 rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center gap-3">
                <span className="grid h-11 w-11 place-items-center rounded-2xl bg-violet-100 text-violet-700">
                  <UserRound className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <strong className="block truncate text-slate-950">{creditTarget.nombre}</strong>
                  <span className="block truncate text-sm text-slate-500">{creditTarget.email || "Sin correo"}</span>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-white p-3">
                  <p className="text-xs font-bold uppercase text-slate-400">Asignados</p>
                  <p className="text-2xl font-black text-slate-950">{Number(creditTarget.creditos_asignados ?? 0).toLocaleString("es-CO")}</p>
                </div>
                <div className="rounded-2xl bg-white p-3">
                  <p className="text-xs font-bold uppercase text-slate-400">Disponibles</p>
                  <p className="text-2xl font-black text-violet-700">{Number(creditTarget.creditos_disponibles ?? 0).toLocaleString("es-CO")}</p>
                </div>
              </div>
            </div>

            <form onSubmit={submitCredits} className="space-y-4">
              <Field label="Cantidad de créditos *">
                <Input
                  type="number"
                  min="1"
                  step="1"
                  value={creditAmount}
                  onChange={setCreditAmount}
                  placeholder="Ej. 100"
                />
              </Field>
              <Field label="Motivo de asignación">
                <textarea
                  value={creditReason}
                  onChange={(event) => setCreditReason(event.target.value)}
                  className="min-h-32 w-full rounded-2xl border border-slate-200 px-4 py-3 font-normal outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-100"
                  placeholder="Ej. Compra inicial de paquete de créditos para operación psicosocial."
                />
              </Field>
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                Esta acción queda registrada en el ledger y no se asocia a una empresa específica.
              </div>
              <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">
                <button type="button" onClick={() => setCreditTarget(null)} className="rounded-2xl border px-5 py-3 font-bold">Cancelar</button>
                <button disabled={savingCredits} className="inline-flex items-center gap-2 rounded-2xl bg-violet-700 px-6 py-3 font-bold text-white disabled:opacity-60">
                  {savingCredits && <Loader2 className="h-4 w-4 animate-spin" />} Asignar créditos
                </button>
              </div>
            </form>
          </aside>
        </div>
      )}
    </div>
  );
}

function SectionTitle({ icon, title }: { icon: ReactNode; title: string }) {
  return <div className="flex items-center gap-2 text-sm font-black uppercase tracking-wide text-violet-700">{icon}{title}</div>;
}

function Field({ label, error, children }: { label: string; error?: string; children: ReactNode }) {
  return <label className="space-y-1 text-sm font-bold text-slate-700">{label}{children}{error && <span className="block text-xs font-semibold text-red-600">{error}</span>}</label>;
}

function Input({ value, onChange, className = "", ...props }: any) {
  return <input {...props} value={value} onChange={(event) => onChange(event.target.value)} className={`w-full rounded-2xl border border-slate-200 px-4 py-3 font-normal outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-100 ${className}`} />;
}

function PasswordInput({ value, onChange, visible, onToggle }: { value: string; onChange: (value: string) => void; visible: boolean; onToggle: () => void }) {
  return (
    <div className="flex rounded-2xl border border-slate-200 focus-within:border-violet-500 focus-within:ring-4 focus-within:ring-violet-100">
      <input value={value} onChange={(event) => onChange(event.target.value)} type={visible ? "text" : "password"} className="min-w-0 flex-1 rounded-l-2xl px-4 py-3 font-normal outline-none" />
      <button type="button" onClick={onToggle} className="grid w-12 place-items-center rounded-r-2xl text-slate-500 hover:bg-slate-50" aria-label={visible ? "Ocultar contraseña" : "Mostrar contraseña"}>
        {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) {
  return (
    <button type="button" onClick={() => onChange(!checked)} className="flex w-full items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-3 text-left text-sm font-bold">
      <span>{label}</span>
      <span className={`relative h-6 w-11 rounded-full transition ${checked ? "bg-violet-700" : "bg-slate-300"}`}>
        <span className={`absolute top-1 h-4 w-4 rounded-full bg-white transition ${checked ? "left-6" : "left-1"}`} />
      </span>
    </button>
  );
}
