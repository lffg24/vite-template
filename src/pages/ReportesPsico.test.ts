import { describe, expect, it } from "vitest";
import { reportesDashboardEmptyText } from "./ReportesPsico";

describe("ReportesPsico", () => {
  it("muestra estado vacio cuando no hay aplicaciones cerradas reportables", () => {
    expect(reportesDashboardEmptyText(0)).toBe("No hay aplicaciones cerradas con resultados disponibles para reportar.");
  });

  it("pide seleccionar aplicacion cuando existen aplicaciones reportables", () => {
    expect(reportesDashboardEmptyText(2)).toBe("Selecciona una aplicación para visualizar el dashboard.");
  });
});
