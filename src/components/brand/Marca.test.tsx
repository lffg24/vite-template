import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Marca } from "./Marca";

describe("Marca", () => {
  it("se presenta como ABRIL360, no como el producto anterior", () => {
    // Dos pantallas decían `alt="EVA 360"`: el producto se anunciaba con el
    // nombre viejo a quien usa lector de pantalla.
    render(<Marca />);
    expect(screen.getByAltText("ABRIL360")).toBeInTheDocument();
  });

  it("calla cuando al lado ya hay un texto que dice lo mismo", () => {
    const { container } = render(<Marca decorativa />);
    const img = container.querySelector("img")!;
    expect(img).toHaveAttribute("alt", "");
    expect(img).toHaveAttribute("aria-hidden", "true");
  });

  it("cambia de archivo según la superficie, no según la pantalla", () => {
    const { container: claro } = render(<Marca sobre="claro" />);
    const { container: oscuro } = render(<Marca sobre="oscuro" />);
    expect(claro.querySelector("img")!.getAttribute("src")).not.toEqual(
      oscuro.querySelector("img")!.getAttribute("src")
    );
  });

  it("reserva el hueco antes de cargar y nunca recorta el isotipo", () => {
    // `width`/`height` evitan el salto de la cabecera al cargar la imagen.
    // `contain` y no `cover`: el manual de marca prohíbe recortar el símbolo.
    const { container } = render(<Marca variante="isotipo" />);
    const img = container.querySelector("img")!;
    expect(img).toHaveAttribute("width", "235");
    expect(img).toHaveAttribute("height", "260");
    expect(img.className).toContain("object-contain");
    expect(img.className).not.toContain("object-cover");
  });
});
