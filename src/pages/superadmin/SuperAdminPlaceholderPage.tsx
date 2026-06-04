// src/pages/superadmin/SuperAdminPlaceholderPage.tsx
import SuperAdminPageHeader from "./SuperAdminPageHeader";
export default function SuperAdminPlaceholderPage({ title = "Módulo en construcción" }: { title?: string }) { return <div><SuperAdminPageHeader title={title} subtitle="Base visual y de ruta preparada para la siguiente iteración." /><div className="rounded-3xl border bg-white p-10 text-slate-600 shadow-sm">Este módulo queda reservado para la construcción incremental con permisos y auditoría.</div></div>; }
