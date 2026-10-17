import { describe, expect, it } from "vitest";

import { getWebDirectQuestionNote } from "./webDirectQuestionNotes";

describe("notas de comprensión por pregunta", () => {
  it("asigna notas por instrumento y orden para los cuatro cuestionarios", () => {
    expect(getWebDirectQuestionNote("PSICO_INTRA_A", 1)).toMatch(/lugar de trabajo habitual/i);
    expect(getWebDirectQuestionNote("PSICO_INTRA_A", 123)).toBeTruthy();
    expect(getWebDirectQuestionNote("PSICO_INTRA_B", 97)).toBeTruthy();
    expect(getWebDirectQuestionNote("PSICO_EXTRA", 1)).toMatch(/recorrido habitual/i);
    expect(getWebDirectQuestionNote("PSICO_EXTRA", 31)).toMatch(/deudas de tu hogar/i);
    expect(getWebDirectQuestionNote("PSICO_ESTRES", 1)).toMatch(/últimos tres meses/i);
    expect(getWebDirectQuestionNote("PSICO_ESTRES", 31)).toMatch(/problemas cotidianos/i);
  });

  it("no inventa notas fuera del rango oficial de cada instrumento", () => {
    expect(getWebDirectQuestionNote("PSICO_INTRA_A", 124)).toBeNull();
    expect(getWebDirectQuestionNote("PSICO_INTRA_B", 98)).toBeNull();
    expect(getWebDirectQuestionNote("PSICO_EXTRA", 32)).toBeNull();
    expect(getWebDirectQuestionNote("PSICO_ESTRES", 32)).toBeNull();
  });
});
