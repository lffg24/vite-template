import { Outlet } from "react-router-dom";
import RoleSidebar from "@/features/navigation/components/RoleSidebar";
import { useEffectiveNavigation } from "@/features/navigation/useEffectiveNavigation";

export default function SuperAdminLayout() {
  const menu = useEffectiveNavigation();
  return (
    <div className="flex min-h-screen flex-col bg-rel-canvas sm:flex-row">
      <RoleSidebar
        items={menu.items}
        loading={menu.loading}
        error={menu.error}
        onRetry={menu.retry}
        storageKey="abril360.superadmin.sidebar.collapsed"
        brandTitle="ABRIL360"
        brandSubtitle="Administración global"
        avatarText="SA"
        userTitle="Super Usuario"
        userSubtitle="Administrador de plataforma"
        navLabel="Navegación SuperAdmin"
        footerTitle="Seguridad y privacidad · ABRIL360"
        footerLink=""
        footerLinkLabel=""
      />

      <main className="min-w-0 flex-1 p-3 sm:p-6">
        <Outlet />
      </main>
    </div>
  );
}
