import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";
import { listarContextos } from "@/services/cxContextosService";
import ContextosCxPage from "./ContextosCxPage";

vi.mock("@/services/cxContextosService", () => ({
  listarContextos: vi.fn(),
  crearSede: vi.fn(), crearServicio: vi.fn(), editarSede: vi.fn(), editarServicio: vi.fn(),
  cambiarEstadoContexto: vi.fn(), listarServiciosDeSede: vi.fn(),
  vincularServicio: vi.fn(), desvincularServicio: vi.fn(),
}));
vi.mock("@/hooks/use-toast", () => ({ useToast: () => ({ toast: vi.fn() }) }));

beforeEach(() => vi.clearAllMocks());

it("muestra el estado vacío del catálogo y cambia de sedes a servicios", async () => {
  vi.mocked(listarContextos).mockResolvedValue({ items: [], siguiente_cursor: null });
  render(<ContextosCxPage />);
  expect(await screen.findByText("No hay sedes para este filtro.")).toBeInTheDocument();
  expect(listarContextos).toHaveBeenCalledWith("sedes", expect.objectContaining({ activo: true, limite: 20 }));

  fireEvent.click(screen.getByRole("button", { name: "Servicios" }));
  expect(await screen.findByText("No hay servicios para este filtro.")).toBeInTheDocument();
  expect(listarContextos).toHaveBeenCalledWith("servicios", expect.objectContaining({ cursor: null }));
});

it("expone el error real y permite reintentar", async () => {
  vi.mocked(listarContextos).mockRejectedValueOnce(new Error("No tienes permiso CX"))
    .mockResolvedValueOnce({ items: [], siguiente_cursor: null });
  render(<ContextosCxPage />);
  expect(await screen.findByRole("alert")).toHaveTextContent("No tienes permiso CX");
  fireEvent.click(screen.getByRole("button", { name: "Reintentar" }));
  await waitFor(() => expect(screen.getByText("No hay sedes para este filtro.")).toBeInTheDocument());
});
