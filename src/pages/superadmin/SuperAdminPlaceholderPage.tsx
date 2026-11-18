// src/pages/superadmin/SuperAdminPlaceholderPage.tsx
import SuperAdminPageHeader from "./SuperAdminPageHeader";
export default function SuperAdminPlaceholderPage({ title = "Módulo en construcción" }: { title?: string }) { return <div><SuperAdminPageHeader title={title} subtitle="Base visual y de ruta preparada para la siguiente iteración." /><div className="rounded-rel-panel border bg-white p-10 text-foreground-soft shadow-rel-card">Este módulo queda reservado para la construcción incremental con permisos y auditoría.</div></div>; }
