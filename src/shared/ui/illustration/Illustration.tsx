import { cn } from "@/lib/utils";

import { illustrationRegistry, type IllustrationName } from "./illustration.registry";
import { ILLUSTRATION_SIZE_CLASS } from "./illustration.tokens";
import type {
  IllustrationFit,
  IllustrationSize,
  IllustrationVariant,
} from "./illustration.types";

type AccessibilityProps =
  | { decorative?: true; alt?: string }
  | { decorative: false; alt: string };

export type IllustrationProps = AccessibilityProps & {
  name: IllustrationName;
  variant?: IllustrationVariant;
  size?: IllustrationSize;
  fit?: IllustrationFit;
  loading?: "eager" | "lazy";
  priority?: boolean;
  aspectRatio?: string;
  className?: string;
};

/** Primitive único para assets ilustrados aprobados por Diseño. */
export function Illustration({
  name,
  variant,
  size = "md",
  fit = "contain",
  loading = "lazy",
  priority = false,
  aspectRatio,
  decorative = true,
  alt = "",
  className,
}: IllustrationProps) {
  const asset = illustrationRegistry[name];

  return (
    <img
      src={asset.src}
      alt={decorative ? "" : alt}
      aria-hidden={decorative ? true : undefined}
      loading={priority ? "eager" : loading}
      decoding={priority ? "sync" : "async"}
      data-illustration-variant={variant ?? asset.variant}
      draggable={false}
      style={{
        aspectRatio:
          aspectRatio ?? ("aspectRatio" in asset ? asset.aspectRatio : undefined),
      }}
      className={cn(
        ILLUSTRATION_SIZE_CLASS[size],
        "h-auto max-w-full select-none",
        fit === "contain" ? "object-contain" : "object-cover",
        className
      )}
    />
  );
}
