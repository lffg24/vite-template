import { Outlet } from "react-router-dom";
import { AppSidebar } from "@/shared/navigation/AppSidebar";
import { APP_NAVIGATION, filterNavigation } from "@/shared/navigation/navigation.config";

export default function SuperAdminLayout() {
  // TODO: reemplazar por auth store real.
  const roles = ["SUPER_ADMIN"];
  const permissions: string[] = [];

  const items = filterNavigation(APP_NAVIGATION, roles, permissions, ["platform"]);

  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar
        items={items}
        brand={
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-brand-turquoise to-brand-primary shadow-card" />
            <div className="text-2xl font-black tracking-tight text-sidebar-foreground">
              ABRIL<span className="text-brand-turquoise">360</span>
            </div>
          </div>
        }
        userBlock={
          <div className="rounded-2xl border border-sidebar-border bg-sidebar-hover p-4">
            <div className="font-black text-sidebar-foreground">Super Usuario</div>
            <div className="text-sm text-sidebar-muted">Administrador de plataforma</div>
            <div className="mt-2 text-xs text-brand-turquoise">● En línea</div>
          </div>
        }
        footer={
          <div className="text-xs text-sidebar-muted">
            Seguridad y privacidad<br />
            ABRIL360
          </div>
        }
      />

      <main className="min-w-0 flex-1 p-8">
        <Outlet />
      </main>
    </div>
  );
}
