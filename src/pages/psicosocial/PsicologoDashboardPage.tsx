// src/pages/psicosocial/PsicologoDashboardPage.tsx
import { AlertCircle, Building2, ClipboardCheck, FileText, Plus, RefreshCw, ShieldAlert, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { usePsicoEmpresaActiva } from "@/features/psicosocial/context/PsicoEmpresaActivaContext";

export default function PsicologoDashboardPage() {
  const navigate = useNavigate();
  const {
    empresaActiva,
    empresas,
    loading,
    error,
    errorStatus,
    onboardingRequired,
    message,
    recargarEmpresas,
  } = usePsicoEmpresaActiva();

  const showSessionWarning = errorStatus === 401;
  const showOperationalError = error && errorStatus !== 401;
  const showOnboarding = !loading && !error && onboardingRequired;

  return (
    <div className="space-y-6">
      <section className="rounded-[28px] border border-slate-200 bg-white p-7 shadow-sm">
        <div className="text-sm font-bold uppercase tracking-wide text-violet-600">Panel del psicólogo</div>
        <h1 className="mt-2 text-4xl font-black tracking-tight text-slate-950">Dashboard psicosocial</h1>
        <p className="mt-2 max-w-3xl text-slate-600">
          Gestiona empresas asignadas, aplicaciones, participantes, captura de respuestas, resultados e informes desde una empresa activa.
        </p>

        <div className="mt-5 rounded-2xl bg-violet-50 p-4 text-sm text-violet-900">
          Empresa activa: <strong>{empresaActiva?.nombre ?? (loading ? "Cargando..." : "Sin empresa seleccionada")}</strong>
        </div>
      </section>

      {showSessionWarning && (
        <Notice
          tone="amber"
          icon={<ShieldAlert className="h-5 w-5" />}
          title="Tu sesión no está enviando el token al backend"
          description="Vuelve a iniciar sesión. Si persiste, limpia localStorage/sessionStorage y confirma que el token esté guardado bajo auth.token."
          actionLabel="Ir al login"
          onAction={() => navigate("/logout")}
        />
      )}

      {showOperationalError && (
        <Notice
          tone="red"
          icon={<AlertCircle className="h-5 w-5" />}
          title="No fue posible cargar tus empresas"
          description={error}
          actionLabel="Reintentar"
          onAction={() => void recargarEmpresas()}
        />
      )}

      {showOnboarding && (
        <Notice
          tone="violet"
          icon={<Building2 className="h-5 w-5" />}
          title="Aún no tienes empresas vinculadas"
          description={message || "Crea tu primera empresa para iniciar el flujo psicosocial. Quedará vinculada automáticamente a tu perfil de psicólogo."}
          actionLabel="Crear primera empresa"
          onAction={() => navigate("/psicosocial/empresas")}
        />
      )}

      <section className="grid gap-4 md:grid-cols-4">
        <Card icon={<Building2 />} label="Empresas asignadas" value={loading ? "—" : empresas.length} />
        <Card icon={<ClipboardCheck />} label="Aplicaciones" value="—" />
        <Card icon={<Users />} label="Participantes" value="—" />
        <Card icon={<FileText />} label="Informes pendientes" value="—" />
      </section>

      <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-black text-slate-950">Siguiente flujo operativo</h2>
            <p className="mt-1 text-sm text-slate-500">Orden recomendado para mantener trazabilidad multiempresa.</p>
          </div>
          <button
            type="button"
            onClick={() => void recargarEmpresas()}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"
          >
            <RefreshCw className="h-4 w-4" /> Actualizar
          </button>
        </div>
        <ol className="mt-4 list-decimal space-y-2 pl-5 text-slate-700">
          <li>Crea o selecciona una empresa activa.</li>
          <li>Configura perfil de empresa, empleados y datos sociodemográficos.</li>
          <li>Crea una aplicación psicosocial para la empresa activa.</li>
          <li>Carga respuestas, calcula resultados y genera informes.</li>
        </ol>
      </section>
    </div>
  );
}

function Card({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-violet-50 text-violet-700">{icon}</div>
      <div className="text-sm font-semibold text-slate-500">{label}</div>
      <div className="mt-1 text-3xl font-black text-slate-950">{value}</div>
    </div>
  );
}

function Notice({
  tone,
  icon,
  title,
  description,
  actionLabel,
  onAction,
}: {
  tone: "violet" | "amber" | "red";
  icon: React.ReactNode;
  title: string;
  description: string;
  actionLabel: string;
  onAction: () => void;
}) {
  const styles = {
    violet: "border-violet-200 bg-violet-50 text-violet-900",
    amber: "border-amber-200 bg-amber-50 text-amber-900",
    red: "border-red-200 bg-red-50 text-red-900",
  }[tone];

  const btn = {
    violet: "bg-violet-700 hover:bg-violet-800 text-white",
    amber: "bg-amber-600 hover:bg-amber-700 text-white",
    red: "bg-red-600 hover:bg-red-700 text-white",
  }[tone];

  return (
    <section className={`rounded-[24px] border p-5 shadow-sm ${styles}`}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex gap-3">
          <div className="mt-0.5">{icon}</div>
          <div>
            <h2 className="font-black">{title}</h2>
            <p className="mt-1 max-w-3xl text-sm opacity-90">{description}</p>
          </div>
        </div>
        <button type="button" onClick={onAction} className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold ${btn}`}>
          <Plus className="h-4 w-4" /> {actionLabel}
        </button>
      </div>
    </section>
  );
}
