import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import ReportesOficialesPsicoPage from "./ReportesOficialesPsicoPage";

vi.mock("@/services/psicoReportesOficialesService", () => ({
  listarAplicacionesReportesOficiales: vi.fn().mockResolvedValue([]),
  obtenerHtmlReporteOficial: vi.fn(),
  descargarDocReporteOficial: vi.fn(),
  descargarPdfReporteOficial: vi.fn(),
  descargarXlsxReporteOficial: vi.fn(),
}));

describe("official report downloads", () => {
  it("ofrece DOC y PDF sin exponer descarga HTML", async () => {
    render(
      <MemoryRouter>
        <ReportesOficialesPsicoPage />
      </MemoryRouter>,
    );

    expect(await screen.findByRole("button", { name: /DOC editable/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /PDF directo/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^HTML$/i })).not.toBeInTheDocument();
  });

  it("explica desde el icono de información el alcance de todos los entregables", async () => {
    render(
      <MemoryRouter>
        <ReportesOficialesPsicoPage />
      </MemoryRouter>,
    );

    fireEvent.click(await screen.findByRole("button", { name: /Ver información del informe seleccionado/i }));

    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Informes base")).toBeInTheDocument();
    expect(screen.getByText("Informes BTR con análisis")).toBeInTheDocument();
    expect(screen.getByText("Informes complementarios y datos")).toBeInTheDocument();
    expect(screen.getByText("Informe BTR · Transversal A+B")).toBeInTheDocument();
    expect(screen.getByText(/análisis NeuroMapa por dominio y dimensión/i)).toBeInTheDocument();
    expect(screen.getByText(/no clasifica por sí mismo el riesgo psicosocial/i)).toBeInTheDocument();
  });
});
