// src/pages/superadmin/SuperAdminPlaceholderPage.tsx
import SuperAdminPageHeader from "./SuperAdminPageHeader";
import { Caja } from "@/shared/ui/Caja";
export default function SuperAdminPlaceholderPage({ title = "Módulo en construcción" }: { title?: string }) { return <div><SuperAdminPageHeader title={title} subtitle="Base visual y de ruta preparada para la siguiente iteración." /><Caja papel="panel" aire="amplio" className="text-foreground-soft">Este módulo queda reservado para la construcción incremental con permisos y auditoría.</Caja></div>; }
