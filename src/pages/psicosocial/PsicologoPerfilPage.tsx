import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import {
  AlertCircle,
  Check,
  BriefcaseBusiness,
  CalendarDays,
  GraduationCap,
  Eye,
  EyeOff,
  FileBadge,
  KeyRound,
  Loader2,
  LockKeyhole,
  Mail,
  ShieldCheck,
  UserRound,
  X,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { toast } from "@/hooks/use-toast";
import {
  getEmpresasAsignadasResponse,
  type EmpresaAsignada,
} from "@/features/psicosocial/api/psicoAccessService";

type PasswordForm = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

const initialPasswordForm: PasswordForm = {
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
};

export default function PsicologoPerfilPage() {
  const { user, roles, permissions, tenantId, passwordChangeRequired, changePassword } = useAuth();
  const [empresas, setEmpresas] = useState<EmpresaAsignada[]>([]);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [form, setForm] = useState<PasswordForm>(initialPasswordForm);
  const [show, setShow] = useState({ current: false, next: false, confirm: false });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const nombre = user?.nombre || "Perfil profesional";
  const email = user?.email || "Correo no registrado";
  const initials = getInitials(nombre);
  const roleLabel = formatRole(roles[0] || "PSICOLOGO_EVALUADOR");
  const passwordChecks = useMemo(() => getPasswordChecks(form.newPassword, nombre, email), [form.newPassword, nombre, email]);
  const validPassword = passwordChecks.every((item) => item.valid);
  const canSubmit = Boolean(form.currentPassword && validPassword && form.newPassword === form.confirmPassword && !saving);
  const professionalProfile = useMemo(() => selectProfessionalProfile(empresas), [empresas]);

  useEffect(() => {
    let active = true;
    setProfileLoading(true);
    setProfileError(null);
    getEmpresasAsignadasResponse()
      .then((response) => {
        if (!active) return;
        setEmpresas(response.empresas || []);
      })
      .catch((error) => {
        if (!active) return;
        setProfileError(error instanceof Error ? error.message : "No fue posible cargar la información profesional.");
      })
      .finally(() => {
        if (active) setProfileLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (passwordChangeRequired) {
      setPasswordOpen(true);
    }
  }, [passwordChangeRequired]);

  const updateForm = (field: keyof PasswordForm, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    setFormError(null);
  };

  const closePasswordModal = (force = false) => {
    if (passwordChangeRequired && !force) return;
    if (saving && !force) return;
    setPasswordOpen(false);
    setForm(initialPasswordForm);
    setFormError(null);
    setShow({ current: false, next: false, confirm: false });
  };

  const submitPassword = async (event: FormEvent) => {
    event.preventDefault();
    if (!canSubmit) return;
    setSaving(true);
    setFormError(null);
    try {
      await changePassword(form);
      toast({
        title: "Contraseña actualizada",
        description: "Tu cuenta quedó protegida con la nueva contraseña.",
      });
      closePasswordModal(true);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "No fue posible actualizar la contraseña.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 p-6 lg:p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-5">
            <div className="flex min-w-0 items-center gap-4">
              <div className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-violet-100 text-xl font-black text-violet-700">
                {initials}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-black uppercase text-violet-700">Perfil del psicólogo</p>
                <h1 className="truncate text-2xl font-black text-slate-950">{nombre}</h1>
                <p className="mt-1 text-sm text-slate-500">Información registrada para la operación psicosocial.</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setPasswordOpen(true)}
              disabled={passwordChangeRequired}
              className="inline-flex items-center gap-2 rounded-2xl bg-violet-700 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-violet-100 hover:bg-violet-800"
            >
              <KeyRound className="h-4 w-4" />
              Cambiar contraseña
            </button>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <InfoCard icon={<UserRound className="h-5 w-5" />} label="Nombre registrado" value={nombre} />
          <InfoCard icon={<Mail className="h-5 w-5" />} label="Correo" value={email} />
          <InfoCard icon={<ShieldCheck className="h-5 w-5" />} label="Rol principal" value={roleLabel} />
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="inline-flex items-center gap-2 text-xs font-black uppercase text-violet-700">
                <FileBadge className="h-4 w-4" />
                Información profesional
              </p>
              <h2 className="mt-2 text-lg font-black text-slate-950">Datos registrados para informes y validaciones</h2>
              <p className="mt-1 text-sm text-slate-500">
                Esta información se toma de la creación/asignación del psicólogo en SuperAdmin.
              </p>
            </div>
            {professionalProfile?.empresaNombre ? (
              <span className="rounded-full bg-violet-50 px-3 py-1 text-xs font-bold text-violet-700">
                Fuente: {professionalProfile.empresaNombre}
              </span>
            ) : null}
          </div>

          {profileLoading ? (
            <div className="mt-5 flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              Cargando información profesional...
            </div>
          ) : profileError ? (
            <div className="mt-5 flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{profileError}</span>
            </div>
          ) : (
            <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              <Detail icon={<FileBadge className="h-4 w-4" />} label="Número de identificación profesional" value={professionalProfile?.identificacionProfesional || "No registrado"} />
              <Detail icon={<BriefcaseBusiness className="h-4 w-4" />} label="Profesión" value={professionalProfile?.profesion || "No registrado"} />
              <Detail icon={<GraduationCap className="h-4 w-4" />} label="Postgrado" value={professionalProfile?.postgrado || "No registrado"} />
              <Detail icon={<FileBadge className="h-4 w-4" />} label="Tarjeta profesional" value={professionalProfile?.tarjetaProfesional || "No registrado"} />
              <Detail icon={<ShieldCheck className="h-4 w-4" />} label="Nro. licencia SST" value={professionalProfile?.licenciaSst || "No registrado"} />
              <Detail icon={<CalendarDays className="h-4 w-4" />} label="Fecha expedición licencia" value={formatDate(professionalProfile?.fechaExpedicionLicencia) || "No registrada"} />
            </div>
          )}
        </section>

        <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-black text-slate-950">Alcance de acceso</h2>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <Detail label="ID de usuario" value={user?.id || "No disponible"} />
              <Detail label="Empresa base" value={tenantId || user?.empresaId || "No disponible"} />
              <Detail label="Roles activos" value={roles.length ? roles.map(formatRole).join(", ") : "Sin roles reportados"} />
              <Detail label="Permisos activos" value={permissions.length ? `${permissions.length} permisos habilitados` : "Sin permisos reportados"} />
            </div>
          </div>

          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6">
            <div className="flex items-start gap-3">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-emerald-100 text-emerald-700">
                <LockKeyhole className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-black text-emerald-950">Seguridad de la cuenta</h2>
                <p className="mt-2 text-sm leading-6 text-emerald-800">
                  El cambio de contraseña exige tu contraseña actual y una clave nueva con complejidad alta. La clave se guarda únicamente como hash.
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>

      {passwordOpen ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/55 p-4 backdrop-blur-sm">
          <form onSubmit={submitPassword} className="w-full max-w-xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
            <div className="border-b border-slate-100 bg-slate-50 px-6 py-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-black uppercase text-violet-700">Seguridad</p>
                  <h3 className="text-xl font-black text-slate-950">
                    {passwordChangeRequired ? "Cambio obligatorio de contraseña" : "Cambiar contraseña"}
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    {passwordChangeRequired
                      ? "Por seguridad, actualiza la contraseña temporal antes de continuar."
                      : "Usa una contraseña única para Abril360."}
                  </p>
                </div>
                {!passwordChangeRequired ? (
                  <button type="button" onClick={() => closePasswordModal()} className="rounded-xl border border-slate-200 p-2 text-slate-500 hover:bg-white">
                    <X className="h-5 w-5" />
                  </button>
                ) : null}
              </div>
            </div>

            <div className="space-y-4 px-6 py-5">
              {formError ? (
                <div className="flex gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              ) : null}

              <PasswordField
                label="Contraseña actual"
                value={form.currentPassword}
                visible={show.current}
                autoComplete="current-password"
                onChange={(value) => updateForm("currentPassword", value)}
                onToggle={() => setShow((current) => ({ ...current, current: !current.current }))}
              />
              <PasswordField
                label="Nueva contraseña"
                value={form.newPassword}
                visible={show.next}
                autoComplete="new-password"
                onChange={(value) => updateForm("newPassword", value)}
                onToggle={() => setShow((current) => ({ ...current, next: !current.next }))}
              />
              <PasswordField
                label="Confirmar nueva contraseña"
                value={form.confirmPassword}
                visible={show.confirm}
                autoComplete="new-password"
                onChange={(value) => updateForm("confirmPassword", value)}
                onToggle={() => setShow((current) => ({ ...current, confirm: !current.confirm }))}
              />

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="mb-3 text-sm font-black text-slate-800">Requisitos de seguridad</p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {passwordChecks.map((item) => (
                    <CheckItem key={item.label} valid={item.valid} label={item.label} />
                  ))}
                  <CheckItem valid={form.confirmPassword.length > 0 && form.newPassword === form.confirmPassword} label="La confirmación coincide" />
                </div>
              </div>
            </div>

            <div className="flex flex-wrap justify-end gap-3 border-t border-slate-100 bg-white px-6 py-4">
              {!passwordChangeRequired ? (
                <button type="button" onClick={() => closePasswordModal()} className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50">
                  Cancelar
                </button>
              ) : null}
              <button
                type="submit"
                disabled={!canSubmit}
                className="inline-flex items-center gap-2 rounded-2xl bg-violet-700 px-5 py-3 text-sm font-bold text-white hover:bg-violet-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                Guardar contraseña
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </main>
  );
}

function getInitials(name: string) {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase() || "PS"
  );
}

function formatRole(role: string) {
  return role
    .toLowerCase()
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function hasValue(value?: string | null) {
  return Boolean(String(value || "").trim());
}

function selectProfessionalProfile(empresas: EmpresaAsignada[]) {
  const profile = empresas.find((empresa) =>
    [
      empresa.identificacion_profesional,
      empresa.profesion,
      empresa.postgrado,
      empresa.tarjeta_profesional,
      empresa.licencia_sst,
      empresa.fecha_expedicion_licencia,
    ].some(hasValue)
  );

  if (!profile) return null;

  return {
    empresaNombre: profile.nombre,
    identificacionProfesional: profile.identificacion_profesional?.trim(),
    profesion: profile.profesion?.trim(),
    postgrado: profile.postgrado?.trim(),
    tarjetaProfesional: profile.tarjeta_profesional?.trim(),
    licenciaSst: profile.licencia_sst?.trim(),
    fechaExpedicionLicencia: profile.fecha_expedicion_licencia?.trim(),
  };
}

function formatDate(value?: string | null) {
  if (!value) return "";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString("es-CO", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

function getPasswordChecks(password: string, nombre: string, email: string) {
  const lower = password.toLowerCase();
  const emailPrefix = email.split("@")[0]?.toLowerCase() || "";
  const nameParts = nombre.toLowerCase().split(/\s+/).filter((part) => part.length >= 4);
  const hasPersonalData = Boolean((emailPrefix.length >= 4 && lower.includes(emailPrefix)) || nameParts.some((part) => lower.includes(part)));

  return [
    { label: "Mínimo 12 caracteres", valid: password.length >= 12 },
    { label: "Mayúscula y minúscula", valid: /[A-Z]/.test(password) && /[a-z]/.test(password) },
    { label: "Número y símbolo", valid: /\d/.test(password) && /[^A-Za-z0-9]/.test(password) },
    { label: "No contiene datos personales", valid: password.length > 0 && !hasPersonalData },
  ];
}

function InfoCard({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-3 grid h-11 w-11 place-items-center rounded-2xl bg-violet-50 text-violet-700">{icon}</div>
      <p className="text-xs font-bold uppercase text-slate-500">{label}</p>
      <p className="mt-1 break-words text-base font-black text-slate-950">{value}</p>
    </div>
  );
}

function Detail({ icon, label, value }: { icon?: ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
      <p className="flex items-center gap-2 text-xs font-bold uppercase text-slate-500">
        {icon ? <span className="text-violet-600">{icon}</span> : null}
        {label}
      </p>
      <p className="mt-1 break-words text-sm font-bold text-slate-900">{value}</p>
    </div>
  );
}

function PasswordField({
  label,
  value,
  visible,
  autoComplete,
  onChange,
  onToggle,
}: {
  label: string;
  value: string;
  visible: boolean;
  autoComplete: string;
  onChange: (value: string) => void;
  onToggle: () => void;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-bold text-slate-700">{label}</span>
      <span className="flex overflow-hidden rounded-2xl border border-slate-200 bg-white focus-within:border-violet-400 focus-within:ring-4 focus-within:ring-violet-100">
        <input
          type={visible ? "text" : "password"}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          autoComplete={autoComplete}
          className="min-w-0 flex-1 px-4 py-3 text-sm outline-none"
        />
        <button type="button" onClick={onToggle} className="grid w-12 place-items-center text-slate-500 hover:bg-slate-50" aria-label={visible ? "Ocultar contraseña" : "Mostrar contraseña"}>
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </span>
    </label>
  );
}

function CheckItem({ valid, label }: { valid: boolean; label: string }) {
  return (
    <div className={`flex items-center gap-2 text-sm ${valid ? "text-emerald-700" : "text-slate-500"}`}>
      <span className={`grid h-5 w-5 shrink-0 place-items-center rounded-full ${valid ? "bg-emerald-100" : "bg-slate-200"}`}>
        <Check className="h-3.5 w-3.5" />
      </span>
      <span>{label}</span>
    </div>
  );
}
