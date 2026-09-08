import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

import FinalizarPage from "./FinalizarPage";
import { finalizar, miCurso } from "@/services/participacionService";
import type { EstadoCurso } from "@/types/participacion";

vi.mock("@/services/participacionService", () => ({
  finalizar: vi.fn(),
  miCurso: vi.fn(),
}));

function curso(over: Partial<EstadoCurso> = {}): EstadoCurso {
  return {
    inscripcion_id: "i1",
    estado: "COMPLETADA",
    curso: "Trabajo en alturas",
    numero_version: 3,
    obligatorias_totales: 2,
    obligatorias_completas: 2,
    puede_finalizar: true,
    lecciones: [],
    ...(over as EstadoCurso),
  } as EstadoCurso;
}

const CONSTANCIA = {
  folio: 12,
  codigo_verificacion: "ABCD-2345",
  vence_el: "2027-05-10",
};

function montar() {
  return render(
    <MemoryRouter>
      <FinalizarPage />
    </MemoryRouter>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("cuando se vuelve a una inscripción ya completada", () => {
  it("recupera el folio y el código", async () => {
    // Otro dispositivo, o la pestaña reabierta: no hay resultado en memoria. Se
    // vuelve a llamar a `finalizar`, que es idempotente.
    vi.mocked(miCurso).mockResolvedValue(curso());
    vi.mocked(finalizar).mockResolvedValue({
      estado: "COMPLETADA",
      asistencia_id: null,
      nueva: false,
      constancia: CONSTANCIA,
    });

    montar();

    expect(await screen.findByText("ABCD-2345")).toBeInTheDocument();
    expect(screen.getByText(/N.º 12/)).toBeInTheDocument();
  });

  it("si esa consulta falla, ofrece reintentar en vez de quedarse esperando", async () => {
    // Antes el error se tragaba y la pantalla decía «Preparando tu constancia…»
    // para siempre: quien acababa de terminar veía un texto que prometía algo
    // que ya no iba a llegar, y nada que pulsar.
    vi.mocked(miCurso).mockResolvedValue(curso());
    vi.mocked(finalizar).mockRejectedValue(new Error("red caída"));

    montar();

    expect(
      await screen.findByRole("button", { name: /volver a intentarlo/i })
    ).toBeInTheDocument();
    expect(screen.queryByText(/preparando tu constancia/i)).not.toBeInTheDocument();
  });

  it("ese error dice que la asistencia SÍ quedó registrada", async () => {
    // Sin esa distinción, quien lo lea creerá que hay que repetir el curso.
    vi.mocked(miCurso).mockResolvedValue(curso());
    vi.mocked(finalizar).mockRejectedValue(new Error("red caída"));

    montar();
    await screen.findByRole("button", { name: /volver a intentarlo/i });

    expect(screen.getByText(/tu asistencia sí quedó/i)).toBeInTheDocument();
  });

  it("el reintento vuelve a pedirla, y no se reintenta solo antes", async () => {
    // El bucle es el riesgo opuesto: marcar el fallo re-dispara el efecto y sale
    // una ráfaga contra un endpoint con límite. Volver a intentarlo es decisión
    // de la persona.
    vi.mocked(miCurso).mockResolvedValue(curso());
    vi.mocked(finalizar).mockRejectedValueOnce(new Error("red caída"));

    montar();
    const boton = await screen.findByRole("button", { name: /volver a intentarlo/i });
    expect(finalizar).toHaveBeenCalledTimes(1);

    vi.mocked(finalizar).mockResolvedValue({
      estado: "COMPLETADA",
      asistencia_id: null,
      nueva: false,
      constancia: CONSTANCIA,
    });
    fireEvent.click(boton);

    expect(await screen.findByText("ABCD-2345")).toBeInTheDocument();
    expect(finalizar).toHaveBeenCalledTimes(2);
  });
});

describe("lo que la pantalla promete", () => {
  it("no ofrece descargar un PDF que no existe", async () => {
    // La librería sigue sin aprobarse. Un botón que no hiciera nada sería peor
    // que decir dónde está el límite.
    vi.mocked(miCurso).mockResolvedValue(curso());
    vi.mocked(finalizar).mockResolvedValue({
      estado: "COMPLETADA",
      asistencia_id: null,
      nueva: false,
      constancia: CONSTANCIA,
    });

    const { container } = montar();
    await screen.findByText("ABCD-2345");

    expect(screen.queryByRole("button", { name: /descargar|pdf/i })).not.toBeInTheDocument();
    expect(container.textContent ?? "").not.toMatch(/descargable/i);
  });
});
