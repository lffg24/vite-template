import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import { Ilustracion } from "./Ilustracion";
import { CATALOGO, type NombreIlustracion } from "./catalogo";

const NOMBRES = Object.keys(CATALOGO) as NombreIlustracion[];

describe("la ilustración compartida", () => {
  it("es decorativa mientras no se le dé un título", () => {
    // El caso normal: la ilustración acompaña a un titular y un párrafo que ya
    // dicen lo mismo. Anunciarla sería leer el mensaje dos veces.
    const { container } = render(<Ilustracion nombre="vacio" />);
    const svg = container.querySelector("svg");

    expect(svg).toHaveAttribute("aria-hidden", "true");
    expect(svg).not.toHaveAttribute("role", "img");
  });

  it("con título pasa a ser una imagen con nombre accesible", () => {
    // Contraprueba de la anterior: la misma ilustración, la opción opuesta.
    render(<Ilustracion nombre="constancia" titulo="Constancia emitida" />);

    const imagen = screen.getByRole("img", { name: "Constancia emitida" });
    expect(imagen).not.toHaveAttribute("aria-hidden");
  });

  it.each(NOMBRES)("«%s» se dibuja y conserva el lienzo común", (nombre) => {
    // Un `viewBox` distinto rompe la proporción y la ilustración sale aplastada
    // o descentrada respecto de las demás. Es el defecto que hace que un
    // conjunto de dibujos parezca de manos distintas.
    const { container } = render(<Ilustracion nombre={nombre} />);
    const svg = container.querySelector("svg");

    expect(svg).toHaveAttribute("viewBox", "0 0 200 150");
    expect(svg?.querySelectorAll("*").length ?? 0).toBeGreaterThan(2);
  });

  it.each(NOMBRES)("«%s» no lleva ni un color escrito a mano", (nombre) => {
    // ESTE es el invariante que hace que la biblioteca sirva: todo color sale
    // de un token `rel-*`. Un `#7C3AED` incrustado sobrevive al siguiente
    // retoque de paleta y deja el dibujo desalineado del producto —y en tema
    // oscuro, ilegible.
    const { container } = render(<Ilustracion nombre={nombre} />);

    for (const nodo of Array.from(container.querySelectorAll("*"))) {
      for (const atributo of Array.from(nodo.attributes)) {
        if (atributo.name === "fill" || atributo.name === "stroke") {
          const valor = atributo.value;
          if (valor === "none" || valor === "currentColor") continue;
          expect(valor).toMatch(/^hsl\(var\(--rel-/);
        }
      }
    }
  });

  it("cambia de tamaño sin tocar el lienzo", () => {
    const { container: pequena } = render(<Ilustracion nombre="enlace" tamano="sm" />);
    const { container: grande } = render(<Ilustracion nombre="enlace" tamano="xl" />);

    expect(pequena.querySelector("svg")).toHaveClass("w-24");
    expect(grande.querySelector("svg")).toHaveClass("w-72");
    expect(pequena.querySelector("svg")).toHaveAttribute("viewBox", "0 0 200 150");
    expect(grande.querySelector("svg")).toHaveAttribute("viewBox", "0 0 200 150");
  });
});
