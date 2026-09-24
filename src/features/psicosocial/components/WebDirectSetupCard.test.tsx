import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { configureWebDirectAccess } from "@/features/psicosocial/api/psicoAccessService";
import { WebDirectSetupCard } from "./WebDirectSetupCard";

vi.mock("@/features/psicosocial/api/psicoAccessService", () => ({
  configureWebDirectAccess: vi.fn(),
}));

const configure = vi.mocked(configureWebDirectAccess);
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
  beforeEach(() => configure.mockReset());

  it("exige fecha y forma antes de habilitar la generación", async () => {
    configure.mockResolvedValue({
      ok: true,
      aplicacion_id: 7,
      participantes_habilitados: 1,
      public_url: "https://abril360.relconsilium.com/public/psychosocial/token",
    });
    render(<WebDirectSetupCard applicationId={7} employees={employees} />);

    const generate = screen.getByRole("button", { name: /Generar enlace/i });
    expect(generate).toBeDisabled();
    fireEvent.click(screen.getByRole("checkbox"));
    expect(generate).toBeDisabled();
    fireEvent.change(screen.getByLabelText("Fecha de nacimiento"), { target: { value: "1990-04-03" } });
    fireEvent.change(screen.getByLabelText("Forma asignada"), { target: { value: "B" } });
    expect(generate).toBeEnabled();

    fireEvent.click(generate);
    await waitFor(() => expect(configure).toHaveBeenCalledWith(7, [{
      empleado_id: 11,
      fecha_nacimiento: "1990-04-03",
      forma_asignada: "B",
    }]));
    expect(await screen.findByDisplayValue(/public\/psychosocial\/token/)).toBeInTheDocument();
  });
});
