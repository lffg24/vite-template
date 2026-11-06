import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

import CapacitacionesMatrizPage, { detalleCelda } from "./CapacitacionesMatrizPage";
import { obtenerMatriz } from "@/services/capacitacionesService";
import { descargarCSV } from "@/shared/csv";
import type { MatrizCapacitacion } from "@/types/capacitaciones";

vi.mock("@/services/capacitacionesService", () => ({ obtenerMatriz: vi.fn() }));
vi.mock("@/shared/csv", () => ({ descargarCSV: vi.fn() }));
vi.mock("@/hooks/use-toast", () => ({ useToast: () => ({ toast: vi.fn() }) }));

const ALTURAS = "c-alturas";
const SST = "c-sst";

function matriz(over: Partial<MatrizCapacitacion> = {}): MatrizCapacitacion {
  return {
    cursos: [
      { curso_id: SST, titulo: "Inducción SST", categoria: "SST" },
      { curso_id: ALTURAS, titulo: "Trabajo en alturas", categoria: "SST" },
    ],
    filas: [
      {
        participante_id: "p1",
        nombres: "Ana María",
        apellidos: "Rodríguez",
        tipo_documento: "CC",
        numero_documento: "1018",
        cargo: "Analista",
        celdas: [
          { curso_id: SST, estado: "VIGENTE", vence_el: null },
          { curso_id: ALTURAS, estado: "VENCIDA", vence_el: "2026-09-01" },
        ],
        cumplidas: 1,
        aplicables: 2,
      },
      {
        participante_id: "p2",
        nombres: "Carlos",
        apellidos: "Méndez",
        tipo_documento: "CC",
        numero_documento: "5200",
        cargo: null,
        celdas: [{ curso_id: SST, estado: "POR_VENCER", vence_el: "2026-10-01" }],
        cumplidas: 1,
        aplicables: 1,
      },
    ],
    total: 2,
    pagina: 1,
    por_pagina: 10,
    resumen: { VIGENTE: 1, POR_VENCER: 1, VENCIDA: 1, EN_CURSO: 0, PENDIENTE: 0, ANULADA: 0 },
    dias_aviso: 60,
    ...over,
  };
}

function montar() {
  return render(
    <MemoryRouter>
      <CapacitacionesMatrizPage />
    </MemoryRouter>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("Matriz de capacitación", () => {
  it("cada cruce muestra el estado y la fecha que lo explica", async () => {
    vi.mocked(obtenerMatriz).mockResolvedValue(matriz());
    montar();

    // La tabla (escritorio) y las tarjetas (celular) se pintan las dos; el CSS
    // decide cuál se ve. Aquí se mira la tabla.
    const tabla = await screen.findByRole("table");
    const ana = within(tabla).getByText("Ana María Rodríguez").closest("tr")!;
    expect(within(ana).getByText("Vigente")).toBeInTheDocument();
    expect(within(ana).getByText("Vencida")).toBeInTheDocument();
    expect(within(ana).getByText(/Venció el/)).toBeInTheDocument();
    expect(within(ana).getByText("1/2")).toBeInTheDocument();

    // A Carlos nadie le pidió «Trabajo en alturas»: no aplica, no «pendiente».
    const carlos = within(tabla).getByText("Carlos Méndez").closest("tr")!;
    expect(within(carlos).getByText("No aplica")).toBeInTheDocument();
    expect(within(carlos).queryByText("Pendiente")).toBeNull();
  });

  it("el umbral de «por vencer» es el del SERVIDOR, no uno escrito aquí", async () => {
    vi.mocked(obtenerMatriz).mockResolvedValue(matriz({ dias_aviso: 45 }));
    montar();
    expect(await screen.findByText(/vence en 45 días o menos/)).toBeInTheDocument();
  });

  it("filtrar por estado vuelve a pedir la página 1 con ese estado", async () => {
    vi.mocked(obtenerMatriz).mockResolvedValue(matriz());
    montar();
    await screen.findByRole("table");

    fireEvent.click(screen.getByRole("button", { name: /^Vencida/ }));

    await waitFor(() =>
      expect(obtenerMatriz).toHaveBeenLastCalledWith(
        expect.objectContaining({ estado: "VENCIDA", pagina: 1 })
      )
    );
  });

  it("exporta TODAS las páginas, no solo la visible", async () => {
    const pagina1 = matriz({
      total: 51,
      filas: Array.from({ length: 50 }, (_, i) => ({
        ...matriz().filas[0],
        participante_id: `p${i}`,
      })),
    });
    const pagina2 = matriz({ total: 51, pagina: 2, filas: [matriz().filas[1]] });
    vi.mocked(obtenerMatriz)
      .mockResolvedValueOnce(matriz()) // la pantalla
      .mockResolvedValueOnce(pagina1)
      .mockResolvedValueOnce(pagina2);
    montar();
    await screen.findByRole("table");

    fireEvent.click(screen.getByRole("button", { name: /Exportar CSV/ }));

    await waitFor(() => expect(descargarCSV).toHaveBeenCalledTimes(1));
    const [, filas] = vi.mocked(descargarCSV).mock.calls[0];
    expect(filas).toHaveLength(1 + 51); // cabecera + todas las personas
    expect(filas[0]).toContain("Trabajo en alturas");
    // La celda del CSV dice lo mismo que la pantalla.
    // Columnas: 5 de la persona, luego los cursos en su orden (SST, alturas).
    expect(filas[1][5]).toBe("Vigente · No vence");
    expect(filas[1][6]).toMatch(/^Vencida · Venció el /);
  });

  it("sin nadie convocado explica cómo se llena, con su ilustración", async () => {
    vi.mocked(obtenerMatriz).mockResolvedValue(
      matriz({
        filas: [],
        total: 0,
        resumen: { VIGENTE: 0, POR_VENCER: 0, VENCIDA: 0, EN_CURSO: 0, PENDIENTE: 0, ANULADA: 0 },
      })
    );
    montar();
    expect(await screen.findByText("Todavía no hay a quién medir")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Exportar CSV/ })).toBeDisabled();
  });
});

describe("en el celular", () => {
  it("cada persona es una tarjeta con SOLO los cursos que se le pidieron", async () => {
    vi.mocked(obtenerMatriz).mockResolvedValue(matriz());
    montar();
    await screen.findByRole("table");

    const tarjetas = screen.getAllByRole("listitem").filter((li) => li.querySelector("ul"));
    const carlos = tarjetas.find((li) => li.textContent?.includes("Carlos Méndez"))!;
    expect(within(carlos).getByText("Inducción SST")).toBeInTheDocument();
    expect(within(carlos).getByText("Por vencer")).toBeInTheDocument();
    // En la tarjeta no se lista lo que no aplica.
    expect(within(carlos).queryByText("Trabajo en alturas")).toBeNull();
  });
});

describe("detalleCelda", () => {
  it("dice venció o vence según el estado, y «no vence» si no tiene fecha", () => {
    expect(detalleCelda({ curso_id: "x", estado: "VIGENTE", vence_el: null })).toBe("No vence");
    expect(detalleCelda({ curso_id: "x", estado: "VENCIDA", vence_el: "2026-01-02" })).toMatch(
      /^Venció el /
    );
    expect(detalleCelda({ curso_id: "x", estado: "POR_VENCER", vence_el: "2026-12-02" })).toMatch(
      /^Vence el /
    );
    expect(detalleCelda({ curso_id: "x", estado: "EN_CURSO", vence_el: null })).toBeNull();
  });
});
