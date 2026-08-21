import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import PsicoEmpleadoInformesPage from "./PsicoEmpleadoInformesPage";

vi.mock("@/features/psicosocial/api/psicoInformesIndividualesService", () => ({
  obtenerInformesIndividuales: vi.fn().mockResolvedValue({
    empleado: { nombre_completo: "Persona Demo", cedula: "123", cargo: "Analista", area: "Talento" },
    aplicacion: { nombre: "Aplicacion Demo" },
    informes: [
      {
        instrument_code: "PSICO_INTRA_A",
        titulo: "Intralaboral Forma A",
        status: "AVAILABLE",
        available: true,
      },
    ],
  }),
  obtenerHtmlInformeIndividual: vi.fn().mockResolvedValue("<html><body>Vista previa</body></html>"),
  descargarInformeIndividualDoc: vi.fn(),
  descargarInformeIndividualPdf: vi.fn(),
}));

describe("individual report downloads", () => {
  it("ofrece DOC y PDF sin descarga HTML", async () => {
    render(
      <MemoryRouter initialEntries={["/psicosocial/empleados/1/aplicaciones/2/resultados"]}>
        <Routes>
          <Route
            path="/psicosocial/empleados/:empleadoId/aplicaciones/:aplicacionId/resultados"
            element={<PsicoEmpleadoInformesPage />}
          />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByRole("button", { name: /DOC editable/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /PDF directo/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^HTML$/i })).not.toBeInTheDocument();
  });
});
