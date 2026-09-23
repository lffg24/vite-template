import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

import { Illustration } from "./Illustration";
import { IllustrationSurface } from "./IllustrationSurface";
import type { IllustrationName } from "./illustration.registry";

export function IllustratedHero({
  illustration,
  title,
  description,
  action,
  className,
}: {
  illustration: IllustrationName;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("grid items-center gap-6 lg:grid-cols-[3fr_2fr]", className)}>
      <div>
        <h2 className="font-heading text-2xl font-black text-foreground sm:text-3xl">{title}</h2>
        {description ? <p className="mt-3 text-muted-foreground">{description}</p> : null}
        {action ? <div className="mt-5">{action}</div> : null}
      </div>
      <IllustrationSurface className="min-h-[12rem]">
        <Illustration name={illustration} variant="hero" size="lg" priority />
      </IllustrationSurface>
    </section>
  );
}
