// src/layout/CapacitacionesLayout.tsx
//
// Shell del módulo. Es propio y no una rama del shell de Psicosocial a
// propósito: `RoleSidebar` y `AppSidebar` son componentes compartidos y
// meterles un caso más los volvería el sitio donde se acumulan las excepciones
// de todos los módulos. Este layout no toca nada existente.

import { NavLink, Outlet } from "react-router-dom";
import { BookOpen, GraduationCap, LogOut, ShieldCheck, Users } from "lucide-react";

import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";

const NAVEGACION = [
  {
    to: "/capacitaciones/cursos",
    etiqueta: "Catálogo",
    descripcion: "Cursos y versiones",
    Icono: BookOpen,
  },
  {
    to: "/capacitaciones/asignaciones",
    etiqueta: "Asignaciones",
    descripcion: "Qué se está dictando",
    Icono: Users,
  },
  {
    to: "/capacitaciones/estado",
    etiqueta: "Estado del módulo",
    descripcion: "Contrato y habilitación",
    Icono: ShieldCheck,
  },
];

export default function CapacitacionesLayout() {
  const { user } = useAuth();

  return (
    <div className="rel-scope min-h-screen bg-rel-canvas font-rel-body text-rel-dark">
      {/* Salto directo al contenido: la navegación tiene tres enlaces y
          tabularlos en cada pantalla es exactamente el tipo de fricción que
          §21 pide evitar. */}
      <a
        href="#contenido-capacitaciones"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-rel-control focus:bg-rel-primary focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-rel-primary-foreground"
      >
        Saltar al contenido
      </a>

      <header className="border-b border-rel-border bg-rel-surface">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-6 gap-y-3 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-rel-control bg-rel-primary text-rel-primary-foreground">
              <GraduationCap className="h-5 w-5" aria-hidden="true" />
            </span>
            <div className="leading-tight">
              <p className="font-rel-heading text-sm font-bold tracking-tight text-rel-dark">
                Capacitaciones
              </p>
              <p className="text-xs text-rel-muted">ABRIL-360 by REL Consilium</p>
            </div>
          </div>

          <nav aria-label="Secciones de Capacitaciones" className="order-3 w-full sm:order-2 sm:w-auto">
            <ul className="flex flex-wrap gap-1">
              {NAVEGACION.map(({ to, etiqueta, descripcion, Icono }) => (
                <li key={to}>
                  <NavLink
                    to={to}
                    title={descripcion}
                    className={({ isActive }) =>
                      cn(
                        "flex items-center gap-2 rounded-rel-control px-3 py-2 text-sm font-semibold transition-colors duration-rel-micro",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rel-primary focus-visible:ring-offset-2",
                        isActive
                          ? "bg-rel-canvas text-rel-primary"
                          : "text-rel-muted hover:bg-rel-surface-subtle hover:text-rel-dark"
                      )
                    }
                  >
                    <Icono className="h-4 w-4" aria-hidden="true" />
                    {etiqueta}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>

          <div className="order-2 ml-auto flex items-center gap-3 sm:order-3">
            {user?.nombre || user?.email ? (
              <span className="hidden text-sm text-rel-muted md:inline">
                {user.nombre || user.email}
              </span>
            ) : null}
            <a
              href="/logout"
              className="inline-flex items-center gap-1.5 rounded-rel-control px-2.5 py-2 text-sm font-semibold text-rel-muted transition-colors duration-rel-micro hover:bg-rel-surface-subtle hover:text-rel-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rel-primary focus-visible:ring-offset-2"
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
              <span className="sr-only sm:not-sr-only">Salir</span>
            </a>
          </div>
        </div>
      </header>

      <main id="contenido-capacitaciones" className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        <Outlet />
      </main>
    </div>
  );
}
