import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

import { NumeroQueCuenta } from "./NumeroQueCuenta";

const original = window.matchMedia;
afterEach(() => {
  window.matchMedia = original;
  vi.restoreAllMocks();
});

describe("NumeroQueCuenta", () => {
  it("sin preferencia de movimiento declarada pinta el valor final de entrada", () => {
    // jsdom responde «no» a todo: es el mundo de quien pidió menos movimiento.
    render(<NumeroQueCuenta valor={80} sufijo=" %" />);
    expect(screen.getByText("80 %")).toBeInTheDocument();
  });

  it("cuando anima, el lector de pantalla oye solo el valor definitivo", () => {
    window.matchMedia = ((q: string) => ({
      matches: q.includes("no-preference"),
      media: q,
      addEventListener: () => {},
      removeEventListener: () => {},
    })) as unknown as typeof window.matchMedia;
    // El reloj no avanza: se queda en el primer cuadro, en cero.
    vi.spyOn(window, "requestAnimationFrame").mockImplementation(() => 1);

    const { container } = render(<NumeroQueCuenta valor={80} sufijo=" %" />);
    const oculto = container.querySelector('[aria-hidden="true"]');

    expect(oculto).toHaveTextContent("0 %");
    expect(container.querySelector(".sr-only")).toHaveTextContent("80 %");
  });
});
