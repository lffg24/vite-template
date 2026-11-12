import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, expect, it, vi } from "vitest";
import { crearEncuestaCx, listarEncuestasCx } from "@/services/cxEncuestasService";
import EncuestasCxPage from "./EncuestasCxPage";

vi.mock("@/services/cxEncuestasService", () => ({ listarEncuestasCx: vi.fn(), crearEncuestaCx: vi.fn() }));
beforeEach(() => vi.clearAllMocks());

it("explica vacío y permite crear instrumento con código y título", async () => {
  vi.mocked(listarEncuestasCx).mockResolvedValue({ items: [], siguiente_cursor: null });
  vi.mocked(crearEncuestaCx).mockResolvedValue({ id: "123", codigo: "CX-01", titulo: "Servicio", borrador: [], versiones: [] });
  render(<MemoryRouter initialEntries={["/cx/encuestas"]}><Routes><Route path="/cx/encuestas" element={<EncuestasCxPage />} /><Route path="/cx/encuestas/:id/editar" element={<p>Constructor abierto</p>} /></Routes></MemoryRouter>);
  expect(await screen.findByText("Aún no hay encuestas. Crea una para empezar.")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: /Nueva encuesta/ }));
  fireEvent.change(screen.getByLabelText("Código *"), { target: { value: "cx-01" } });
  fireEvent.change(screen.getByLabelText("Título *"), { target: { value: "Servicio" } });
  fireEvent.click(screen.getByRole("button", { name: "Crear" }));
  await waitFor(() => expect(crearEncuestaCx).toHaveBeenCalledWith({ codigo: "cx-01", titulo: "Servicio", items: [] }));
  expect(await screen.findByText("Constructor abierto")).toBeInTheDocument();
});

it("muestra fallo de API y ofrece reintentar", async () => {
  vi.mocked(listarEncuestasCx).mockRejectedValueOnce(new Error("Sin permiso CX"))
    .mockResolvedValueOnce({ items: [], siguiente_cursor: null });
  render(<MemoryRouter><EncuestasCxPage /></MemoryRouter>);
  expect(await screen.findByRole("alert")).toHaveTextContent("Sin permiso CX");
  fireEvent.click(screen.getByRole("button", { name: "Reintentar" }));
  expect(await screen.findByText("Aún no hay encuestas. Crea una para empezar.")).toBeInTheDocument();
});
