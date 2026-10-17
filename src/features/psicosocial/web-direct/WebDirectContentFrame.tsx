import type { ReactNode } from "react";

import { Card } from "@/components/ui/card";
import { Illustration, type IllustrationName } from "@/shared/ui/illustration";

import { WebDirectParticipantShell } from "./WebDirectParticipantShell";
import { WebDirectStepProgress } from "./WebDirectStepProgress";

type WebDirectContentFrameProps = {
  stepLabel: string;
  progress: { current: number; total: number; label?: string };
  eyebrow: string;
  title: string;
  description: string;
  illustration: IllustrationName;
  children: ReactNode;
  aside?: ReactNode;
  actions?: ReactNode;
};

export function WebDirectContentFrame({
  stepLabel,
  progress,
  eyebrow,
  title,
  description,
  illustration,
  children,
  aside,
  actions,
}: WebDirectContentFrameProps) {
  return (
    <WebDirectParticipantShell stepLabel={stepLabel}>
      <WebDirectStepProgress {...progress} />
      <Card className="overflow-hidden rounded-[1.5rem] border-border bg-surface shadow-soft sm:rounded-[2rem]">
        <div className="grid lg:grid-cols-[minmax(0,1.05fr)_minmax(22rem,0.75fr)]">
          <section className="p-6 sm:p-9 lg:p-12">
            <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-primary">{eyebrow}</p>
            <h1 className="mt-3 text-balance font-heading text-3xl font-black leading-tight text-foreground sm:text-4xl">{title}</h1>
            <p className="mt-3 max-w-3xl text-base leading-7 text-muted-foreground">{description}</p>
            <Illustration
              name={illustration}
              variant="hero"
              size="full"
              priority
              className="mx-auto mt-5 max-h-48 max-w-sm lg:hidden"
            />
            <div className="mt-7">{children}</div>
            {actions ? <div className="mt-8">{actions}</div> : null}
          </section>

          <aside className="flex flex-col justify-between border-t border-border bg-surface-subtle/70 p-6 sm:p-8 lg:border-l lg:border-t-0 lg:p-10">
            <Illustration
              name={illustration}
              variant="hero"
              size="full"
              priority
              className="mx-auto hidden max-h-[21rem] max-w-lg lg:block"
            />
            {aside ? <div className="mt-5">{aside}</div> : null}
          </aside>
        </div>
      </Card>
    </WebDirectParticipantShell>
  );
}
