import { describe, expect, it } from "vitest";

import { companyUpdateWasPersisted, normalizePayload } from "./EmpresaPerfilPage";


describe("EmpresaPerfilPage company update confirmation", () => {
  it("normaliza el formulario antes de enviarlo", () => {
    expect(normalizePayload({ nombre: " Empresa QA ", nit: " 900123 ", telefono: "  " })).toEqual({
      nombre: "Empresa QA",
      nit: "900123",
      telefono: null,
    });
  });

  it("solo confirma éxito cuando el perfil refleja los valores enviados", () => {
    const payload = { nombre: "Empresa QA", nit: "900123", ciudad: "Bogotá" };

    expect(companyUpdateWasPersisted(
      { id: "empresa-1", nombre: "Empresa QA", nit: "900123", ciudad: "Bogotá" },
      payload,
    )).toBe(true);
    expect(companyUpdateWasPersisted(
      { id: "empresa-1", nombre: "Empresa QA", nit: "", ciudad: "" },
      payload,
    )).toBe(false);
  });
});
