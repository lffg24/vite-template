// Lo que se prueba aquí es lo que las tres imitaciones NO hacían. Que se vea
// la pestaña activa no se prueba: eso es CSS. Que el teclado llegue y que el
// panel exista sí, porque es justo lo que faltaba en las tres.

import { useState } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { Pestanas } from "./Pestanas";

function Ejemplo() {
  const [valor, setValor] = useState<"uno" | "dos" | "tres">("uno");
  return (
    <Pestanas
      etiqueta="Secciones"
      valor={valor}
      alCambiar={setValor}
      pestanas={[
        { id: "uno", nombre: "Uno" },
        { id: "dos", nombre: "Dos", cuenta: 4 },
        { id: "tres", nombre: "Tres" },
      ] as const}
    >
      <p>Contenido de {valor}</p>
    </Pestanas>
  );
}

const pestana = (nombre: string | RegExp) => screen.getByRole("tab", { name: nombre });

describe("Pestanas", () => {
  it("el panel existe y lo nombra la pestaña activa", () => {
    render(<Ejemplo />);
    const panel = screen.getByRole("tabpanel");
    // Esto es lo que faltaba en las tres imitaciones: `role="tab"` prometía un
    // panel que no estaba en ninguna parte del documento, así que el lector
    // anunciaba «pestaña 2 de 3» y después no encontraba qué había cambiado.
    expect(panel).toHaveAccessibleName("Uno");
    expect(panel).toHaveTextContent("Contenido de uno");
  });

  it("el grupo entero es UNA parada del tabulador", () => {
    render(<Ejemplo />);
    // Con una parada por pestaña, cinco módulos obligan a pulsar Tab cinco
    // veces para llegar al contenido. Dentro del grupo se mueve con flechas.
    expect(pestana("Uno")).toHaveAttribute("tabindex", "0");
    expect(pestana(/Dos/)).toHaveAttribute("tabindex", "-1");
    expect(pestana("Tres")).toHaveAttribute("tabindex", "-1");
  });

  it("las flechas cambian de pestaña y se llevan el foco", () => {
    render(<Ejemplo />);
    pestana("Uno").focus();

    fireEvent.keyDown(document.activeElement!, { key: "ArrowRight" });
    expect(screen.getByRole("tabpanel")).toHaveTextContent("Contenido de dos");
    expect(pestana(/Dos/)).toHaveFocus();
    expect(pestana(/Dos/)).toHaveAttribute("tabindex", "0");

    // Desde la última, → vuelve a la primera, como las pestañas del navegador.
    fireEvent.keyDown(document.activeElement!, { key: "ArrowRight" });
    fireEvent.keyDown(document.activeElement!, { key: "ArrowRight" });
    expect(screen.getByRole("tabpanel")).toHaveTextContent("Contenido de uno");

    fireEvent.keyDown(document.activeElement!, { key: "End" });
    expect(pestana("Tres")).toHaveFocus();

    fireEvent.keyDown(document.activeElement!, { key: "Home" });
    expect(pestana("Uno")).toHaveFocus();
  });

  it("la cifra se lee pegada al nombre, no como un número suelto", () => {
    render(<Ejemplo />);
    // «Dos, 4» y no «Dos» por un lado y «4» por otro: un número detrás de un
    // nombre no dice de qué es.
    expect(pestana("Dos, 4")).toBeInTheDocument();
    // Y la cifra no se lee dos veces: la píldora visible está oculta al lector.
    expect(screen.getByText("4")).toHaveAttribute("aria-hidden", "true");
  });

  describe("la raya que se desliza", () => {
    afterEach(() => vi.restoreAllMocks());

    it("sin medida, la pestaña activa dibuja su propia raya (nunca queda sin indicador)", () => {
      // jsdom no tiene maquetación: todo mide 0. Es el caso «todavía no hay medida».
      const { container } = render(<Ejemplo />);
      expect(pestana("Uno").className).toContain("border-primary");
      expect(container.querySelector("[role=tablist] > span[aria-hidden]")).toBeNull();
    });

    it("con medida hay UNA raya, oculta al lector, y las pestañas ya no dibujan la suya", () => {
      vi.spyOn(HTMLElement.prototype, "offsetWidth", "get").mockReturnValue(80);
      vi.spyOn(HTMLElement.prototype, "offsetHeight", "get").mockReturnValue(44);
      vi.spyOn(HTMLElement.prototype, "offsetLeft", "get").mockReturnValue(16);
      vi.spyOn(HTMLElement.prototype, "offsetTop", "get").mockReturnValue(0);

      const { container } = render(<Ejemplo />);
      const rayas = container.querySelectorAll("[role=tablist] > span[aria-hidden=true]");
      expect(rayas).toHaveLength(1);
      // Se posiciona en el borde inferior de la activa (alto 44 - 2 de raya).
      expect(rayas[0]).toHaveStyle({ width: "80px", transform: "translate(16px, 42px)" });
      expect(pestana("Uno").className).toContain("border-transparent");
      expect(pestana("Uno").className).not.toContain("border-primary");
    });

    it("las píldoras no llevan raya deslizante", () => {
      vi.spyOn(HTMLElement.prototype, "offsetWidth", "get").mockReturnValue(80);
      const { container } = render(
        <Pestanas etiqueta="x" valor="a" alCambiar={() => {}} aspecto="pildora"
          pestanas={[{ id: "a", nombre: "A" }, { id: "b", nombre: "B" }] as const}>
          <p>c</p>
        </Pestanas>
      );
      expect(container.querySelector("[role=tablist] > span[aria-hidden]")).toBeNull();
    });
  });
});
