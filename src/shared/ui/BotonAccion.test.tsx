import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { BarraAccionesMovil, BotonAccion } from "./BotonAccion";

describe("acciones móviles del núcleo", () => {
  it("mantiene un objetivo táctil amplio y ocupa el ancho disponible", () => {
    render(<BotonAccion>Continuar</BotonAccion>);
    expect(screen.getByRole("button", { name: "Continuar" })).toHaveClass("min-h-[3.5rem]", "w-full");
  });

  it("reserva la zona segura del teléfono en la barra fija", () => {
    render(<BarraAccionesMovil><span>Acción</span></BarraAccionesMovil>);
    expect(screen.getByText("Acción").parentElement).toHaveClass("sticky", "bottom-0");
  });
});
