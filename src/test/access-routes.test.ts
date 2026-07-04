import { describe, expect, it } from "vitest";
import { NO_ACCESS_ROUTE, routeByAccess, safeRedirectPath } from "@/lib/accessRoutes";

describe("rutas de negocio por acceso", () => {
  it("envía SuperAdmin al dashboard de plataforma", () => {
    expect(routeByAccess(["SUPER_ADMIN"], [])).toBe("/superadmin/dashboard");
    expect(routeByAccess([], ["superadmin.dashboard.view"])).toBe("/superadmin/dashboard");
  });

  it("envía psicólogo evaluador al dashboard psicosocial", () => {
    expect(routeByAccess(["PSICOLOGO_EVALUADOR"], [])).toBe("/psicosocial/dashboard");
    expect(routeByAccess([], ["psico.dashboard.view"])).toBe("/psicosocial/dashboard");
  });

  it("no reutiliza rutas legacy después del login", () => {
    expect(safeRedirectPath("/usuarios", ["PSICOLOGO_EVALUADOR"], ["psico.dashboard.view"])).toBe(
      "/psicosocial/dashboard",
    );
  });

  it("bloquea deep links de SuperAdmin para usuarios psicosociales", () => {
    expect(
      safeRedirectPath("/superadmin/creditos", ["PSICOLOGO_EVALUADOR"], ["psico.dashboard.view"]),
    ).toBe("/psicosocial/dashboard");
  });

  it("bloquea deep links psicosociales si el usuario no tiene permiso compatible", () => {
    expect(safeRedirectPath("/psicosocial/dashboard", [], [])).toBe(NO_ACCESS_ROUTE);
  });
});
