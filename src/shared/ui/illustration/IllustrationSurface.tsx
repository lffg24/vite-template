import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

const TONES = {
  neutral: "border-rel-border bg-rel-surface-subtle",
  lavender:
    "border-[hsl(var(--illustration-surface-lavender-border)/0.7)] bg-[hsl(var(--illustration-surface-lavender)/0.8)]",
  navy: "border-rel-dark bg-rel-dark text-white",
  positive: "border-rel-success/20 bg-rel-success-subtle",
  informative: "border-rel-info/20 bg-rel-info-subtle",
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
