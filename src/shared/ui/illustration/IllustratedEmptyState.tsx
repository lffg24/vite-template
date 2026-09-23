import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

import { Illustration } from "./Illustration";
import { IllustrationSurface } from "./IllustrationSurface";
import type { IllustrationName } from "./illustration.registry";

export function IllustratedEmptyState({
  illustration,
  title,
  description,
  action,
  className,
}: {
  illustration: IllustrationName;
  title: string;
  description: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("grid gap-5 text-center sm:grid-cols-[11rem_1fr] sm:text-left", className)}>
      <IllustrationSurface>
        <Illustration name={illustration} variant="spot" size="sm" />
      </IllustrationSurface>
      <div className="self-center">
        <h3 className="font-heading text-lg font-bold text-foreground">{title}</h3>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{description}</p>
        {action ? <div className="mt-4">{action}</div> : null}
      </div>
    </section>
  );
}
