// src/routes/ProtectedRoute.tsx
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { routeByAccess } from "@/lib/accessRoutes";

type Props = {
  requireRole?: string | string[];
  requirePermission?: string | string[];
};

function hasAny(values: string[], required?: string | string[]) {
  if (!required) return true;
  const list = Array.isArray(required) ? required : [required];
  return list.some((item) => values.includes(item));
}

export default function ProtectedRoute({ requireRole, requirePermission }: Props) {
  const { initialized, isAuthenticated, roles, permissions, passwordChangeRequired } = useAuth();
  const location = useLocation();

  if (!initialized) {
    return (
      <div className="min-h-screen grid place-items-center bg-slate-50 text-sm text-slate-500">
        Validando sesión...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (passwordChangeRequired && location.pathname !== "/psicosocial/perfil") {
    return <Navigate to="/psicosocial/perfil?forcePassword=1" replace state={{ from: location.pathname }} />;
  }

  const okRole = hasAny(roles, requireRole);
  const okPermission = hasAny(permissions, requirePermission);

  if (!okRole || !okPermission) {
    return <Navigate to={routeByAccess(roles, permissions)} replace />;
  }

  return <Outlet />;
}
