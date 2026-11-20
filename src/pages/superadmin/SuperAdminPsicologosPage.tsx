// src/pages/superadmin/SuperAdminPsicologosPage.tsx
//
// ## Qué se homologó aquí y por qué era el peor archivo del producto
//
// Esta pantalla aparecía a la vez en las TRES listas de deuda del guardia
// (`TABLAS_SIN_MIGRAR`, `COLOR_CRUDO_PENDIENTE`, `GRIS_CRUDO_PENDIENTE`) y
// concentraba diecisiete botones escritos a mano, más que ninguna otra fuera
// de Psicosocial. No era casualidad: tenía su propio sistema de formulario
// completo —`Input`, `PasswordInput`, `Toggle`, `Field` locales— y por tanto
// no participaba de ninguna decisión de la casa.
//
// Lo que se retiró:
//
//   - **Su `Input` local.** El archivo importaba el `Input` de la casa Y
//     definía el suyo, con otro radio y otro anillo de foco. Los dos
//     coexistían en el mismo formulario.
//   - **Su `PasswordInput`.** Era una de las cuatro copias del campo de clave;
//     ahora es `EntradaClave`, que además se anuncia como interruptor.
//   - **Su `Toggle`.** Un conmutador dibujado a mano con `h-6 w-11` mientras
//     otras dos pantallas de superadministración ya usaban el `Switch` de la
//     casa. El de aquí no era un conmutador para el lector de pantalla: era un
//     `button` sin `role="switch"` ni estado anunciado.
//   - **Su `Field`.** Uno de los ocho; el error salía como párrafo rojo sin
//     relación con el campo.
//   - **La tabla a mano y sus tres cajones laterales**, que ninguno cerraba
//     con `Escape` ni se anunciaba como diálogo.
//
// Y una decisión de color que conviene dejar escrita: el botón «Clave» de cada
// fila era ámbar, y el de confirmar el reinicio, un ámbar 600 crudo de Tailwind.
// Un tinte de advertencia en un botón que solo ABRE un panel es gritar antes de
// que pase nada; la advertencia pertenece al panel —donde sí está, como
// `Aviso`— y no al botón que lo abre.

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Building2, Check, KeyRound, Loader2, Pencil, Plus, ShieldCheck, UserRound, WalletCards } from "lucide-react";

import { ToastCard, type ToastPayload } from "@/components/feedback/ToastCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Aviso } from "@/shared/ui/Aviso";
import { Campo } from "@/shared/ui/Campo";
import { DatePicker } from "@/shared/ui/DatePicker";
import { EntradaClave } from "@/shared/ui/EntradaClave";
import { PanelLateral } from "@/shared/ui/PanelLateral";
import { Pill } from "@/shared/ui/Pill";
import { CeldaPrincipal, TablaDatos, type ColumnaTabla } from "@/shared/ui/TablaDatos";
import {
  superadminService,
  type ActualizarPsicologoPayload,
  type CrearPsicologoPayload,
  type SuperEmpresa,
  type SuperPsicologo,
} from "@/features/superadmin/api/superadminService";
import SuperAdminPageHeader from "./SuperAdminPageHeader";
import { Caja } from "@/shared/ui/Caja";

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

/* Los `id` van aquí y no en línea porque `Campo` enlaza etiqueta, ayuda y
   error con ellos: un `id` inventado en el sitio de uso es un enlace que se
   rompe en la siguiente edición sin que nada avise. */
const ID = {
  nombre: "psicologo-nombre",
  email: "psicologo-email",
  password: "psicologo-password",
  confirmar: "psicologo-confirmar",
  identificacion: "psicologo-identificacion",
  profesion: "psicologo-profesion",
  postgrado: "psicologo-postgrado",
  tarjeta: "psicologo-tarjeta",
  licencia: "psicologo-licencia",
  expedicion: "psicologo-expedicion",
  buscarEmpresa: "psicologo-buscar-empresa",
  claveNueva: "psicologo-clave-nueva",
  claveConfirmar: "psicologo-clave-confirmar",
  creditos: "psicologo-creditos",
  motivo: "psicologo-motivo",
  buscar: "psicologos-buscar",
} as const;

const PERMISOS: readonly { clave: keyof FormState; etiqueta: string }[] = [
  { clave: "puede_ver_individuales", etiqueta: "Puede ver informes individuales" },
  { clave: "puede_cargar_respuestas", etiqueta: "Puede cargar respuestas" },
  { clave: "puede_crear_aplicaciones", etiqueta: "Puede crear aplicaciones" },
  { clave: "puede_validar_informes", etiqueta: "Puede validar informes" },
];

function validateEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

/** Dato de credencial: siempre presente, aunque esté vacío, para que la fila no cambie de alto. */
function Dato({ etiqueta, valor }: { etiqueta: string; valor?: string | null }) {
  return (
    <span className="block text-xs text-muted-foreground">
      {etiqueta}: {valor || "sin dato"}
    </span>
  );
}

function columnasPsicologo(
  abrirEdicion: (psicologo: SuperPsicologo) => void,
  abrirClave: (psicologo: SuperPsicologo) => void,
  abrirCreditos: (psicologo: SuperPsicologo) => void,
): ColumnaTabla<SuperPsicologo>[] {
  return [
    {
      clave: "psicologo",
      titulo: "Psicólogo",
      movil: "titular",
      celda: (p) => (
        <CeldaPrincipal alAbrir={() => abrirEdicion(p)} titulo={p.nombre} apoyo={p.email || "Sin correo"} />
      ),
    },
    {
      clave: "credenciales",
      titulo: "Credenciales profesionales",
      celda: (p) => (
        <>
          <strong className="block font-semibold text-foreground">{p.profesion || "Sin profesión"}</strong>
          <Dato etiqueta="ID" valor={p.identificacion_profesional} />
          <Dato etiqueta="Postgrado" valor={p.postgrado} />
          <Dato etiqueta="TP" valor={p.tarjeta_profesional} />
          <Dato etiqueta="Licencia SST" valor={p.licencia_sst} />
          <Dato etiqueta="Expedición" valor={p.fecha_expedicion_licencia} />
        </>
      ),
    },
    {
      clave: "empresas",
      titulo: "Empresas",
      celda: (p) => (
        <>
          <Pill tono={p.empresas_asignadas ? "marca" : "neutro"}>{p.empresas_asignadas} asignadas</Pill>
          <p className="mt-1 max-w-[260px] truncate text-xs text-muted-foreground">
            {p.empresas_nombres || "Sin empresas vinculadas"}
          </p>
        </>
      ),
    },
    {
      clave: "asignados",
      titulo: "Asignados",
      alineacion: "derecha",
      celda: (p) => (
        <span className="font-semibold tabular-nums text-foreground">
          {Number(p.creditos_asignados ?? 0).toLocaleString("es-CO")}
        </span>
      ),
    },
    {
      clave: "disponibles",
      titulo: "Disponibles",
      alineacion: "derecha",
      celda: (p) => (
        <span className="font-semibold tabular-nums text-primary">
          {Number(p.creditos_disponibles ?? 0).toLocaleString("es-CO")}
        </span>
      ),
    },
    {
      clave: "acciones",
      titulo: "Acciones",
      soloAcciones: true,
      alineacion: "derecha",
      celda: (p) => (
        <div className="flex flex-wrap justify-end gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => abrirEdicion(p)}>
            <Pencil aria-hidden="true" /> Editar
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={() => abrirClave(p)}>
            <KeyRound aria-hidden="true" /> Clave
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={() => abrirCreditos(p)}>
            <WalletCards aria-hidden="true" /> Créditos
          </Button>
        </div>
      ),
    },
  ];
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
          <Button type="button" onClick={openCreateModal}>
            <Plus aria-hidden="true" /> Nuevo psicólogo
          </Button>
        }
      />

      {error && (
        <Aviso
          className="mb-5"
          titulo="No fue posible cargar psicólogos"
          acciones={
            <Button type="button" variant="outline" size="sm" onClick={load}>
              Reintentar
            </Button>
          }
        >
          {error}
        </Aviso>
      )}

      <TablaDatos
        filas={error ? [] : items}
        columnas={columnasPsicologo(openEditModal, openPasswordReset, openCreditModal)}
        claveFila={(p) => String(p.id)}
        etiquetaTabla="Psicólogos de la plataforma"
        etiquetaElemento="psicólogos"
        cargando={loading}
        vacio="No hay psicólogos para este filtro."
        cabecera={
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_220px_220px]">
            <div className="min-w-0">
              <Label htmlFor={ID.buscar}>Buscar</Label>
              <Input
                id={ID.buscar}
                type="search"
                value={q}
                onChange={(event) => setQ(event.target.value)}
                placeholder="Nombre, correo o documento..."
              />
            </div>
            <div>
              <Label htmlFor={`${ID.buscar}-empresas`}>Empresas</Label>
              <Select value={empresaEstado} onValueChange={setEmpresaEstado}>
                <SelectTrigger id={`${ID.buscar}-empresas`}><SelectValue placeholder="Empresas" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Todas las empresas</SelectItem>
                  <SelectItem value="CON_EMPRESAS">Con empresas</SelectItem>
                  <SelectItem value="SIN_EMPRESAS">Sin empresas</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor={`${ID.buscar}-creditos`}>Créditos</Label>
              <Select value={creditoEstado} onValueChange={setCreditoEstado}>
                <SelectTrigger id={`${ID.buscar}-creditos`}><SelectValue placeholder="Créditos" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Todos los créditos</SelectItem>
                  <SelectItem value="CON_SALDO">Con saldo</SelectItem>
                  <SelectItem value="SIN_SALDO">Sin saldo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        }
        control={{
          modo: "paginas",
          pagina: page,
          tamano: pageSize,
          total,
          onPagina: setPage,
          onTamano: (size) => { setPageSize(size); setPage(1); },
        }}
      />

      <PanelLateral
        abierto={openCreate}
        alCerrar={closeFormModal}
        ancho="xl"
        antetitulo="SuperAdmin"
        titulo={editingTarget ? "Editar psicólogo" : "Crear psicólogo"}
        descripcion={
          editingTarget
            ? "Actualiza datos de acceso, credenciales profesionales, empresas y permisos. La contraseña se gestiona por reinicio seguro."
            : "Crea la cuenta de acceso, registra credenciales profesionales y, si aplica, vincula empresas iniciales."
        }
        alEnviar={submitCreate}
        acciones={
          <>
            <Button type="button" variant="outline" onClick={closeFormModal}>Cancelar</Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="animate-spin" aria-hidden="true" />}
              {editingTarget ? "Guardar cambios" : "Crear psicólogo"}
            </Button>
          </>
        }
      >
        <div className="space-y-6">
          <TituloSeccion icono={UserRound} titulo="Cuenta de acceso" />
          <div className="grid gap-4 md:grid-cols-2">
            <Campo id={ID.nombre} etiqueta="Nombre completo" obligatorio error={fieldErrors.nombre}>
              <Input required value={form.nombre} onChange={(event) => updateForm("nombre", event.target.value)} />
            </Campo>
            <Campo id={ID.email} etiqueta="Correo de acceso" obligatorio error={fieldErrors.email}>
              <Input required type="email" autoComplete="off" value={form.email} onChange={(event) => updateForm("email", event.target.value)} />
            </Campo>
            {!editingTarget && (
              <>
                <Campo
                  id={ID.password}
                  etiqueta="Contraseña temporal"
                  obligatorio
                  ayuda="Mínimo 12 caracteres. Se pedirá cambiarla al primer inicio de sesión."
                  error={fieldErrors.password}
                >
                  <EntradaClave
                    required
                    autoComplete="new-password"
                    value={form.password}
                    onChange={(event) => updateForm("password", event.target.value)}
                    visible={showPassword}
                    alAlternar={() => setShowPassword((value) => !value)}
                  />
                </Campo>
                <Campo id={ID.confirmar} etiqueta="Confirmar contraseña" obligatorio error={fieldErrors.confirmPassword}>
                  <EntradaClave
                    required
                    autoComplete="new-password"
                    value={form.confirmPassword}
                    onChange={(event) => updateForm("confirmPassword", event.target.value)}
                    visible={showPassword}
                    alAlternar={() => setShowPassword((value) => !value)}
                  />
                </Campo>
              </>
            )}
          </div>

          <TituloSeccion icono={ShieldCheck} titulo="Información profesional" />
          <div className="grid gap-4 md:grid-cols-2">
            <Campo id={ID.identificacion} etiqueta="Número de identificación profesional" error={fieldErrors.identificacion_profesional}>
              <Input
                inputMode="numeric"
                value={form.identificacion_profesional}
                onChange={(event) => updateForm("identificacion_profesional", event.target.value.replace(/\D/g, ""))}
              />
            </Campo>
            <Campo id={ID.profesion} etiqueta="Profesión">
              <Input value={form.profesion} onChange={(event) => updateForm("profesion", event.target.value)} />
            </Campo>
            <Campo id={ID.postgrado} etiqueta="Postgrado">
              <Input value={form.postgrado} onChange={(event) => updateForm("postgrado", event.target.value)} />
            </Campo>
            <Campo id={ID.tarjeta} etiqueta="Tarjeta profesional">
              <Input value={form.tarjeta_profesional} onChange={(event) => updateForm("tarjeta_profesional", event.target.value)} />
            </Campo>
            <Campo id={ID.licencia} etiqueta="Nro. licencia SST">
              <Input value={form.licencia_sst} onChange={(event) => updateForm("licencia_sst", event.target.value)} />
            </Campo>
            <DatePicker
              id={ID.expedicion}
              label="Fecha expedición licencia"
              value={form.fecha_expedicion_licencia}
              onChange={(value) => updateForm("fecha_expedicion_licencia", value)}
            />
          </div>

          <TituloSeccion icono={Building2} titulo="Empresas y permisos psicosociales" />
          <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
            {/* La lista de empresas NO va dentro de `Campo`: `Campo` enlaza una
                etiqueta con UN control, y aquí hay una caja con buscador y
                decenas de opciones. Su nombre lo da el `fieldset`. */}
            <fieldset className="min-w-0 space-y-1.5">
              <legend className="mb-1.5 font-heading text-sm font-semibold text-foreground">
                Empresas asignadas iniciales
              </legend>
              <Caja aire="ninguno" className="overflow-hidden">
                <div className="border-b border-border bg-surface-subtle p-3">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <Label htmlFor={ID.buscarEmpresa} className="text-xs uppercase tracking-wide text-muted-foreground">
                      Listado de empresas
                    </Label>
                    <Pill tono="marca">{form.empresa_ids.length} seleccionadas</Pill>
                  </div>
                  <Input
                    id={ID.buscarEmpresa}
                    type="search"
                    value={empresaQ}
                    onChange={(event) => setEmpresaQ(event.target.value)}
                    placeholder="Buscar empresa..."
                  />
                </div>
                <div className="max-h-72 divide-y divide-border overflow-auto">
                  {filteredEmpresas.length === 0 && (
                    <p className="p-5 text-center text-sm text-muted-foreground">
                      No hay empresas para seleccionar. Puedes crear el psicólogo sin asignaciones iniciales.
                    </p>
                  )}
                  {filteredEmpresas.map((empresa) => {
                    const checked = form.empresa_ids.includes(empresa.id);
                    return (
                      <button
                        key={empresa.id}
                        type="button"
                        /* `aria-pressed` y no solo una clase de color: la
                           selección era un fondo y nada más, así que con lector
                           de pantalla no había forma de saber qué empresas
                           estaban marcadas. */
                        aria-pressed={checked}
                        onClick={() => toggleEmpresa(empresa.id)}
                        className={`flex w-full items-center justify-between gap-3 px-3 py-3 text-left text-sm transition-colors duration-rel-micro ease-rel-out focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring motion-reduce:transition-none ${checked ? "bg-accent text-accent-foreground" : "hover:bg-surface-subtle"}`}
                      >
                        <span className="min-w-0">
                          <strong className="block truncate">{empresa.nombre}</strong>
                          <span className="text-xs text-muted-foreground">{empresa.nit || empresa.id}</span>
                        </span>
                        <span
                          aria-hidden="true"
                          className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border ${checked ? "border-primary bg-primary text-primary-foreground" : "border-border-strong"}`}
                        >
                          {checked && <Check className="h-3.5 w-3.5" aria-hidden="true" />}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </Caja>
              {fieldErrors.empresa_ids ? (
                <p className="text-xs font-semibold text-danger">{fieldErrors.empresa_ids}</p>
              ) : null}
            </fieldset>
            <Caja tono="hundida" className="space-y-3">
              {PERMISOS.map(({ clave, etiqueta }) => (
                <div key={clave} className="flex items-center justify-between gap-3">
                  <Label htmlFor={`permiso-${clave}`} className="text-sm font-semibold text-foreground">
                    {etiqueta}
                  </Label>
                  <Switch
                    id={`permiso-${clave}`}
                    checked={Boolean(form[clave])}
                    onCheckedChange={(valor) => updateForm(clave, valor as never)}
                  />
                </div>
              ))}
              <p className="pt-2 text-xs leading-5 text-muted-foreground">
                El usuario se crea con rol PSICOLOGO_EVALUADOR y podrá ingresar con el correo y contraseña definidos. Las empresas iniciales son opcionales.
              </p>
            </Caja>
          </div>
        </div>
      </PanelLateral>

      <PanelLateral
        abierto={Boolean(passwordResetTarget)}
        alCerrar={() => setPasswordResetTarget(null)}
        antetitulo="Seguridad de acceso"
        titulo="Reiniciar contraseña"
        descripcion="Define una contraseña temporal. El psicólogo deberá cambiarla obligatoriamente al iniciar sesión."
        alEnviar={submitPasswordReset}
        acciones={
          <>
            <Button type="button" variant="outline" onClick={() => setPasswordResetTarget(null)}>Cancelar</Button>
            <Button type="submit" disabled={savingPasswordReset}>
              {savingPasswordReset && <Loader2 className="animate-spin" aria-hidden="true" />}
              Reiniciar contraseña
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {passwordResetTarget && (
            <FichaPsicologo
              icono={KeyRound}
              nombre={passwordResetTarget.nombre}
              email={passwordResetTarget.email}
            />
          )}
          <Campo id={ID.claveNueva} etiqueta="Contraseña temporal" obligatorio ayuda="Mínimo 12 caracteres.">
            <EntradaClave
              required
              autoComplete="new-password"
              value={resetPassword}
              onChange={(event) => setResetPassword(event.target.value)}
              visible={showPassword}
              alAlternar={() => setShowPassword((value) => !value)}
            />
          </Campo>
          <Campo id={ID.claveConfirmar} etiqueta="Confirmar contraseña temporal" obligatorio>
            <EntradaClave
              required
              autoComplete="new-password"
              value={resetConfirmPassword}
              onChange={(event) => setResetConfirmPassword(event.target.value)}
              visible={showPassword}
              alAlternar={() => setShowPassword((value) => !value)}
            />
          </Campo>
          <Aviso tono="atencion">
            Usa una clave temporal robusta y comunícala por un canal seguro. ABRIL360 no la enviará ni la mostrará después de guardar.
          </Aviso>
        </div>
      </PanelLateral>

      <PanelLateral
        abierto={Boolean(creditTarget)}
        alCerrar={() => setCreditTarget(null)}
        antetitulo="Créditos globales"
        titulo="Cargar créditos"
        descripcion="La asignación aplica al saldo global del psicólogo."
        alEnviar={submitCredits}
        acciones={
          <>
            <Button type="button" variant="outline" onClick={() => setCreditTarget(null)}>Cancelar</Button>
            <Button type="submit" disabled={savingCredits}>
              {savingCredits && <Loader2 className="animate-spin" aria-hidden="true" />}
              Asignar créditos
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {creditTarget && (
            <>
              <FichaPsicologo icono={UserRound} nombre={creditTarget.nombre} email={creditTarget.email} />
              <div className="grid grid-cols-2 gap-3">
                <Saldo etiqueta="Asignados" valor={creditTarget.creditos_asignados} />
                <Saldo etiqueta="Disponibles" valor={creditTarget.creditos_disponibles} destacado />
              </div>
            </>
          )}
          <Campo id={ID.creditos} etiqueta="Cantidad de créditos" obligatorio>
            <Input
              required
              type="number"
              min="1"
              step="1"
              value={creditAmount}
              onChange={(event) => setCreditAmount(event.target.value)}
              placeholder="Ej. 100"
            />
          </Campo>
          <Campo id={ID.motivo} etiqueta="Motivo de asignación">
            <Textarea
              rows={4}
              value={creditReason}
              onChange={(event) => setCreditReason(event.target.value)}
              placeholder="Ej. Compra inicial de paquete de créditos para operación psicosocial."
            />
          </Campo>
          <Aviso tono="info">
            Esta acción queda registrada en el ledger y no se asocia a una empresa específica.
          </Aviso>
        </div>
      </PanelLateral>
    </div>
  );
}

function TituloSeccion({ icono: Icono, titulo }: { icono: typeof UserRound; titulo: string }) {
  return (
    <h3 className="flex items-center gap-2 font-heading text-sm font-bold uppercase tracking-wide text-primary">
      <Icono className="h-4 w-4" aria-hidden="true" /> {titulo}
    </h3>
  );
}

/** A quién afecta lo que está a punto de hacerse. Los dos paneles lo necesitan. */
function FichaPsicologo({
  icono: Icono,
  nombre,
  email,
}: {
  icono: typeof UserRound;
  nombre: string;
  email?: string | null;
}) {
  return (
    <Caja tono="hundida" className="flex items-center gap-3">
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-rel-card bg-accent text-accent-foreground">
        <Icono className="h-5 w-5" aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <strong className="block truncate text-foreground">{nombre}</strong>
        <span className="block truncate text-sm text-muted-foreground">{email || "Sin correo"}</span>
      </div>
    </Caja>
  );
}

function Saldo({ etiqueta, valor, destacado }: { etiqueta: string; valor?: number | null; destacado?: boolean }) {
  return (
    <Caja>
      <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{etiqueta}</p>
      <p className={`text-2xl font-bold tabular-nums ${destacado ? "text-primary" : "text-foreground"}`}>
        {Number(valor ?? 0).toLocaleString("es-CO")}
      </p>
    </Caja>
  );
}
