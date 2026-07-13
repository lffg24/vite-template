import { describe, expect, it } from "vitest";
import { pathFor } from "./psicoReportesOficialesService";

describe("psicoReportesOficialesService", () => {
  it("mantiene rutas actuales y agrega reportes base en endpoints aislados", () => {
    expect(pathFor("resultados")).toBe("informe-resultados");
    expect(pathFor("resultados_areas")).toBe("informe-resultados-areas");
    expect(pathFor("sociodemografico")).toBe("informe-sociodemografico");
    expect(pathFor("base_forma_a")).toBe("informe-base-forma-a");
    expect(pathFor("base_forma_b")).toBe("informe-base-forma-b");
    expect(pathFor("base_general")).toBe("informe-base-general");
  });
});
