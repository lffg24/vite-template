import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { WebDirectSetupCard } from "./WebDirectSetupCard";

vi.mock("@/features/psicosocial/api/psicoAccessService", () => ({
  previewWebDirectBulkImport: vi.fn(),
  importWebDirectBulkParticipants: vi.fn(),
}));

const employees = [{
  id: 11,
  cedula: "123456",
  nombre: "Ana Pérez",
  cargo: "Coordinadora",
  area: "Operaciones",
  registrado: false,
  completo: false,
  instrumentos_registrados: [],
  instrumentos_pendientes: ["PSICO_INTRA_A", "PSICO_EXTRA", "PSICO_ESTRES"],
  total_instrumentos: 3,
  completados: 0,
}];

describe("WebDirectSetupCard", () => {
  it("ofrece un único recorrido de carga y elimina la captura manual duplicada", () => {
    render(<WebDirectSetupCard applicationId={7} employees={employees} />);

    expect(screen.queryByLabelText("Fecha de nacimiento")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Forma asignada")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^Generar enlace$/i })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Carga masiva virtual/i }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText(/Formulario A\/B/i)).toBeInTheDocument();
  });
});
