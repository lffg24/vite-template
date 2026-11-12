import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, expect, it, vi } from "vitest";
import { listarAreasCx } from "@/services/cxAreasService";
import AreasCxPage from "./AreasCxPage";

vi.mock("@/services/cxAreasService", () => ({
  listarAreasCx: vi.fn(), crearAreaCx: vi.fn(), editarAreaCx: vi.fn(), cambiarEstadoAreaCx: vi.fn(),
}));
vi.mock("@/hooks/use-toast", () => ({ useToast: () => ({ toast: vi.fn() }) }));
beforeEach(() => vi.clearAllMocks());

it("explica el vacío y mantiene el catálogo compartido accesible", async () => {
  vi.mocked(listarAreasCx).mockResolvedValue({ items: [], siguiente_cursor: null });
  render(<MemoryRouter><AreasCxPage /></MemoryRouter>);
  expect(await screen.findByText("No hay áreas para este filtro.")).toBeInTheDocument();
  expect(listarAreasCx).toHaveBeenCalledWith(expect.objectContaining({ activo: true, limite: 20 }));
  fireEvent.click(screen.getByRole("button", { name: /Nueva área/ }));
  expect(screen.getByText("Esta área también forma parte del catálogo compartido de tu empresa.")).toBeInTheDocument();
});

it("muestra error de API y permite reintento", async () => {
  vi.mocked(listarAreasCx).mockRejectedValueOnce(new Error("Sin permiso CX"))
    .mockResolvedValueOnce({ items: [], siguiente_cursor: null });
  render(<MemoryRouter><AreasCxPage /></MemoryRouter>);
  expect(await screen.findByRole("alert")).toHaveTextContent("Sin permiso CX");
  fireEvent.click(screen.getByRole("button", { name: "Reintentar" }));
  await waitFor(() => expect(screen.getByText("No hay áreas para este filtro.")).toBeInTheDocument());
});
