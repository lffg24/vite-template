// src/pages/superadmin/SuperAdminPageHeader.tsx
export default function SuperAdminPageHeader({ title, subtitle, action }: { title: string; subtitle: string; action?: React.ReactNode }) {
  const parts = title.trim().split(/\s+/);
  const last = parts.pop() || "";
  const lead = parts.join(" ");
  return <div className="mb-7 flex flex-col gap-4 md:flex-row md:items-center md:justify-between"><div><div className="text-sm font-black uppercase tracking-[0.18em] text-brand-primary">Administración global</div><h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950">{lead ? <>{lead} </> : null}<span className="marker-highlight">{last}</span></h1><p className="mt-2 max-w-3xl text-slate-600">{subtitle}</p></div>{action}</div>;
}
