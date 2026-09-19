// src/features/participacion/ParticipanteLayout.tsx
//
// El armazón del recorrido público. **Móvil primero, y de verdad.**
//
// Quien abre esto es un trabajador con un teléfono de gama media, en 4G, que
// llegó por WhatsApp y no tiene cuenta. Eso gobierna cada decisión de aquí:
//
// - Móvil usa jerarquía compacta, controles táctiles y acciones persistentes.
// - Escritorio aprovecha el ancho para separar contenido, contexto y avance.
// - Sin navegación de producto. Hay un curso que terminar y no se agregan
//   salidas que distraigan del recorrido.
// - La marca vive en una cabecera breve y consistente en todas las pantallas.
//
// El `min-h-dvh` y no `min-h-screen`: en móvil, `100vh` incluye la barra del
// navegador que se retrae al hacer scroll, y el pie queda cortado o baila.

import type { ReactNode } from "react";

import { BotonAccion } from "@/shared/ui/BotonAccion";
import { CabeceraParticipante } from "@/shared/ui/CabeceraParticipante";

export function ParticipanteLayout({
  children,
  progreso,
  ancho = "amplio",
}: {
  children: ReactNode;
  /** 0 a 1. Solo cuando hay un recorrido en marcha; en el aterrizaje no. */
  progreso?: number;
  ancho?: "compacto" | "amplio";
}) {
  return (
    <div className="rel-scope flex min-h-screen min-h-[100dvh] flex-col bg-rel-canvas font-rel-body text-rel-dark">
      {progreso !== undefined ? (
        <div
          className="h-1 w-full bg-rel-border"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(progreso * 100)}
          aria-label="Avance del curso"
        >
          <div
            className="h-full bg-rel-primary transition-[width] duration-rel-panel"
            style={{ width: `${Math.max(0, Math.min(1, progreso)) * 100}%` }}
          />
        </div>
      ) : null}

      <CabeceraParticipante />

      <main
        className={`mx-auto flex w-full flex-1 flex-col px-4 py-5 sm:px-6 sm:py-8 lg:px-8 ${
          ancho === "compacto" ? "max-w-3xl" : "max-w-7xl"
        }`}
      >
        {children}
      </main>

      <footer className="mt-auto border-t border-rel-border/80 bg-rel-surface">
        <p className="mx-auto w-full max-w-7xl px-4 py-5 text-center text-xs text-rel-muted sm:px-6 lg:px-8">
          ABRIL360 · REL Consilium SAS
        </p>
      </footer>
    </div>
  );
}

/**
 * Botón de acción principal, a lo ancho.
 *
 * A lo ancho y con 48 px de alto porque se pulsa con el pulgar, de pie, quizá
 * con guantes. Los objetivos táctiles pequeños son la primera causa de que un
 * formulario móvil se sienta roto.
 */
export function BotonPrincipal({
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return <BotonAccion {...props}>{children}</BotonAccion>;
}

export function BotonSecundario({
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return <BotonAccion {...props} variante="secundaria">{children}</BotonAccion>;
}

/** Tarjeta de contenido. Sólida, nunca translúcida: se lee al sol. */
export function Panel({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-rel-card border border-rel-border bg-rel-surface p-5 shadow-sm ${className}`}
    >
      {children}
    </div>
  );
}
