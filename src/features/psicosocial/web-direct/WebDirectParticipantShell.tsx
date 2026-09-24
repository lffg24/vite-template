import type { ReactNode } from "react";
import { HelpCircle, ShieldCheck } from "lucide-react";

import evaIsotype from "@/assets/eva-isotipo-white.png";
import AbrilWordmark from "@/components/brand/AbrilWordmark";
import { cn } from "@/lib/utils";

type WebDirectParticipantShellProps = {
  children: ReactNode;
  stepLabel: string;
  className?: string;
};

export function WebDirectParticipantShell({
  children,
  stepLabel,
  className,
}: WebDirectParticipantShellProps) {
  return (
    <div className="min-h-[100svh] bg-background text-foreground">
      <a
        href="#contenido-principal"
        className="sr-only z-[100] rounded-lg bg-surface px-4 py-3 font-semibold text-foreground focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        Saltar al contenido
      </a>

      <header className="bg-sidebar text-sidebar-foreground">
        <div className="mx-auto flex min-h-20 w-full max-w-7xl items-center justify-between gap-4 px-5 py-4 sm:px-8 lg:px-12">
          <div className="flex min-w-0 items-center gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-sidebar-border bg-sidebar-hover p-1.5" aria-hidden="true">
              <img src={evaIsotype} alt="" className="h-full w-full object-contain" />
            </div>
            <div className="min-w-0">
              <AbrilWordmark
                className="block truncate font-heading text-xl font-black tracking-tight sm:text-2xl"
                accentClassName="text-sidebar-active"
              />
              <p className="truncate text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-sidebar-muted sm:text-xs">
                Gestión psicosocial
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <span className="hidden items-center gap-2 text-sm text-sidebar-muted sm:inline-flex">
              <HelpCircle className="h-4 w-4" aria-hidden="true" /> ¿Necesitas ayuda?
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-sidebar-border bg-sidebar-hover px-3 py-2 text-xs font-bold text-sidebar-foreground">
              <ShieldCheck className="h-4 w-4 text-sidebar-active" aria-hidden="true" />
              <span className="hidden sm:inline">Proceso seguro y confidencial</span>
              <span className="sm:hidden">Seguro</span>
            </span>
          </div>
        </div>
      </header>

      <main
        id="contenido-principal"
        className={cn(
          "mx-auto w-full max-w-7xl px-4 pb-[max(2rem,env(safe-area-inset-bottom))] pt-5 sm:px-8 sm:pt-8 lg:px-12",
          className,
        )}
      >
        <p className="mb-4 text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground sm:mb-5">
          {stepLabel}
        </p>
        {children}
      </main>
    </div>
  );
}
