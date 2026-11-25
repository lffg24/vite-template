import { describe, expect, it } from "vitest";
import { transicionVistaSegura } from "./transicionVista";

describe("transición de vista segura", () => {
  it("conserva la transición cuando Chrome ofrece la API", () => {
    expect(transicionVistaSegura("Mozilla/5.0 AppleWebKit/537.36 Chrome/130.0 Safari/537.36", true)).toBe(true);
  });

  it("usa navegación normal en WebKit aunque ofrezca la API", () => {
    expect(transicionVistaSegura("Mozilla/5.0 AppleWebKit/605.1.15 Version/18.0 Safari/605.1.15", true)).toBe(false);
    expect(transicionVistaSegura("Mozilla/5.0 AppleWebKit/605.1.15 CriOS/130.0 Mobile Safari/604.1", true)).toBe(false);
  });

  it("no pide transición si el navegador carece de la API", () => {
    expect(transicionVistaSegura("Mozilla/5.0 Firefox/130.0", false)).toBe(false);
  });
});
