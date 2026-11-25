import { Outlet } from "react-router-dom";
import RoleSidebar from "@/features/navigation/components/RoleSidebar";
import { useEffectiveNavigation } from "@/features/navigation/useEffectiveNavigation";
import { useAuth } from "@/context/AuthContext";

export default function LicitacionesLayout() {
  const menu = useEffectiveNavigation();
  const { user } = useAuth();
  const initials = (user?.nombre || "Usuario")
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
  return (
    <div className="flex min-h-screen flex-col bg-rel-canvas sm:flex-row">
      <RoleSidebar
        items={menu.items}
        loading={menu.loading}
        error={menu.error}
        onRetry={menu.retry}
        storageKey="abril360.licitaciones.sidebar.collapsed"
        brandTitle="ABRIL360"
        brandSubtitle="Inteligencia de licitaciones"
        avatarText={initials}
        userTitle={user?.nombre || "Usuario"}
        userSubtitle="Gestión comercial"
        navLabel="Navegación de licitaciones"
        footerTitle="Evidencia y trazabilidad · ABRIL360"
        footerLink=""
        footerLinkLabel=""
      />
      <main className="min-w-0 flex-1 p-3 sm:p-6">
        <Outlet />
      </main>
    </div>
  );
}
