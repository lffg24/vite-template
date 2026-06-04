import { Outlet } from "react-router-dom";
import { AppSidebar } from "@/shared/navigation/AppSidebar";
import { APP_NAVIGATION, filterNavigation } from "@/shared/navigation/navigation.config";

export default function SuperAdminLayout() {
  // TODO: reemplazar por auth store real.
  const roles = ["SUPER_ADMIN"];
  const permissions: string[] = [];

  const items = filterNavigation(APP_NAVIGATION, roles, permissions, ["platform"]);

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <AppSidebar
        items={items}
        brand={
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-sky-400 to-violet-600" />
            <div className="text-2xl font-black tracking-tight">
              ABRIL<span className="text-violet-400">360</span>
            </div>
          </div>
        }
        userBlock={
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="font-black">Super Usuario</div>
            <div className="text-sm text-slate-300">Administrador de plataforma</div>
            <div className="mt-2 text-xs text-emerald-300">● En línea</div>
          </div>
        }
        footer={
          <div className="text-xs text-slate-400">
            Seguridad y privacidad<br />
            ABRIL360
          </div>
        }
      />

      <main className="flex-1 min-w-0 p-8">
        <Outlet />
      </main>
    </div>
  );
}
