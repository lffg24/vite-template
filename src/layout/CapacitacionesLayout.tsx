import { Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import RoleSidebar from "@/features/navigation/components/RoleSidebar";
import { useEffectiveNavigation } from "@/features/navigation/useEffectiveNavigation";
import { ProveedorCapacitaciones, useCapacitaciones } from "@/features/capacitaciones/ContextoCapacitaciones";
function iniciales(nombre: string): string {
  const letras = nombre
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0])
    .join("")
    .toUpperCase();
  return letras || "CA";
}

export default function CapacitacionesLayout() {
  return (
    <ProveedorCapacitaciones>
      <Shell />
    </ProveedorCapacitaciones>
  );
}

function Shell() {
  const { user } = useAuth();
  const { pathname } = useLocation();
  const { capacidades, fase } = useCapacitaciones();
  const menu = useEffectiveNavigation();

  const nombre = user?.nombre?.trim() || user?.email || "Usuario ABRIL360";

  return (
    <div className="rel-scope flex min-h-screen flex-col bg-rel-canvas font-rel-body text-rel-dark sm:flex-row">
      {/* El salto antecede al menú para que el teclado pueda omitirlo completo. */}
      <a
        href="#contenido-capacitaciones"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-rel-control focus:bg-rel-primary focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-rel-primary-foreground"
      >
        Saltar al contenido
      </a>

      <RoleSidebar
        items={menu.items}
        loading={menu.loading}
        error={menu.error}
        onRetry={menu.retry}
        tone="rel"
        storageKey="abril360.capacitaciones.sidebar.collapsed"
        brandTitle="ABRIL360"
        brandSubtitle="Capacitaciones"
        avatarText={iniciales(nombre)}
        userTitle={nombre}
        userSubtitle="Gestión de capacitaciones"
        navLabel="Navegación de Capacitaciones"
      />

      <main className="flex min-w-0 flex-1 flex-col p-6">
        <div id="contenido-capacitaciones" className="min-w-0 flex-1">
          {fase === "listo" && capacidades && !capacidades.tiene_acceso && !pathname.startsWith("/evaluaciones") ? (
            <SinAccesoAlModulo />
          ) : (
            <Outlet />
          )}
        </div>
      </main>
    </div>
  );
}

/**
 * Sesión válida, cero capacidades en el módulo.
 *
 * Reemplaza al guardia de ruta por permisos del JWT. Aquel comparaba contra una
 * lista que no conoce las asignaciones con alcance, así que expulsaba a usuarios
 * que el backend sí autoriza.
 *
 * No dice **por qué** no hay acceso, y es a propósito: la causa puede ser que la
 * empresa no contrató el módulo, y el estado comercial no lo lee cualquiera que
 * se haya autenticado. El endpoint de contexto tampoco lo revela.
 */
function SinAccesoAlModulo() {
  return (
    <div
      role="alert"
      className="mx-auto max-w-prose rounded-rel-panel border border-rel-border bg-rel-surface p-8 text-center shadow-sm"
    >
      <h1 className="font-rel-heading text-xl font-black text-rel-dark">
        No tienes acceso a Capacitaciones
      </h1>
      <p className="mt-2 font-rel-body text-sm text-rel-muted">
        Tu cuenta está activa, pero tu rol no incluye ninguna operación de este
        módulo en esta empresa. Si deberías tenerla, pídesela a quien administra
        los roles.
      </p>
      <a
        href="/"
        className="mt-6 inline-flex items-center rounded-rel-control bg-rel-primary px-4 py-2 text-sm font-bold text-rel-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rel-primary focus-visible:ring-offset-2"
      >
        Volver al inicio
      </a>
    </div>
  );
}
