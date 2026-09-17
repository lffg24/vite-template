import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Illustration } from "./Illustration";

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
});
