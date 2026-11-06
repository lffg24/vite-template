import { describe, expect, it } from "vitest";

import { routeByAccess, safeRedirectPath } from "./accessRoutes";

const CAP_EDITAR = "hseq.capacitacion.catalogo.editar";
const CAP_ASIGNAR = "hseq.capacitacion.asignar";

describe("routeByAccess con Capacitaciones", () => {
  it("lleva a Capacitaciones a quien solo tiene ese módulo", () => {
    // Antes de este cambio caía en /sin-acceso: el módulo existía en el backend
    // y no había forma de llegar a él desde la aplicación.
    expect(routeByAccess([], [CAP_EDITAR])).toBe("/capacitaciones/cursos");
    expect(routeByAccess([], [CAP_ASIGNAR])).toBe("/capacitaciones/cursos");
  });

  it("NO cambia el destino de nadie que ya aterrizaba en Psicosocial", () => {
    // Esta es la contraprueba que justifica el orden de las ramas. Si la de
    // Capacitaciones se hubiera colocado antes, un psicólogo con los dos
    // módulos empezaría a aterrizar en otro sitio, y esa regresión no sería
    // atribuible a nada visible en el diff de esta pantalla.
    expect(routeByAccess(["PSICOLOGO_EVALUADOR"], [CAP_EDITAR])).toBe(
      "/psicosocial/dashboard"
    );
    expect(routeByAccess([], ["psico.dashboard.view", CAP_ASIGNAR])).toBe(
      "/psicosocial/dashboard"
    );
    expect(routeByAccess([], ["psico.aplicaciones.view", CAP_ASIGNAR])).toBe(
      "/psicosocial/aplicaciones-bt"
    );
    expect(routeByAccess(["SUPER_ADMIN"], [CAP_EDITAR])).toBe("/superadmin/dashboard");
  });

  it("sigue mandando a /sin-acceso a quien no tiene ningún módulo", () => {
    expect(routeByAccess([], [])).toBe("/sin-acceso");
    expect(routeByAccess([], ["algo.que.no.existe"])).toBe("/sin-acceso");
  });
});

describe("safeRedirectPath con Capacitaciones", () => {
  it("admite volver a una ruta del módulo cuando el permiso está", () => {
    expect(safeRedirectPath("/capacitaciones/asignaciones", [], [CAP_ASIGNAR])).toBe(
      "/capacitaciones/asignaciones"
    );
  });

  it("descarta la ruta cuando el permiso no está, en vez de rebotar en la pantalla", () => {
    // Sin esta rama, un `?from=/capacitaciones/...` de alguien sin permiso
    // acabaría en el guardia de la ruta, que redirige, que vuelve a leer el
    // `from`… El filtro se hace antes de navegar.
    expect(safeRedirectPath("/capacitaciones/cursos", ["PSICOLOGO_EVALUADOR"], [])).toBe(
      "/psicosocial/dashboard"
    );
    expect(safeRedirectPath("/capacitaciones/cursos", [], [])).toBe("/sin-acceso");
  });

  it("no toca el filtrado de rutas de Psicosocial", () => {
    expect(safeRedirectPath("/psicosocial/empresas", [], [CAP_EDITAR])).toBe(
      "/capacitaciones/cursos"
    );
    expect(safeRedirectPath("/psicosocial/empresas", [], ["psico.dashboard.view"])).toBe(
      "/psicosocial/empresas"
    );
  });
});
