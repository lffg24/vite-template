import { describe, expect, it } from "vitest";

import type { ParticipantePsico } from "@/types/psicoDashboard";
import {
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

  it("uses the highest risk among selected instruments for sorting", () => {
    expect(highestRiskForFilters(participant(), ["INTRA", "EXTRA", "ESTRES"])).toBe("ALTO");
    expect(highestRiskForFilters(participant(), ["INTRA", "ESTRES"])).toBe("MEDIO");
  });
});
