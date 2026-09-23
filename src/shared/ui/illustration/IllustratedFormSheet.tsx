import type { ReactNode } from "react";

import { SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

import { Illustration } from "./Illustration";
import { IllustrationSurface } from "./IllustrationSurface";
import type { IllustrationName } from "./illustration.registry";

const WIDTHS = {
  half: "sm:max-w-none lg:w-[min(50vw,56rem)]",
  wide: "sm:max-w-none lg:w-[min(62vw,68rem)]",
} as const;

/** Sheet de trabajo para formularios largos con contexto ilustrado. */
export function IllustratedFormSheet({
  eyebrow,
  title,
  description,
  illustration,
  width = "half",
  children,
  className,
}: {
  eyebrow: string;
  title: string;
  description: ReactNode;
  illustration: IllustrationName;
  width?: keyof typeof WIDTHS;
  children: ReactNode;
  className?: string;
}) {
  return (
    <SheetContent
      className={cn(
        "flex h-full w-full flex-col overflow-hidden bg-surface p-0 font-body",
        WIDTHS[width],
        className
      )}
    >
      <div className="shrink-0 border-b border-border bg-surface px-5 pb-5 pt-6 sm:px-7 sm:pb-6">
        <div className="grid grid-cols-[1fr_5.5rem] items-center gap-4 sm:grid-cols-[1fr_8rem]">
          <SheetHeader className="min-w-0 text-left">
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-brand-primary">
              {eyebrow}
            </p>
            <SheetTitle className="font-heading text-xl font-black text-foreground sm:text-2xl">
              {title}
            </SheetTitle>
            <SheetDescription className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
              {description}
            </SheetDescription>
          </SheetHeader>
          <IllustrationSurface tone="informative" className="h-20 sm:h-28">
            <Illustration name={illustration} size="sm" className="max-h-full" />
          </IllustrationSurface>
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:px-7">{children}</div>
    </SheetContent>
  );
}
