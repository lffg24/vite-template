import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Illustration } from "./Illustration";
import { IllustratedEmptyState } from "./IllustratedEmptyState";

describe("Illustration", () => {
  it("oculta del lector una escena que solo acompaña texto visible", () => {
    const { container } = render(<Illustration name="courseLessonBuilder" />);

    const image = container.querySelector("img");
    expect(image).toHaveAttribute("alt", "");
    expect(image).toHaveAttribute("aria-hidden", "true");
  });

  it("exige una descripción cuando la escena aporta información", () => {
    render(
      <Illustration
        name="evaluationBuilder"
        decorative={false}
        alt="Constructora revisando las preguntas de una evaluación"
      />
    );

    expect(
      screen.getByAltText("Constructora revisando las preguntas de una evaluación")
    ).toBeInTheDocument();
  });

  it("prioriza la carga cuando la escena es crítica para la pantalla", () => {
    render(
      <Illustration
        name="alerta"
        decorative={false}
        alt="Aviso que requiere atención"
        priority
      />
    );

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
      />
    );

    expect(screen.getByRole("heading", { name: "Aún no hay registros" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Registrar" })).toBeInTheDocument();
  });
});
