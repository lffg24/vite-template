import { describe, expect, it } from "vitest";

import { reportGroups, reportOptions } from "./ReportesOficialesPsicoPage";

describe("official psychosocial report options", () => {
  it("agrupa y ordena los entregables por alcance", () => {
    expect(reportGroups.map((group) => group.label)).toEqual([
      "Informes base",
      "Informes BTR con análisis",
      "Informes complementarios y datos",
    ]);
    expect(reportGroups[0].options.map((option) => option.value)).toEqual([
      "base_forma_a",
      "base_forma_b",
      "base_general",
      "consolidado_base",
    ]);
    expect(reportGroups[1].options.map((option) => option.value)).toEqual([
      "resultados",
      "consolidado_analisis",
      "resultados_areas",
    ]);
    expect(reportGroups[2].options.map((option) => option.value)).toEqual([
      "sociodemografico",
      "detallado_excel",
    ]);
    expect(reportOptions.find((option) => option.value === "consolidado_analisis")?.label).toBe(
      "Informe BTR · Transversal A+B",
    );
  });

  it("explica el contenido y las exclusiones de cada informe", () => {
    expect(reportOptions).toHaveLength(9);
    expect(reportOptions.every((option) => option.description.length > 80)).toBe(true);
    expect(reportOptions.find((option) => option.value === "consolidado_base")?.description).toContain("sin análisis NeuroMapa");
    expect(reportOptions.find((option) => option.value === "consolidado_analisis")?.description).toContain("plan de intervención");
    expect(reportOptions.find((option) => option.value === "detallado_excel")?.description).toContain("No contiene narrativa técnica");
  });
});
