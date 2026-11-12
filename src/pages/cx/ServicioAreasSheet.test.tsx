import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";
import { guardarAreasServicioCx, listarAreasCx, obtenerAreasServicioCx } from "@/services/cxAreasService";
import ServicioAreasSheet from "./ServicioAreasSheet";

vi.mock("@/services/cxAreasService", () => ({
  guardarAreasServicioCx: vi.fn(), listarAreasCx: vi.fn(), obtenerAreasServicioCx: vi.fn(),
}));
vi.mock("@/hooks/use-toast", () => ({ useToast: () => ({ toast: vi.fn() }) }));
beforeEach(() => vi.clearAllMocks());

it("edita principal y colaboradora en una operación", async () => {
  vi.mocked(obtenerAreasServicioCx).mockResolvedValue({ servicio_id: "s", principal_area_id: null, colaboradora_area_ids: [], items: [] });
  vi.mocked(listarAreasCx).mockResolvedValue({ items: [
    { id: 1, nombre: "Operaciones", descripcion: null, activo: true },
    { id: 2, nombre: "Calidad", descripcion: null, activo: true },
  ], siguiente_cursor: null });
  vi.mocked(guardarAreasServicioCx).mockResolvedValue({ servicio_id: "s", principal_area_id: 1, colaboradora_area_ids: [2], items: [] });
  const cerrar = vi.fn();
  render(<ServicioAreasSheet servicio={{ id: "s", codigo: "AT", nombre: "Atención", sector: null, activo: true, creado_en: "", actualizado_en: "" }} cerrar={cerrar} />);
  const principal = await screen.findByLabelText("Área principal");
  fireEvent.change(principal, { target: { value: "1" } });
  fireEvent.click(await screen.findByLabelText("Calidad"));
  fireEvent.click(screen.getByRole("button", { name: "Guardar áreas" }));
  await waitFor(() => expect(guardarAreasServicioCx).toHaveBeenCalledWith("s", {
    principal_area_id: 1, colaboradora_area_ids: [2],
  }));
  expect(cerrar).toHaveBeenCalled();
});
