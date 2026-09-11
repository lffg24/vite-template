import { describe, expect, it } from "vitest";

import { agrupar } from "./SuperAdminRolesPermisosPage";
import type { Capacidad } from "@/services/accesoService";

function cap(parcial: Partial<Capacidad>): Capacidad {
  return {
    clave: "x",
    nombre: "X",
    descripcion: "",
    modulo: "CAPACITACIONES",
    superficie: "EMPRESA",
    configurable: true,
    requiere_contrato: true,
    ...parcial,
  };
}

describe("la agrupación del catálogo de capacidades", () => {
  it("pone PLATAFORMA antes que EMPRESA", () => {
    // No es orden alfabético ni el de llegada: es el que conviene leer. Una
    // capacidad de plataforma afecta a TODAS las empresas, y concederla
    // creyendo que afecta a una es el error que la pantalla debe impedir.
    const grupos = agrupar([
      cap({ clave: "a", superficie: "EMPRESA" }),
      cap({ clave: "b", superficie: "PLATAFORMA" }),
    ]);

    expect(grupos).toHaveLength(1);
    expect(grupos[0].superficies.map((s) => s.superficie)).toEqual([
      "PLATAFORMA",
      "EMPRESA",
    ]);
  });

  it("separa módulos distintos en vez de mezclarlos", () => {
    // Hoy solo hay uno registrado. Esta prueba es la que impide que el día que
    // entre el segundo la pantalla los liste juntos sin que nadie lo note.
    const grupos = agrupar([
      cap({ clave: "a", modulo: "CAPACITACIONES" }),
      cap({ clave: "b", modulo: "PSICOSOCIAL" }),
      cap({ clave: "c", modulo: "CAPACITACIONES" }),
    ]);

    expect(grupos.map((g) => g.modulo).sort()).toEqual([
      "CAPACITACIONES",
      "PSICOSOCIAL",
    ]);
    const cap1 = grupos.find((g) => g.modulo === "CAPACITACIONES");
    expect(cap1?.superficies[0].items.map((c) => c.clave)).toEqual(["a", "c"]);
  });

  it("no pierde ni duplica ninguna capacidad", () => {
    // Contraprueba de las dos anteriores: agrupar es una partición, y una
    // capacidad que se cae del agrupamiento desaparece de la administración
    // sin dejar rastro — nadie la echaría de menos hasta necesitarla.
    const entrada = [
      cap({ clave: "a", superficie: "PLATAFORMA" }),
      cap({ clave: "b", superficie: "EMPRESA" }),
      cap({ clave: "c", modulo: "OTRO", superficie: "EMPRESA" }),
    ];

    const salida = agrupar(entrada).flatMap((g) =>
      g.superficies.flatMap((s) => s.items.map((c) => c.clave))
    );

    expect(salida.sort()).toEqual(["a", "b", "c"]);
  });

  it("con el catálogo vacío no inventa grupos", () => {
    expect(agrupar([])).toEqual([]);
  });
});
