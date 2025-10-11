// src/routes/ProtectedRoute.tsx
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

type Props = {
  requireRole?: string | string[];
};

export default function ProtectedRoute({ requireRole }: Props) {
  const { isAuthenticated, roles } = useAuth();

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  if (requireRole) {
    const needed = Array.isArray(requireRole) ? requireRole : [requireRole];
    const ok = needed.some((r) => roles.includes(r));
    if (!ok) return <Navigate to="/mis-evaluaciones" replace />;
  }

  return <Outlet />;
}
