import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, expect, it, vi } from "vitest";
import { editarEncuestaCx, obtenerEncuestaCx, publicarEncuestaCx } from "@/services/cxEncuestasService";
import ConstructorEncuestaCxPage from "./ConstructorEncuestaCxPage";

vi.mock("@/services/cxEncuestasService", () => ({
  obtenerEncuestaCx: vi.fn(), editarEncuestaCx: vi.fn(), publicarEncuestaCx: vi.fn(), clonarVersionCx: vi.fn(),
}));
beforeEach(() => vi.clearAllMocks());

const encuesta = { id: "123", codigo: "CX-01", titulo: "Servicio", borrador: [{ tipo: "CSAT" as const, enunciado: "¿Qué opinas?", obligatorio: true }], contacto: null, versiones: [] };

it("muestra la vista móvil y publica tras confirmación", async () => {
  vi.mocked(obtenerEncuestaCx).mockResolvedValue(encuesta);
  vi.mocked(publicarEncuestaCx).mockResolvedValue({ ...encuesta, borrador: [], versiones: [{ id: "v1", numero: 1, publicado_en: "2026-11-12T10:00:00Z", items: encuesta.borrador, contacto: null }] });
  render(<MemoryRouter initialEntries={["/cx/encuestas/123/editar"]}><Routes><Route path="/cx/encuestas/:id/editar" element={<ConstructorEncuestaCxPage />} /></Routes></MemoryRouter>);
  expect(await screen.findByText("Vista previa móvil")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Publicar versión" }));
  fireEvent.click(screen.getByRole("button", { name: "Publicar" }));
  await waitFor(() => expect(publicarEncuestaCx).toHaveBeenCalledWith("123"));
  expect(await screen.findByText(/Nueva versión publicada/)).toBeInTheDocument();
});

it("impide publicar cambios sin guardar y muestra error al guardar", async () => {
  vi.mocked(obtenerEncuestaCx).mockResolvedValue(encuesta);
  vi.mocked(editarEncuestaCx).mockRejectedValue(new Error("Sin permiso de edición"));
  render(<MemoryRouter initialEntries={["/cx/encuestas/123/editar"]}><Routes><Route path="/cx/encuestas/:id/editar" element={<ConstructorEncuestaCxPage />} /></Routes></MemoryRouter>);
  const input = await screen.findByLabelText("Título *");
  fireEvent.change(input, { target: { value: "Otro" } });
  expect(screen.getByRole("button", { name: "Publicar versión" })).toBeDisabled();
  fireEvent.click(screen.getByRole("button", { name: "Guardar borrador" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("Sin permiso de edición");
});

it("nace anónima y solo pide contacto si se activa a propósito", async () => {
  vi.mocked(obtenerEncuestaCx).mockResolvedValue(encuesta);
  vi.mocked(editarEncuestaCx).mockResolvedValue({ ...encuesta, contacto: { pide_telefono: true } });
  render(<MemoryRouter initialEntries={["/cx/encuestas/123/editar"]}><Routes><Route path="/cx/encuestas/:id/editar" element={<ConstructorEncuestaCxPage />} /></Routes></MemoryRouter>);

  const activar = await screen.findByRole("checkbox", { name: /pedir datos de contacto/i });
  expect(activar).not.toBeChecked();
  // Apagada, la opción del teléfono no existe: no hay configuración que tocar.
  expect(screen.queryByRole("checkbox", { name: /pedir también el teléfono/i })).toBeNull();

  fireEvent.click(activar);
  fireEvent.click(screen.getByRole("checkbox", { name: /pedir también el teléfono/i }));
  fireEvent.click(screen.getByRole("button", { name: "Guardar borrador" }));

  await waitFor(() => expect(editarEncuestaCx).toHaveBeenCalledWith("123", expect.objectContaining({
    contacto: { pide_telefono: true },
  })));
});

it("guarda null cuando la captura se apaga", async () => {
  vi.mocked(obtenerEncuestaCx).mockResolvedValue({ ...encuesta, contacto: { pide_telefono: false } });
  vi.mocked(editarEncuestaCx).mockResolvedValue(encuesta);
  render(<MemoryRouter initialEntries={["/cx/encuestas/123/editar"]}><Routes><Route path="/cx/encuestas/:id/editar" element={<ConstructorEncuestaCxPage />} /></Routes></MemoryRouter>);

  const activar = await screen.findByRole("checkbox", { name: /pedir datos de contacto/i });
  expect(activar).toBeChecked();
  fireEvent.click(activar);
  fireEvent.click(screen.getByRole("button", { name: "Guardar borrador" }));

  await waitFor(() => expect(editarEncuestaCx).toHaveBeenCalledWith("123", expect.objectContaining({
    contacto: null,
  })));
});
