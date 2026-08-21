import { render, screen } from "@testing-library/react";
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
});
