import { describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

import { RutaAprendizaje, siguienteLeccion } from "./RutaAprendizaje";
import type { LeccionEnCurso } from "@/types/participacion";

function leccion(parcial: Partial<LeccionEnCurso> & { leccion_id: string }): LeccionEnCurso {
  return {
    orden: 1,
    titulo: parcial.leccion_id,
    tipo: "NATIVA",
    obligatoria: true,
    bloques_totales: 2,
    bloques_vistos: 0,
    completada: false,
    desbloqueada: false,
    ...parcial,
  };
}

const lecciones = [
  leccion({ leccion_id: "bienvenida", completada: true, desbloqueada: true }),
  leccion({ leccion_id: "video", tipo: "VIDEO", desbloqueada: true, bloques_vistos: 1 }),
  leccion({ leccion_id: "documento", tipo: "DOCUMENTO" }),
  leccion({ leccion_id: "extra", obligatoria: false }),
];

function pintar(ls: LeccionEnCurso[]) {
  return render(
    <MemoryRouter>
      <RutaAprendizaje lecciones={ls} />
    </MemoryRouter>
  );
}

describe("RutaAprendizaje", () => {
  it("resalta como EN CURSO la primera abierta sin terminar, y solo esa", () => {
    pintar(lecciones);
    const actual = screen.getByRole("link", { current: "step" });
    expect(actual).toHaveAttribute("href", "/c/sesion/leccion/video");
    expect(within(actual).getByText("En curso")).toBeInTheDocument();
    // Contraprueba: la completada es enlace (se puede repasar) pero no es la actual.
    const completada = screen.getByRole("link", { name: /bienvenida/ });
    expect(completada).not.toHaveAttribute("aria-current");
  });

  it("lo bloqueado NO es un enlace y dice cómo abrirlo", () => {
    pintar(lecciones);
    expect(screen.queryByRole("link", { name: /documento/ })).toBeNull();
    expect(screen.getAllByText("Termina la lección anterior").length).toBeGreaterThan(0);
  });

  it("marca lo que no cuenta para terminar", () => {
    pintar(lecciones);
    expect(screen.getByText("Complementaria")).toBeInTheDocument();
  });

  it("la ruta y el botón «Continuar» eligen la misma lección", () => {
    // Si cada uno tuviera su regla, la ruta resaltaría una lección y el botón
    // llevaría a otra.
    expect(siguienteLeccion(lecciones)?.leccion_id).toBe("video");
    expect(siguienteLeccion([lecciones[0]])).toBeUndefined();
  });
});
