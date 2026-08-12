import { describe, expect, it } from "vitest";
import {
  calculateInstrumentalExposure,
  getInstrumentalTotals,
  getTotalGeneralRows,
  reportesDashboardEmptyText,
  resultQualityLabel,
} from "./ReportesPsico";

describe("ReportesPsico", () => {
  it("muestra estado vacio cuando no hay aplicaciones cerradas reportables", () => {
    expect(reportesDashboardEmptyText(0)).toBe("No hay aplicaciones cerradas con resultados disponibles para reportar.");
  });

  it("pide seleccionar aplicacion cuando existen aplicaciones reportables", () => {
    expect(reportesDashboardEmptyText(2)).toBe("Selecciona una aplicación para visualizar el dashboard.");
  });

  it("separa total general para no duplicarlo en exposicion instrumental", () => {
    const totals = [
      { total_code: "TOTAL_INTRA", n: 10, alto_muy_alto: 2 },
      { total_code: "TOTAL_EXTRA", n: 10, alto_muy_alto: 4 },
      { total_code: "TOTAL_GENERAL", n: 10, alto_muy_alto: 10 },
    ] as any;

    expect(getInstrumentalTotals(totals).map((item: any) => item.total_code)).toEqual(["TOTAL_INTRA", "TOTAL_EXTRA"]);
    expect(getTotalGeneralRows(totals).map((item: any) => item.total_code)).toEqual(["TOTAL_GENERAL"]);
    expect(calculateInstrumentalExposure(totals)).toEqual({
      totalScores: 20,
      altoMuyAlto: 6,
      pctAltoMuyAlto: 30,
    });
  });

  it("nombra la calidad como lectura funcional para el psicologo", () => {
    expect(resultQualityLabel({ estado: "OK" })).toBe("Apta para análisis");
    expect(resultQualityLabel({ estado: "REVISAR" })).toBe("Revisar calidad");
    expect(resultQualityLabel(null)).toBe("Sin datos");
  });
});
