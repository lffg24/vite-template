import { describe, expect, it, vi } from "vitest";
import { descargarXlsxReporteOficial, pathFor } from "./psicoReportesOficialesService";
import { api } from "@/lib/apiClient";

vi.mock("@/lib/apiClient", () => ({
  api: {
    get: vi.fn(async () => ({ data: new Blob(["xlsx"]) })),
  },
}));

describe("psicoReportesOficialesService", () => {
  it("mantiene rutas actuales y agrega reportes base en endpoints aislados", () => {
    expect(pathFor("resultados")).toBe("informe-resultados");
    expect(pathFor("resultados_areas")).toBe("informe-resultados-areas");
    expect(pathFor("sociodemografico")).toBe("informe-sociodemografico");
    expect(pathFor("base_forma_a")).toBe("informe-base-forma-a");
    expect(pathFor("base_forma_b")).toBe("informe-base-forma-b");
    expect(pathFor("base_general")).toBe("informe-base-general");
    expect(pathFor("detallado_excel")).toBe("informe-detallado");
  });

  it("descarga el excel detallado desde el endpoint oficial registrado", async () => {
    await descargarXlsxReporteOficial(4, "detallado_excel");

    expect(api.get).toHaveBeenCalledWith(
      "/reportes/psico/oficial/aplicacion/4/informe-detallado/xlsx",
      { responseType: "blob" },
    );
  });
});
