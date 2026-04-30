import { ShieldCheck, UserRound, Building2, KeyRound, Mail, BriefcaseBusiness } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function PsicologoPerfilPage() {
  const { user } = useAuth() as any;
  const nombre = user?.nombre || user?.name || "Perfil profesional";
  const rol = user?.rol || user?.role || "Psicóloga / Psicólogo";
  const email = user?.email || user?.correo || "Sin correo";

  return (
    <main className="min-h-screen bg-slate-50 p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-5">
            <div className="flex items-center gap-5">
              <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-violet-100 text-3xl font-black text-violet-700">
                {String(nombre).slice(0,2).toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-black uppercase tracking-wide text-violet-700">Perfil del psicólogo</p>
                <h1 className="text-3xl font-black text-slate-950">{nombre}</h1>
                <p className="mt-1 text-sm text-slate-500">Gestión profesional de empresas, aplicaciones, participantes y resultados.</p>
              </div>
            </div>
            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-bold text-emerald-700">Activo</span>
          </div>
        </section>

        <section className="grid gap-5 md:grid-cols-3">
          <Card icon={<UserRound />} label="Rol operativo" value={rol} />
          <Card icon={<Mail />} label="Correo" value={email} />
          <Card icon={<ShieldCheck />} label="Alcance" value="Multiempresa / Tenant asignado" />
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-black text-slate-950">Permisos sugeridos</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <Permission icon={<Building2 />} title="Empresas" desc="Crear, consultar y administrar empresas asignadas." />
            <Permission icon={<BriefcaseBusiness />} title="Colaboradores" desc="Consultar perfiles, cargar empleados y navegar a resultados individuales." />
            <Permission icon={<KeyRound />} title="Aplicaciones psicosociales" desc="Crear baterías, cargar respuestas, recalcular y consultar resultados." />
            <Permission icon={<ShieldCheck />} title="Confidencialidad" desc="Acceso restringido a información sensible según rol y empresa asignada." />
          </div>
        </section>
      </div>
    </main>
  );
}

function Card({ icon, label, value }: { icon: any; label: string; value: string }) {
  return <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-50 text-violet-700">{icon}</div><p className="text-xs font-bold uppercase text-slate-500">{label}</p><p className="mt-1 text-lg font-black text-slate-950">{value}</p></div>;
}
function Permission({ icon, title, desc }: { icon: any; title: string; desc: string }) {
  return <div className="flex gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-4"><span className="text-violet-700">{icon}</span><span><strong className="block text-slate-950">{title}</strong><span className="text-sm text-slate-500">{desc}</span></span></div>;
}
