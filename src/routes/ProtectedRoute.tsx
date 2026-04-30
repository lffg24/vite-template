// src/routes/ProtectedRoute.tsx
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

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
  const { isAuthenticated, roles } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  const okRole = hasAny(roles, requireRole);
  // Compatibilidad: AuthContext actual aún no expone permissions; si luego lo agregas,
  // cambia esta línea por const { roles, permissions } = useAuth();
  const okPermission = requirePermission ? true : true;

  if (!okRole || !okPermission) {
    return <Navigate to="/mis-evaluaciones" replace />;
  }

  return <Outlet />;
}
