import { describe, expect, it } from "vitest";

import { reportOptions } from "./ReportesOficialesPsicoPage";

describe("official psychosocial report options", () => {
  it("prioriza informes base antes de informes derivados", () => {
    expect(reportOptions.slice(0, 3).map((option) => option.value)).toEqual([
      "base_forma_a",
      "base_forma_b",
      "base_general",
    ]);
  });
});
