import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import { Caja } from "./Caja";

// Lo que se prueba no es el aspecto —eso lo vigila `nucleo.test.ts` sobre todo
// el perímetro— sino las dos promesas de la pieza: que el papel decida las
// tres cosas JUNTAS, y que una caja no se anuncie como sección sin nombre.

describe("Caja", () => {
  it("por defecto es un div, no una sección", () => {
    // Marcar cada caja como `<section>` llena el árbol de accesibilidad de
    // regiones sin título: quien navega por regiones se encuentra una lista de
    // «sección, sección, sección» y ninguna dice de qué es.
    render(<Caja>contenido</Caja>);
    const caja = screen.getByText("contenido");
    expect(caja.tagName).toBe("DIV");
    expect(screen.queryByRole("region")).toBeNull();
  });

  it("el papel decide radio, relieve y aire juntos", () => {
    const { rerender } = render(<Caja papel="panel">x</Caja>);
    const clasesPanel = screen.getByText("x").className;
    expect(clasesPanel).toContain("rounded-rel-panel");
    expect(clasesPanel).toContain("shadow-rel-card");
    expect(clasesPanel).toContain("p-5");

    rerender(<Caja papel="caja">x</Caja>);
    const clasesCaja = screen.getByText("x").className;
    expect(clasesCaja).toContain("rounded-rel-card");
    expect(clasesCaja).toContain("p-4");
    // Una caja dentro de un panel no se levanta de nada: ya está encima de algo.
    expect(clasesCaja).not.toContain("shadow-sm");

    rerender(<Caja papel="fila">x</Caja>);
    const clasesFila = screen.getByText("x").className;
    expect(clasesFila).toContain("rounded-rel-control");
    expect(clasesFila).not.toContain("shadow-sm");
  });

  it("el aire solo admite los tres valores de la escala", () => {
    const { rerender } = render(<Caja aire="amplio">x</Caja>);
    expect(screen.getByText("x").className).toContain("p-6");
    rerender(<Caja aire="ninguno">x</Caja>);
    expect(screen.getByText("x").className).not.toMatch(/\bp-\d/);
  });

  it("puede ser otro elemento cuando la estructura lo pide", () => {
    render(
      <Caja como="section" aria-label="Matriz de capacidades">
        x
      </Caja>
    );
    expect(screen.getByRole("region", { name: "Matriz de capacidades" })).toBeInTheDocument();
  });

  it("la caja viva se levanta 8 px y NO se escala", () => {
    render(<Caja viva>x</Caja>);
    const clases = screen.getByText("x").className;
    expect(clases).toContain("hover:-translate-y-2");
    expect(clases).toContain("hover:shadow-rel-floating");
    // En Tailwind 4 `-translate-y-2` escribe la propiedad `translate`, no
    // `transform`: si la transición nombra `transform`, la sombra se anima y la
    // caja salta. Es un error que solo se ve en un navegador, por eso se fija.
    expect(clases).toContain("transition-[translate,box-shadow]");
    expect(clases).not.toContain("transition-[transform");
    // Escalar la caja entera empuja a las vecinas y rompe la rejilla.
    expect(clases).not.toMatch(/(^|\s)(hover:)?scale-/);
    // Y respeta a quien pidió menos movimiento.
    expect(clases).toContain("motion-reduce:hover:translate-y-0");
  });

  it("la caja NO es viva por defecto: levantarse dice «soy la acción»", () => {
    render(<Caja>x</Caja>);
    expect(screen.getByText("x").className).not.toContain("hover:-translate-y-2");
  });
});
