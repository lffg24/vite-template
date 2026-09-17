export type IllustrationVariant =
  | "hero"
  | "spot"
  | "product"
  | "ambient"
  | "editorial"
  | "motion";

export type IllustrationSize = "xs" | "sm" | "md" | "lg" | "xl" | "full";
export type IllustrationFit = "contain" | "cover";

export interface IllustrationAsset {
  src: string;
  variant: IllustrationVariant;
  aspectRatio?: string;
}
