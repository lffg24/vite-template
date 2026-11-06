import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

import CapacitacionesInicioPage from "./CapacitacionesInicioPage";
import { obtenerTablero } from "@/services/capacitacionesService";
import type { Tablero } from "@/types/capacitaciones";

vi.mock("@/services/capacitacionesService", () => ({
  obtenerTablero: vi.fn(),
}));

function tablero(over: Partial<Tablero> = {}): Tablero {
  return {
    asignaciones_activas: 3,
    personas_en_curso: 12,
    personas_completadas: 40,
    sin_empezar: 5,
    constancias_vigentes: 38,
    constancias_por_vencer: 0,
    constancias_vencidas: 0,
    dias_aviso_vencimiento: 60,
    atrasadas: [],
    ...over,
  };
}

function montar() {
  return render(
    <MemoryRouter>
      <CapacitacionesInicioPage />
    </MemoryRouter>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

/**
 * `/capacitaciones` no tenía inicio: la ruta índice redirigía a la primera
 * pantalla que el permiso permitiera, así que se entraba al módulo y se
 * aterrizaba en una lista sin saber qué estaba pasando.
 */
describe("Inicio de Capacitaciones", () => {
  it("cuenta lo que está en marcha", async () => {
    vi.mocked(obtenerTablero).mockResolvedValue(tablero());
    montar();

    expect(await screen.findByText("3")).toBeInTheDocument();
    expect(screen.getByText("12")).toBeInTheDocument();
    expect(screen.getByText("40")).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument();
  });

  it("el umbral de aviso lo dice el SERVIDOR, no la pantalla", async () => {
    // Repetir «60 días» en el cliente sería tener dos fuentes para el mismo
    // número, y la del cliente se quedaría vieja sin que nadie lo notara.
    vi.mocked(obtenerTablero).mockResolvedValue(
      tablero({ dias_aviso_vencimiento: 90, constancias_por_vencer: 4 })
    );
    montar();

    expect(await screen.findByText(/En los próximos 90 días/)).toBeInTheDocument();
  });

  it("no lista asignaciones atrasadas cuando no las hay", async () => {
    // El servidor ya filtra las que ya terminó todo el mundo. Una lista de
    // alertas que trae lo resuelto enseña a ignorar la lista.
    vi.mocked(obtenerTablero).mockResolvedValue(tablero());
    montar();

    await screen.findByText("Capacitaciones");
    expect(
      screen.queryByText(/Pasó la fecha objetivo y queda gente/)
    ).not.toBeInTheDocument();
  });

  it("cuando hay atrasadas, lleva a ver quién falta", async () => {
    // Contraprueba de la anterior, y la razón de ser del panel: la alerta sin
    // el camino a la acción es solo una mala noticia.
    vi.mocked(obtenerTablero).mockResolvedValue(
      tablero({
        atrasadas: [
          {
            id: "a7",
            curso_titulo: "Trabajo en alturas",
            fecha_objetivo: "2026-08-01",
            en_curso: 2,
            sin_empezar: 3,
          },
        ],
      })
    );
    montar();

    expect(
      await screen.findByText(/Pasó la fecha objetivo y queda gente/)
    ).toBeInTheDocument();
    expect(screen.getByText("Trabajo en alturas")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Ver quién falta" })).toHaveAttribute(
      "href",
      "/capacitaciones/asignaciones/a7/avance"
    );
  });
});
