import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { routeByAccess, NO_ACCESS_ROUTE } from "@/lib/accessRoutes";
import { Illustration } from "@/shared/ui/illustration";
import { Caja } from "@/shared/ui/Caja";

export default function SinAcceso() {
  const { roles, permissions } = useAuth();
  const bestRoute = routeByAccess(roles, permissions);

  if (bestRoute !== NO_ACCESS_ROUTE) {
    return <Navigate to={bestRoute} replace />;
  }

  return (
    <main className="grid min-h-screen place-items-center bg-surface-subtle px-4">
      <Caja como="section" papel="panel" aire="amplio" className="w-full max-w-lg text-center">
        <Illustration name="seguridad-usuario" variant="spot" size="md" className="mx-auto" />
        <h1 className="mt-5 text-2xl font-black text-foreground">Sin acceso asignado</h1>
        <p className="mt-2 text-sm leading-6 text-foreground-soft">
          Tu usuario no tiene permisos activos para los módulos actuales de ABRIL360.
          Solicita la asignación de rol o permiso correspondiente para continuar.
        </p>
      </Caja>
    </main>
  );
}
