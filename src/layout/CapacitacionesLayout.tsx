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
import {
  ProveedorCapacitaciones,
  useCapacitaciones,
} from "@/features/capacitaciones/ContextoCapacitaciones";
import type { ContextoCapacidades } from "@/types/capacitaciones";

// Cada entrada decide su propia visibilidad con las capacidades EFECTIVAS.
//
// Mostrar una seccion que respondera 403 es peor que no mostrarla: convierte un
// limite de permisos en algo que parece una averia.
const NAVEGACION = [
  {
    to: "/capacitaciones/cursos",
    etiqueta: "Catálogo",
    descripcion: "Cursos y versiones",
    Icono: BookOpen,
    visible: (c: ContextoCapacidades | null) =>
      Boolean(c?.puede_editar_catalogo || c?.puede_publicar),
  },
  {
    to: "/capacitaciones/asignaciones",
    etiqueta: "Asignaciones",
    descripcion: "Qué se está dictando",
    Icono: Users,
    visible: (c: ContextoCapacidades | null) => Boolean(c?.puede_asignar),
  },
  {
    to: "/capacitaciones/estado",
    etiqueta: "Estado del módulo",
    descripcion: "Contrato y habilitación",
    Icono: ShieldCheck,
    // Siempre visible para quien tiene alguna capacidad: es la pantalla que
    // explica por que algo no se puede, y esconderla dejaria el diagnostico sin
    // sitio. A quien no tiene ninguna, el backend le responde 403 y la pantalla
    // lo dice sin revelar el estado comercial.
    visible: () => true,
  },
];

export default function CapacitacionesLayout() {
  return (
    <ProveedorCapacitaciones>
      <Shell />
    </ProveedorCapacitaciones>
  );
}

function Shell() {
  const { user } = useAuth();
  const { capacidades, fase } = useCapacitaciones();
  // Mientras se resuelve el contexto no se pinta navegacion a medias: aparecer
  // y desaparecer enlaces es peor que esperar un instante.
  const entradas =
    fase === "listo" ? NAVEGACION.filter((n) => n.visible(capacidades)) : [];

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
              {entradas.map(({ to, etiqueta, descripcion, Icono }) => (
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
