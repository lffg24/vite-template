// Lo que se prueba aquí es lo que las tres imitaciones NO hacían. Que se vea
// la pestaña activa no se prueba: eso es CSS. Que el teclado llegue y que el
// panel exista sí, porque es justo lo que faltaba en las tres.

import { useState } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

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
});
