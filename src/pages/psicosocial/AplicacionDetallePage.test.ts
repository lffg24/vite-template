import { describe, expect, it } from "vitest";
import {
  buildApplicationEmployeeSocioDraft,
  hasApplicationEmployeeSocioData,
  normalizeEmployeeSocioOptions,
} from "./AplicacionDetallePage";

describe("application employee sociodemographic draft", () => {
  it("no intenta guardar ficha cuando los campos opcionales estan vacios", () => {
    expect(hasApplicationEmployeeSocioData({ sexo: "", anio_nacimiento: null })).toBe(false);
  });

  it("detecta ficha opcional diligenciada", () => {
    expect(hasApplicationEmployeeSocioData({ sexo: "Femenino" })).toBe(true);
    expect(hasApplicationEmployeeSocioData({ personas_dependen: 0 })).toBe(true);
  });

  it("construye borrador sin finalizar e inyecta area y cargo de la aplicacion", () => {
    const draft = buildApplicationEmployeeSocioDraft(
      { sexo: "Masculino", area: "", cargo: "" },
      "Operaciones",
      "Analista SST",
    );

    expect(draft).toMatchObject({
      sexo: "Masculino",
      area: "Operaciones",
      cargo: "Analista SST",
      finalizar: false,
    });
  });

  it("normaliza catalogos conservando el orden base y agregando valores remotos", () => {
    expect(
      normalizeEmployeeSocioOptions(["Soltero(a)", "Casado(a)"], [
        { nombre: "Casado(a)" },
        { nombre: "Union libre" },
        { nombre: " " },
      ]),
    ).toEqual(["Soltero(a)", "Casado(a)", "Union libre"]);
  });
});
