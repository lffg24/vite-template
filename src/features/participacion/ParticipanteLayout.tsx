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

import evaLogoColor from "@/assets/eva-logo-color.png";
import AbrilWordmark from "@/components/brand/AbrilWordmark";

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

      <header className="border-b border-rel-border/80 bg-rel-surface">
        <div className="mx-auto flex min-h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <img
              src={evaLogoColor}
              alt=""
              aria-hidden="true"
              className="h-9 w-9 object-contain sm:h-10 sm:w-10"
            />
            <div>
              <AbrilWordmark
                className="font-rel-heading text-xl font-black tracking-tight text-rel-dark sm:text-2xl"
                accentClassName="text-rel-primary"
              />
              <p className="hidden text-xs text-rel-muted sm:block">
                Aprende · Avanza · Impacta
              </p>
            </div>
          </div>
          <span className="rounded-full bg-rel-accent-subtle px-3 py-1.5 text-xs font-semibold text-rel-accent sm:text-sm">
            Participante
          </span>
        </div>
      </header>

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
  return (
    <button
      {...props}
      className={
        "inline-flex min-h-12 w-full items-center justify-center rounded-rel-control bg-rel-primary px-5 text-base font-semibold shadow-sm " +
        "text-rel-primary-foreground transition-colors duration-rel-micro " +
        "hover:bg-rel-primary/90 focus-visible:outline-none focus-visible:ring-2 " +
        "focus-visible:ring-rel-primary focus-visible:ring-offset-2 " +
        "disabled:cursor-not-allowed disabled:bg-rel-neutral disabled:text-white " +
        (props.className ?? "")
      }
    >
      {children}
    </button>
  );
}

export function BotonSecundario({
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={
        "inline-flex min-h-12 w-full items-center justify-center rounded-rel-control border border-rel-primary bg-rel-surface px-5 text-base " +
        "font-semibold text-rel-primary transition-colors duration-rel-micro " +
        "hover:bg-rel-surface focus-visible:outline-none focus-visible:ring-2 " +
        "focus-visible:ring-rel-primary focus-visible:ring-offset-2 " +
        (props.className ?? "")
      }
    >
      {children}
    </button>
  );
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
