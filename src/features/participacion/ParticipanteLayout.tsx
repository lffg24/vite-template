// src/features/participacion/ParticipanteLayout.tsx
//
// El armazón del recorrido público. **Móvil primero, y de verdad.**
//
// Quien abre esto es un trabajador con un teléfono de gama media, en 4G, que
// llegó por WhatsApp y no tiene cuenta. Eso gobierna cada decisión de aquí:
//
// - Una sola columna. No hay versión de escritorio que se «comprima»: hay una
//   pantalla estrecha que en escritorio se centra y ya.
// - Sin navegación. No hay a dónde ir: hay un curso que terminar. Una barra de
//   secciones aquí sería una invitación a perderse.
// - Sin marca por encima del contenido. El nombre de la empresa aparece donde
//   sirve —en el aterrizaje, para que el enlace de WhatsApp resulte creíble— y
//   no en una cabecera que roba altura en cada pantalla.
//
// El `min-h-dvh` y no `min-h-screen`: en móvil, `100vh` incluye la barra del
// navegador que se retrae al hacer scroll, y el pie queda cortado o baila.

import type { ReactNode } from "react";

export function ParticipanteLayout({
  children,
  progreso,
}: {
  children: ReactNode;
  /** 0 a 1. Solo cuando hay un recorrido en marcha; en el aterrizaje no. */
  progreso?: number;
}) {
  return (
    <div className="rel-scope flex min-h-dvh flex-col bg-rel-canvas font-rel-body text-rel-dark">
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

      {/* `max-w-md` y no `max-w-2xl`: en escritorio se ve como lo que es, una
          pantalla pensada para el teléfono, en vez de estirar una columna de
          texto hasta hacerla incómoda de leer. */}
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col px-5 py-6">
        {children}
      </main>

      <footer className="mx-auto w-full max-w-md px-5 pb-6">
        <p className="text-center text-xs text-rel-muted">
          ABRIL-360 · REL Consilium
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
        "min-h-12 w-full rounded-rel-control bg-rel-primary px-5 text-base font-semibold " +
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
        "min-h-12 w-full rounded-rel-control border border-rel-primary px-5 text-base " +
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
      className={`rounded-rel-card border border-rel-border bg-rel-surface p-5 ${className}`}
    >
      {children}
    </div>
  );
}
