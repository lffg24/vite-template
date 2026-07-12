import { describe, expect, it } from "vitest";
import { badgeVariants } from "./badge";

describe("Badge", () => {
  it("mantiene los textos de estado en una sola linea", () => {
    expect(badgeVariants()).toContain("whitespace-nowrap");
  });
});
