import { describe, expect, it } from "vitest";
import {
  buildApplicationEmployeeSocioDraft,
  hasApplicationEmployeeSocioData,
  participantInstrumentChips,
  participantStatusLabel,
} from "./AplicacionDetallePage";
import { normalizeSocioOptions } from "@/features/psicosocial/components/sociodemografia/SociodemografiaFields";

describe("application employee sociodemographic draft", () => {
  it("no intenta guardar ficha cuando los campos opcionales estan vacios", () => {
    expect(hasApplicationEmployeeSocioData({ sexo: "", anio_nacimiento: null })).toBe(false);
  });

  it("detecta ficha opcional diligenciada", () => {
    expect(hasApplicationEmployeeSocioData({ sexo: "Femenino" })).toBe(true);
    expect(hasApplicationEmployeeSocioData({ personas_dependen: 0 })).toBe(true);
    expect(hasApplicationEmployeeSocioData({ ciudad_trabajo: "Bogotá" })).toBe(true);
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
      normalizeSocioOptions(["Soltero(a)", "Casado(a)"], [
        { nombre: "Casado(a)" },
        { nombre: "casado(a)" },
        { nombre: "Union libre" },
        { nombre: " " },
      ]),
    ).toEqual(["Soltero(a)", "Casado(a)", "Union libre"]);
  });
});

describe("application participant status chips", () => {
  const instrumentos = [
    { evaluacion_id: 1, instrument_code: "PSICO_INTRA_A", nombre: "Forma A" },
    { evaluacion_id: 2, instrument_code: "PSICO_INTRA_B", nombre: "Forma B" },
    { evaluacion_id: 3, instrument_code: "PSICO_EXTRA", nombre: "Extralaboral" },
    { evaluacion_id: 4, instrument_code: "PSICO_ESTRES", nombre: "Estrés" },
  ];

  it("marca datos generales como completo cuando la ficha esta completa", () => {
    const chips = participantInstrumentChips(instrumentos, {
      ficha_sociodemografica: { requerida: true, estado: "completa", completa: true },
      instrumentos_registrados: ["PSICO_EXTRA"],
      instrumentos_en_captura: [],
    });

    expect(chips.find((chip) => chip.code === "DATOS_GENERALES")).toMatchObject({
      label: "Datos generales",
      state: "complete",
    });
    expect(chips.find((chip) => chip.code === "PSICO_EXTRA")).toMatchObject({
      state: "complete",
    });
  });

  it("oculta Forma B cuando Forma A ya fue iniciada o completada", () => {
    const chips = participantInstrumentChips(instrumentos, {
      ficha_sociodemografica: { requerida: true, estado: "borrador", completa: false },
      instrumentos_registrados: [],
      instrumentos_en_captura: ["PSICO_INTRA_A"],
    });

    expect(chips.map((chip) => chip.code)).toContain("PSICO_INTRA_A");
    expect(chips.map((chip) => chip.code)).not.toContain("PSICO_INTRA_B");
    expect(chips.find((chip) => chip.code === "PSICO_INTRA_A")).toMatchObject({
      state: "capture",
    });
  });

  it("oculta Forma A cuando Forma B ya fue completada", () => {
    const chips = participantInstrumentChips(instrumentos, {
      instrumentos_registrados: ["PSICO_INTRA_B"],
      instrumentos_en_captura: [],
    });

    expect(chips.map((chip) => chip.code)).not.toContain("PSICO_INTRA_A");
    expect(chips.find((chip) => chip.code === "PSICO_INTRA_B")).toMatchObject({
      state: "complete",
    });
  });

  it("expone los tres estados funcionales del participante", () => {
    expect(participantStatusLabel({ registrado: false, completo: false })).toBe("Por tabular");
    expect(participantStatusLabel({ registrado: true, completo: false })).toBe("En captura");
    expect(participantStatusLabel({ registrado: true, completo: true })).toBe("Completo");
  });
});
