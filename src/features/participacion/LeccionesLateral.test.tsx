import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

import { LeccionesLateral } from "./LeccionesLateral";
import type { LeccionEnCurso } from "@/types/participacion";

const base = { orden: 1, tipo: "NATIVA", obligatoria: true, bloques_totales: 2, bloques_vistos: 0 };
const lecciones: LeccionEnCurso[] = [
  { ...base, leccion_id: "a", titulo: "Primera", completada: true, desbloqueada: true },
  { ...base, leccion_id: "b", titulo: "Segunda", completada: false, desbloqueada: true },
  { ...base, leccion_id: "c", titulo: "Tercera", completada: false, desbloqueada: false },
];

describe("LeccionesLateral", () => {
  it("marca la lección que se lee y deja la bloqueada como texto, sin enlace", () => {
    render(
      <MemoryRouter>
        <LeccionesLateral lecciones={lecciones} actualId="b" />
      </MemoryRouter>
    );

    expect(screen.getByRole("link", { current: "step" })).toHaveTextContent("Segunda");
    expect(screen.getByRole("link", { name: /Primera/ })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Tercera/ })).toBeNull();
    expect(screen.getByText("Tercera")).toBeInTheDocument();
    expect(screen.getByText("Bloqueada")).toBeInTheDocument();
  });
});
