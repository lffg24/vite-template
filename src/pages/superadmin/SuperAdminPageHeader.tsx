// src/pages/superadmin/SuperAdminPageHeader.tsx
export default function SuperAdminPageHeader({ title, subtitle, action }: { title: string; subtitle: string; action?: React.ReactNode }) {
  return <div className="mb-7 flex flex-col gap-4 md:flex-row md:items-center md:justify-between"><div><div className="text-sm font-black uppercase tracking-widest text-violet-700">Administración global</div><h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950">{title}</h1><p className="mt-2 text-slate-600">{subtitle}</p></div>{action}</div>;
}
