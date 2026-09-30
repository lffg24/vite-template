import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  getWebDirectStatus,
  regenerateWebDirectAccess,
} from "@/features/psicosocial/api/psicoAccessService";

import { WebDirectSetupCard } from "./WebDirectSetupCard";

vi.mock("@/features/psicosocial/api/psicoAccessService", () => ({
  getWebDirectStatus: vi.fn(),
  regenerateWebDirectAccess: vi.fn(),
  previewWebDirectBulkImport: vi.fn(),
  importWebDirectBulkParticipants: vi.fn(),
}));

const getStatus = vi.mocked(getWebDirectStatus);
const regenerate = vi.mocked(regenerateWebDirectAccess);

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
  beforeEach(() => {
    getStatus.mockReset();
    regenerate.mockReset();
    getStatus.mockResolvedValue({
      ok: true,
      configurado: false,
      activo: false,
      enlace_generado_en: null,
      datos_certificados_en: null,
      participantes_habilitados: 0,
    });
  });

  it("ofrece un único recorrido de carga y elimina la captura manual duplicada", async () => {
    render(<WebDirectSetupCard applicationId={7} employees={employees} />);

    await screen.findByText(/completa los seis datos obligatorios/i);

    expect(screen.queryByLabelText("Fecha de nacimiento")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Forma asignada")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^Generar enlace$/i })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Carga masiva virtual/i }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText(/Formulario A\/B/i)).toBeInTheDocument();
  });

  it("muestra el estado persistido y regenera el token conservando las asignaciones", async () => {
    getStatus.mockResolvedValue({
      ok: true,
      configurado: true,
      activo: true,
      enlace_generado_en: "2026-09-30T15:00:00Z",
      datos_certificados_en: "2026-09-24T12:00:00Z",
      participantes_habilitados: 4,
    });
    regenerate.mockResolvedValue({
      ok: true,
      aplicacion_id: 7,
      participantes_habilitados: 4,
      public_url: "https://abril360.relconsilium.com/public/psychosocial/new-token",
    });
    render(<WebDirectSetupCard applicationId={7} employees={employees} />);

    expect(await screen.findByText("Enlace virtual activo")).toBeInTheDocument();
    expect(screen.getByText(/4 colaborador\(es\) habilitados/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Regenerar enlace/i }));
    expect(screen.getByRole("alertdialog")).toBeInTheDocument();
    expect(screen.getByText(/enlace anterior dejará de funcionar/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Regenerar enlace" }));
    await waitFor(() => expect(regenerate).toHaveBeenCalledWith(7));
    expect(await screen.findByDisplayValue(/new-token/)).toBeInTheDocument();
  });
});
