import { afterEach, describe, expect, it, vi } from "vitest";

import {
  diasHasta,
  formatearCupo,
  formatearFecha,
  formatearIntensidad,
  formatearVigenciaMeses,
} from "./formato";

afterEach(() => {
  vi.useRealTimers();
});

describe("formatearIntensidad", () => {
  it("distingue «sin declarar» de cero", () => {
    // No es lo mismo un curso al que todavía no le pusieron la intensidad que
    // uno de cero minutos —que la base ni siquiera admite—. Mostrar «0 min»
    // para un nulo haría creer que el dato normativo ya está puesto.
    expect(formatearIntensidad(null)).toBe("Sin declarar");
    expect(formatearIntensidad(undefined)).toBe("Sin declarar");
  });

  it("lee los minutos como se leen en una constancia", () => {
    expect(formatearIntensidad(45)).toBe("45 min");
    expect(formatearIntensidad(60)).toBe("1 h");
    expect(formatearIntensidad(90)).toBe("1 h 30 min");
    expect(formatearIntensidad(125)).toBe("2 h 5 min");
  });
});

describe("formatearVigenciaMeses", () => {
  it("nulo es «sin vencimiento», no «cero meses»", () => {
    expect(formatearVigenciaMeses(null)).toBe("Sin vencimiento");
  });

  it("agrupa los múltiplos de doce en años", () => {
    expect(formatearVigenciaMeses(1)).toBe("1 mes");
    expect(formatearVigenciaMeses(6)).toBe("6 meses");
    expect(formatearVigenciaMeses(12)).toBe("1 año");
    expect(formatearVigenciaMeses(24)).toBe("2 años");
    expect(formatearVigenciaMeses(18)).toBe("18 meses");
  });
});

describe("formatearCupo", () => {
  it("un cupo nulo es «sin límite», nunca cero", () => {
    // Cero significaría un enlace que nadie puede usar, y el CHECK de la base
    // lo prohíbe justamente por eso. Confundirlos aquí invitaría a crearlo.
    expect(formatearCupo(4, null)).toBe("4 usos · sin límite");
    expect(formatearCupo(4, 10)).toBe("4 de 10");
  });
});

describe("diasHasta", () => {
  it("redondea hacia arriba para no anunciar «0 días» a algo que aún sirve", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-05T12:00:00Z"));

    expect(diasHasta("2026-09-08T12:00:00Z")).toBe(3);
    expect(diasHasta("2026-09-05T18:00:00Z")).toBe(1);
  });

  it("devuelve nulo ante una fecha ilegible en vez de un NaN que se pinte", () => {
    expect(diasHasta(null)).toBeNull();
    expect(diasHasta("no es una fecha")).toBeNull();
  });
});

describe("formatearFecha", () => {
  it("no revienta con datos ausentes o corruptos", () => {
    expect(formatearFecha(null)).toBe("—");
    expect(formatearFecha("")).toBe("—");
    expect(formatearFecha("2026-13-45")).toBe("—");
  });
});
