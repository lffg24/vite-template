import { describe, expect, it } from "vitest";

import type { ParticipantePsico } from "@/types/psicoDashboard";
import {
  ALL_FORM_FILTERS,
  ALL_RISK_FILTERS,
  highestRiskForFilters,
  participantMatchesReportFilters,
  reportsForParticipant,
} from "./participantReportFilters";

function participant(overrides: Partial<ParticipantePsico> = {}): ParticipantePsico {
  return {
    empleado_id: 10,
    cedula: "123",
    nombre: "Persona Demo",
    email: null,
    area: "Operaciones",
    cargo: "Analista",
    tipo_cargo: null,
    sexo: null,
    intra: "A",
    bateria_completa: true,
    nivel_critico: "ALTO",
    niveles: { a: "MEDIO", b: null, extra: "ALTO", estres: "BAJO" },
    puntajes: { a: 45, b: null, extra: 70, estres: 20 },
    ...overrides,
  };
}

describe("participant report filters", () => {
  it("builds reports only for selected instruments with available scoring", () => {
    expect(reportsForParticipant(participant(), ["INTRA", "ESTRES"])).toEqual([
      { empleado_id: 10, instrument_code: "PSICO_INTRA_A" },
      { empleado_id: 10, instrument_code: "PSICO_ESTRES" },
    ]);
  });

  it("matches any selected risk across any selected instrument", () => {
    const item = participant();
    expect(participantMatchesReportFilters(item, { instrumentos: ["INTRA", "EXTRA"], riesgos: ["ALTO"] })).toBe(true);
    expect(participantMatchesReportFilters(item, { instrumentos: ["INTRA"], riesgos: ["ALTO"] })).toBe(false);
  });

  it("keeps participants with very low total stress in the stress filter", () => {
    const item = participant({ niveles: { a: "MEDIO", b: null, extra: "ALTO", estres: "MUY_BAJO" } });

    expect(participantMatchesReportFilters(item, {
      instrumentos: ["ESTRES"],
      riesgos: ALL_RISK_FILTERS,
      formas: ALL_FORM_FILTERS,
    })).toBe(true);
  });

  it("filters participants by intralaboral form before bulk reports are selected", () => {
    expect(participantMatchesReportFilters(participant({ intra: "A" }), { instrumentos: ["INTRA"], riesgos: ["MEDIO"], formas: ["A"] })).toBe(true);
    expect(participantMatchesReportFilters(participant({ intra: "A" }), { instrumentos: ["INTRA"], riesgos: ["MEDIO"], formas: ["B"] })).toBe(false);
    expect(participantMatchesReportFilters(participant({ intra: "B", niveles: { a: null, b: "ALTO", extra: null, estres: null } }), { instrumentos: ["INTRA"], riesgos: ["ALTO"], formas: ALL_FORM_FILTERS })).toBe(true);
  });

  it("uses the highest risk among selected instruments for sorting", () => {
    expect(highestRiskForFilters(participant(), ["INTRA", "EXTRA", "ESTRES"])).toBe("ALTO");
    expect(highestRiskForFilters(participant(), ["INTRA", "ESTRES"])).toBe("MEDIO");
  });
});
