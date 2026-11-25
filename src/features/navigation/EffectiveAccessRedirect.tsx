import { Navigate, useLocation } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { safeEffectiveRedirectPath } from "@/lib/accessRoutes";
import { resolveLandingRoute } from "./navigationTree";
import { useEffectiveNavigation } from "./useEffectiveNavigation";
import { Caja } from "@/shared/ui/Caja";

type LocationState = { from?: string } | null;

export function EffectiveAccessRedirect() {
  const location = useLocation();
  const { destinations, loading, error, retry } = useEffectiveNavigation();

  if (loading) {
    return (
      <div role="status" className="grid min-h-screen place-items-center bg-rel-canvas text-sm text-rel-muted">
        Buscando tu espacio de trabajo…
      </div>
    );
  }

  if (error) {
    return (
      <main className="grid min-h-screen place-items-center bg-rel-canvas px-4">
        <Caja role="alert" como="section" papel="panel" aire="amplio" className="w-full max-w-md text-center">
          <h1 className="font-rel-heading text-xl font-black text-rel-dark">No pudimos abrir tu espacio</h1>
          <p className="mt-2 text-sm text-rel-muted">Tu sesión sigue activa. Vuelve a comprobar los accesos asignados.</p>
          <Button variant="rel" className="mt-5" onClick={retry}>Reintentar</Button>
        </Caja>
      </main>
    );
  }

  const fallback = resolveLandingRoute(destinations);
  const requested = (location.state as LocationState)?.from ?? location.pathname;
  const target = safeEffectiveRedirectPath(requested, [
    fallback,
    ...destinations.filter((item) => item !== fallback),
  ]);
  return <Navigate to={target} replace />;
}
