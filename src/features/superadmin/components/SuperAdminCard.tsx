// src/features/superadmin/components/SuperAdminCard.tsx
import type { LucideIcon } from "lucide-react";
export default function SuperAdminCard({ title, value, hint, icon: Icon }: { title: string; value: string | number; hint?: string; icon: LucideIcon }) {
  return <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"><div className="flex items-start justify-between"><div><p className="text-sm font-bold text-slate-500">{title}</p><p className="mt-3 text-3xl font-black text-slate-950">{value}</p>{hint && <p className="mt-3 text-sm font-semibold text-emerald-600">{hint}</p>}</div><div className="grid h-14 w-14 place-items-center rounded-2xl bg-violet-100 text-violet-700"><Icon className="h-7 w-7" /></div></div></div>;
}
