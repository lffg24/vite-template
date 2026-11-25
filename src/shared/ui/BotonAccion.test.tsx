import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { BarraAccionesMovil, BotonAccion } from "./BotonAccion";

describe("acciones móviles del núcleo", () => {
  it("mantiene un objetivo táctil amplio y ocupa el ancho disponible", () => {
    render(<BotonAccion>Continuar</BotonAccion>);
    expect(screen.getByRole("button", { name: "Continuar" })).toHaveClass("min-h-14", "w-full");
  });

  it("hereda el comportamiento del botón de la casa, no lo reescribe", () => {
    // `active:scale-[0.98]` y el anillo de foco los declara UNA vez
    // `components/ui/button.tsx`. Mientras esta prueba pase, el botón del
    // participante no puede volver a traer los suyos: era el único del
    // producto que no se hundía al pulsarse.
    render(<BotonAccion>Continuar</BotonAccion>);
    expect(screen.getByRole("button", { name: "Continuar" })).toHaveClass(
      "active:scale-[0.98]",
      "focus-visible:ring-ring"
    );
  });

  it("la secundaria no es la principal con un color encima", () => {
    render(<BotonAccion variante="secundaria">Volver</BotonAccion>);
    const boton = screen.getByRole("button", { name: "Volver" });
    expect(boton.className).toContain("bg-rel-surface");
    expect(boton.className).not.toContain("bg-rel-accent");
  });

  it("reserva la zona segura del teléfono en la barra fija", () => {
    render(<BarraAccionesMovil><span>Acción</span></BarraAccionesMovil>);
    expect(screen.getByText("Acción").parentElement).toHaveClass("sticky", "bottom-0");
  });
});
