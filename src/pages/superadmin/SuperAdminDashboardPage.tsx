// src/pages/superadmin/SuperAdminDashboardPage.tsx
import { useEffect, useState } from "react";
import { Building2, ClipboardList, CreditCard, UsersRound } from "lucide-react";
import { superadminService, type SuperAdminDashboard } from "@/features/superadmin/api/superadminService";
import SuperAdminCard from "@/features/superadmin/components/SuperAdminCard";
import SuperAdminPageHeader from "./SuperAdminPageHeader";

export default function SuperAdminDashboardPage() {
  const [data, setData] = useState<SuperAdminDashboard | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => { superadminService.dashboard().then(setData).catch((e) => setError(e.message)); }, []);
  const k = data?.kpis || {};
  return <div><SuperAdminPageHeader title="Dashboard Super Usuario" subtitle="Resumen general de la plataforma ABRIL360." action={<button className="rounded-2xl border bg-white px-5 py-3 font-black text-violet-700">Exportar reporte</button>} />{error && <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">{error}</div>}<section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4"><SuperAdminCard title="Empresas registradas" value={k.empresas ?? "—"} hint="Total plataforma" icon={Building2} /><SuperAdminCard title="Usuarios registrados" value={k.usuarios ?? "—"} hint="Incluye psicólogos y admins" icon={UsersRound} /><SuperAdminCard title="Aplicaciones totales" value={k.aplicaciones ?? "—"} hint="Baterías psicosociales" icon={ClipboardList} /><SuperAdminCard title="Créditos disponibles" value={k.saldo_total ?? "—"} hint={`Asignados: ${k.asignados_total ?? 0}`} icon={CreditCard} /></section><section className="mt-6 grid gap-5 xl:grid-cols-2"><div className="rounded-3xl border bg-white p-6 shadow-sm"><h2 className="text-xl font-black">Consumo de créditos</h2><div className="mt-6 grid place-items-center rounded-3xl bg-slate-50 p-10 text-center"><div className="text-5xl font-black text-violet-700">{k.consumidos_total ?? 0}</div><div className="mt-2 font-bold text-slate-500">Créditos consumidos</div></div></div><div className="rounded-3xl border bg-white p-6 shadow-sm"><h2 className="text-xl font-black">Alertas y notificaciones</h2><div className="mt-5 grid gap-3"><div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 font-bold text-amber-700">Revisar cuentas con saldo bajo</div><div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 font-bold text-blue-700">Auditoría activa para acciones SuperAdmin</div></div></div></section></div>;
}
