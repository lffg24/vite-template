import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Illustration } from "./Illustration";
import { IllustratedEmptyState } from "./IllustratedEmptyState";

describe("ilustraciones compartidas", () => {
  it("mantiene decorativa una escena que acompaña texto visible y la carga diferida", () => {
    const { container } = render(<Illustration name="buscar" />);
    const image = container.querySelector("img");
    expect(image).toHaveAttribute("alt", "");
    expect(image).toHaveAttribute("aria-hidden", "true");
    expect(image).toHaveAttribute("loading", "lazy");
  });

  it("expone el texto alternativo de una escena informativa y prioriza su carga", () => {
    render(<Illustration name="alerta" decorative={false} alt="Aviso que requiere atención" priority />);
    const image = screen.getByAltText("Aviso que requiere atención");
    expect(image).not.toHaveAttribute("aria-hidden");
    expect(image).toHaveAttribute("loading", "eager");
  });

  it("ofrece una salida accionable cuando no hay datos", () => {
    render(
      <IllustratedEmptyState
        illustration="archivos-informacion"
        title="Aún no hay registros"
        description="Registra el primero para continuar."
        action={<button type="button">Registrar</button>}
      />,
    );
    expect(screen.getByRole("heading", { name: "Aún no hay registros" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Registrar" })).toBeInTheDocument();
  });
});
