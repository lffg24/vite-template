import { describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";

import { PasosCurso } from "./PasosCurso";

describe("PasosCurso", () => {
  it("es una lista con nombre y cada paso dice su estado en texto, no solo en color", () => {
    render(<PasosCurso etiqueta="Partes de la lección" pasos={["hecho", "actual", "pendiente"]} />);
    const lista = screen.getByRole("list", { name: "Partes de la lección" });
    const pasos = within(lista).getAllByRole("listitem");

    expect(pasos).toHaveLength(3);
    expect(pasos[0]).toHaveTextContent("1 de 3: completado");
    expect(pasos[1]).toHaveTextContent("2 de 3: en curso");
    expect(pasos[2]).toHaveTextContent("3 de 3: pendiente");
  });

  it("el color distingue los tres estados entre sí", () => {
    render(<PasosCurso etiqueta="x" pasos={["hecho", "actual", "pendiente"]} />);
    const clases = screen.getAllByRole("listitem").map((li) => li.className);

    expect(new Set(clases).size).toBe(3);
  });
});
