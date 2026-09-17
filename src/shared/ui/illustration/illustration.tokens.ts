import type { IllustrationSize } from "./illustration.types";

export const ILLUSTRATION_SIZE_CLASS: Record<IllustrationSize, string> = {
  xs: "w-[var(--illustration-size-xs)]",
  sm: "w-[var(--illustration-size-sm)]",
  md: "w-[var(--illustration-size-md)]",
  lg: "w-[var(--illustration-size-lg)]",
  xl: "w-[var(--illustration-size-xl)]",
  full: "w-full",
};
