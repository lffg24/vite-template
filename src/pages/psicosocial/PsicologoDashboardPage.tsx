// src/pages/psicosocial/PsicologoDashboardPage.tsx
import { Building2, ClipboardCheck, FileText, Users } from "lucide-react";
import { usePsicoEmpresaActiva } from "@/features/psicosocial/context/PsicoEmpresaActivaContext";

export default function PsicologoDashboardPage() {
  const { empresaActiva, empresas, loading, error } = usePsicoEmpresaActiva();

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
          {error && <span className="ml-3 text-red-600">{error}</span>}
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        <Card icon={<Building2 />} label="Empresas asignadas" value={empresas.length} />
        <Card icon={<ClipboardCheck />} label="Aplicaciones" value="—" />
        <Card icon={<Users />} label="Participantes" value="—" />
        <Card icon={<FileText />} label="Informes pendientes" value="—" />
      </section>

      <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-black text-slate-950">Cómo probar el flujo</h2>
        <ol className="mt-4 list-decimal space-y-2 pl-5 text-slate-700">
          <li>Selecciona una empresa activa en el menú lateral.</li>
          <li>Entra a Empresas para validar tus empresas asignadas.</li>
          <li>Abre una empresa, revisa empleados y entra al perfil de colaborador.</li>
          <li>Crea o selecciona una aplicación y revisa resultados/captura.</li>
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
