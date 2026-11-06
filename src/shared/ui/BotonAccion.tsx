import type { ButtonHTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/utils";

type Variante = "principal" | "secundaria";

/** Acción táctil del núcleo para recorridos de participante. */
export function BotonAccion({
  children,
  variante = "principal",
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variante?: Variante;
}) {
  return (
    <button
      {...props}
      className={cn(
        "inline-flex min-h-[3.5rem] w-full items-center justify-center gap-2 rounded-rel-control px-6 py-3",
        "font-rel-heading text-base font-bold transition-colors duration-rel-micro",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rel-primary focus-visible:ring-offset-2",
        "disabled:cursor-not-allowed disabled:bg-rel-neutral disabled:text-white",
        variante === "principal"
          ? "bg-rel-accent text-white shadow-sm hover:bg-rel-accent/90"
          : "border border-rel-border-strong bg-rel-surface text-rel-dark shadow-sm hover:bg-rel-surface-subtle",
        className
      )}
    >
      {children}
    </button>
  );
}

export function BarraAccionesMovil({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "sticky bottom-0 z-30 -mx-4 mt-6 border-t border-rel-border bg-rel-surface/95 px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-4 shadow-[0_-10px_30px_rgba(12,22,44,0.08)] backdrop-blur",
        "sm:-mx-6 sm:px-6 lg:static lg:mx-0 lg:border-0 lg:bg-transparent lg:p-0 lg:shadow-none lg:backdrop-blur-none",
        className
      )}
    >
      {children}
    </div>
  );
}
