import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

const TONES = {
  neutral: "border-border bg-surface-subtle",
  lavender: "border-border bg-accent/60",
  navy: "border-sidebar bg-sidebar text-sidebar-foreground",
  positive: "border-success/20 bg-success/10",
  informative: "border-info/20 bg-info/10",
} as const;

export function IllustrationSurface({
  tone = "neutral",
  children,
  className,
}: {
  tone?: keyof typeof TONES;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-center overflow-hidden rounded-[var(--illustration-radius)] border",
        TONES[tone],
        className
      )}
    >
      {children}
    </div>
  );
}
