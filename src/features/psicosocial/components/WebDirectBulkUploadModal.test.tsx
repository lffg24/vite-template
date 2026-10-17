import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  importWebDirectBulkParticipants,
  previewWebDirectBulkImport,
} from "@/features/psicosocial/api/psicoAccessService";
import { WebDirectBulkUploadModal } from "./WebDirectBulkUploadModal";

vi.mock("@/features/psicosocial/api/psicoAccessService", () => ({
  previewWebDirectBulkImport: vi.fn(),
  importWebDirectBulkParticipants: vi.fn(),
}));

const previewImport = vi.mocked(previewWebDirectBulkImport);
const importParticipants = vi.mocked(importWebDirectBulkParticipants);

describe("WebDirectBulkUploadModal", () => {
  beforeEach(() => {
    previewImport.mockReset();
    importParticipants.mockReset();
  });

  it("importa el formulario validado en la plantilla después de certificar los datos", async () => {
    previewImport.mockResolvedValue({
      ok: true,
      total_rows: 1,
      valid_rows: 1,
      errors: [],
      preview: [{
        row: 2,
        nombres: "Ana María",
        apellidos: "Pérez López",
        tipo_documento: "CC",
        numero_documento: "123456789",
        fecha_nacimiento: "1990-05-12",
        forma_asignada: "A",
      }],
    });
    importParticipants.mockResolvedValue({
      ok: true,
      aplicacion_id: 7,
      participantes_habilitados: 1,
      creados: 1,
      actualizados: 0,
      public_url: "https://abril360.relconsilium.com/public/psychosocial/token",
    });
    const onOpenChange = vi.fn();
    const onConfigured = vi.fn();
    render(
      <WebDirectBulkUploadModal
        applicationId={7}
        open
        onOpenChange={onOpenChange}
        onConfigured={onConfigured}
      />,
    );

    const file = new File(["content"], "participantes.xlsx", {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    fireEvent.change(screen.getByLabelText(/Selecciona el archivo diligenciado/i), {
      target: { files: [file] },
    });

    expect(await screen.findByText("Ana María Pérez López")).toBeInTheDocument();
    const submit = screen.getByRole("button", { name: /Certificar y generar enlace/i });
    expect(submit).toBeDisabled();

    expect(screen.queryByLabelText("Aplicar forma a todos")).not.toBeInTheDocument();
    expect(screen.getByText("Forma A")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("checkbox", { name: /Certifico que los datos/i }));
    expect(submit).toBeEnabled();
    fireEvent.click(submit);

    await waitFor(() => expect(importParticipants).toHaveBeenCalledWith(7, [{
      row: 2,
      nombres: "Ana María",
      apellidos: "Pérez López",
      tipo_documento: "CC",
      numero_documento: "123456789",
      fecha_nacimiento: "1990-05-12",
      forma_asignada: "A",
    }], true));
    expect(onConfigured).toHaveBeenCalledWith(expect.objectContaining({ participantes_habilitados: 1 }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
