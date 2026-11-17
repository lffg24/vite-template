import { Navigate } from "react-router-dom";
import { LockKeyhole } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { routeByAccess, NO_ACCESS_ROUTE } from "@/lib/accessRoutes";

export default function SinAcceso() {
  const { roles, permissions } = useAuth();
  const bestRoute = routeByAccess(roles, permissions);

  if (bestRoute !== NO_ACCESS_ROUTE) {
    return <Navigate to={bestRoute} replace />;
  }

  return (
    <main className="grid min-h-screen place-items-center bg-surface-subtle px-4">
      <section className="w-full max-w-lg rounded-2xl border border-border bg-white p-8 text-center shadow-sm">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-surface-subtle text-foreground-soft">
          <LockKeyhole className="h-7 w-7" />
        </div>
        <h1 className="mt-5 text-2xl font-black text-foreground">Sin acceso asignado</h1>
        <p className="mt-2 text-sm leading-6 text-foreground-soft">
          Tu usuario no tiene permisos activos para los módulos actuales de ABRIL360.
          Solicita la asignación de rol o permiso correspondiente para continuar.
        </p>
      </section>
    </main>
  );
}
