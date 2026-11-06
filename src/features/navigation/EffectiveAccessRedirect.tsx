import { Navigate, useLocation } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { safeEffectiveRedirectPath } from "@/lib/accessRoutes";
import { resolveLandingRoute } from "./navigationTree";
import { useEffectiveNavigation } from "./useEffectiveNavigation";

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
        <section role="alert" className="w-full max-w-md rounded-rel-panel border border-rel-border bg-rel-surface p-6 text-center shadow-sm">
          <h1 className="font-rel-heading text-xl font-black text-rel-dark">No pudimos abrir tu espacio</h1>
          <p className="mt-2 text-sm text-rel-muted">Tu sesión sigue activa. Vuelve a comprobar los accesos asignados.</p>
          <Button variant="rel" className="mt-5" onClick={retry}>Reintentar</Button>
        </section>
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
