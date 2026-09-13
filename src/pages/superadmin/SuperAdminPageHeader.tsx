// src/pages/superadmin/SuperAdminPageHeader.tsx
export default function SuperAdminPageHeader({ title, subtitle, action }: { title: string; subtitle: string; action?: React.ReactNode }) {
  return <div className="mb-7 flex flex-col gap-4 md:flex-row md:items-center md:justify-between"><div><div className="text-sm font-bold uppercase tracking-widest text-rel-primary">Administración global</div><h1 className="mt-2 font-rel-heading text-3xl font-bold tracking-tight text-rel-dark">{title}</h1><p className="mt-2 text-rel-muted">{subtitle}</p></div>{action}</div>;
}
