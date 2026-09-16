import { describe, expect, it } from "vitest";

import { resolveLandingRoute } from "./navigationTree";
import { safeEffectiveRedirectPath } from "@/lib/accessRoutes";

describe("aterrizaje por navegación efectiva", () => {
  it("resuelve permisos empresariales de Capacitaciones sin depender del JWT global", () => {
    expect(resolveLandingRoute([
      "/capacitaciones/asignaciones",
      "/capacitaciones/inicio",
    ])).toBe("/capacitaciones/inicio");
  });

  it("incorpora futuros módulos desde el árbol y conserva el primer destino permitido", () => {
    expect(resolveLandingRoute(["/evaluaciones"])).toBe("/evaluaciones");
    expect(resolveLandingRoute([])).toBe("/sin-acceso");
  });

  it("conserva una ruta profunda solicitada solo cuando pertenece a un destino permitido", () => {
    const destinations = ["/capacitaciones/cursos", "/capacitaciones/inicio"];
    expect(safeEffectiveRedirectPath("/capacitaciones/cursos/curso-1", destinations))
      .toBe("/capacitaciones/cursos/curso-1");
    expect(safeEffectiveRedirectPath("/superadmin/usuarios", destinations))
      .toBe("/capacitaciones/cursos");
  });
});
