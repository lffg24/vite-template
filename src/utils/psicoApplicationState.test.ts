import { describe, expect, it } from "vitest";
import { isReportablePsicoApplicationState, normalizePsicoApplicationState } from "./psicoApplicationState";

describe("psicoApplicationState", () => {
  it("normaliza estados historicos a la maquina oficial", () => {
    expect(normalizePsicoApplicationState("cerrada")).toBe("FINALIZADA");
    expect(normalizePsicoApplicationState("calculado")).toBe("FINALIZADA");
    expect(normalizePsicoApplicationState("En progreso")).toBe("EN_CAPTURA");
    expect(normalizePsicoApplicationState("reapertura")).toBe("REABIERTA");
  });

  it("solo permite aplicaciones cerradas en informes y reportes", () => {
    expect(isReportablePsicoApplicationState("FINALIZADA")).toBe(true);
    expect(isReportablePsicoApplicationState("cerrada")).toBe(true);
    expect(isReportablePsicoApplicationState("EN_CAPTURA")).toBe(false);
    expect(isReportablePsicoApplicationState("BORRADOR")).toBe(false);
    expect(isReportablePsicoApplicationState("REABIERTA")).toBe(false);
    expect(isReportablePsicoApplicationState(null)).toBe(false);
  });
});
