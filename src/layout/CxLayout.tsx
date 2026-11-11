import { Outlet } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import RoleSidebar from "@/features/navigation/components/RoleSidebar";
import { useEffectiveNavigation } from "@/features/navigation/useEffectiveNavigation";

export default function CxLayout() {
  const { user } = useAuth();
  const menu = useEffectiveNavigation();
  const nombre = user?.nombre?.trim() || user?.email || "Usuario ABRIL360";
  const iniciales = nombre.split(/\s+/).slice(0, 2).map((parte) => parte[0]).join("").toUpperCase();

  return (
    <div className="rel-scope flex min-h-screen flex-col bg-rel-canvas font-rel-body text-rel-dark sm:flex-row">
      <a href="#contenido-cx" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-rel-control focus:bg-rel-accent focus:px-4 focus:py-2 focus:font-semibold">
        Saltar al contenido
      </a>
      <RoleSidebar
        items={menu.items} loading={menu.loading} error={menu.error} onRetry={menu.retry}
        tone="rel" storageKey="abril360.cx.sidebar.collapsed"
        brandTitle="ABRIL360" brandSubtitle="Experiencia del cliente"
        avatarText={iniciales || "CX"} userTitle={nombre}
        userSubtitle="Gestión de experiencia" navLabel="Navegación de Experiencia del cliente"
      />
      <main id="contenido-cx" className="min-w-0 flex-1 p-4 sm:p-6">
        <Outlet />
      </main>
    </div>
  );
}
