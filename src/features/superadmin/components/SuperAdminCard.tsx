// src/features/superadmin/components/SuperAdminCard.tsx
import type { LucideIcon } from "lucide-react";
export default function SuperAdminCard({ title, value, hint, icon: Icon }: { title: string; value: string | number; hint?: string; icon: LucideIcon }) {
  return <div className="rounded-3xl border border-border/70 bg-white p-6 shadow-card"><div className="flex items-start gap-4"><div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-accent text-brand-primary"><Icon className="h-7 w-7" /></div><div className="min-w-0"><p className="text-sm font-bold leading-6 text-slate-600">{title}</p><p className="mt-1 text-3xl font-black leading-none text-slate-950">{value}</p>{hint && <p className="mt-3 text-sm font-semibold text-emerald-700">{hint}</p>}</div></div></div>;
}
