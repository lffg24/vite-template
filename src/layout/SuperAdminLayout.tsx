import { Outlet } from "react-router-dom";
import {
  Building2,
  CalendarClock,
  ClipboardList,
  CreditCard,
  Gauge,
  Settings,
  UserCog,
  UsersRound,
} from "lucide-react";
import RoleSidebar from "@/features/navigation/components/RoleSidebar";

const items = [
  { to: "/superadmin/dashboard", label: "Dashboard", icon: Gauge },
  { to: "/superadmin/empresas", label: "Empresas", icon: Building2 },
  { to: "/superadmin/psicologos", label: "Psicólogos", icon: UsersRound },
  { to: "/superadmin/creditos", label: "Créditos", icon: CreditCard },
  { to: "/superadmin/roles-permisos", label: "Roles y permisos", icon: UserCog },
  { to: "/superadmin/auditoria", label: "Auditoría", icon: ClipboardList },
  { to: "/superadmin/planes", label: "Planes y suscripciones", icon: CalendarClock },
  { to: "/superadmin/configuracion", label: "Configuración", icon: Settings },
];

export default function SuperAdminLayout() {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <RoleSidebar
        items={items}
        storageKey="abril360.superadmin.sidebar.collapsed"
        brandTitle="ABRIL-360"
        brandSubtitle="Administración global"
        avatarText="SA"
        userTitle="Super Usuario"
        userSubtitle="Administrador de plataforma"
        navLabel="Navegación SuperAdmin"
        footerTitle="Seguridad y privacidad · ABRIL360"
        footerLink=""
        footerLinkLabel=""
      />

      <main className="min-w-0 flex-1 p-6">
        <Outlet />
      </main>
    </div>
  );
}
