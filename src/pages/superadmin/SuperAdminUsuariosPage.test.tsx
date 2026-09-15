import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import SuperAdminUsuariosPage from "./SuperAdminUsuariosPage";

const toast = vi.fn();
const api = vi.hoisted(() => ({
  usuarios: vi.fn(),
  todasEmpresas: vi.fn(),
  roles: vi.fn(),
  invitar: vi.fn(),
  previewAsignacion: vi.fn(),
  guardarAsignacion: vi.fn(),
  reenviarInvitacion: vi.fn(),
  crearMembresia: vi.fn(),
}));

vi.mock("@/hooks/use-toast", () => ({ useToast: () => ({ toast }) }));
vi.mock("@/services/accesoService", () => ({ accesoService: api }));

describe("SuperAdminUsuariosPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.usuarios.mockResolvedValue({ items: [], hay_mas: false });
    api.todasEmpresas.mockResolvedValue({
      items: [
        { id: "empresa-1", nombre: "Acme Colombia" },
        { id: "empresa-2", nombre: "Beta SAS" },
      ],
      hay_mas: false,
    });
    api.roles.mockResolvedValue({
      items: [{ id: 7, codigo: "IAM_COORD", nombre: "Coordinador", version: 1, permisos: ["hseq.capacitacion.asignar"] }],
      hay_mas: false,
    });
  });

  it("elige la empresa dentro del listado y asigna el rol en la misma invitación", async () => {
    api.invitar.mockResolvedValue({ id: 19, estado: "PENDIENTE", entrega: "EN_COLA" });
    api.previewAsignacion.mockResolvedValue({ huella: "huella", antes: null, despues: {} });
    api.guardarAsignacion.mockResolvedValue({ ok: true });

    render(<MemoryRouter><SuperAdminUsuariosPage /></MemoryRouter>);
    fireEvent.click(screen.getByRole("button", { name: "Invitar usuario" }));

    await screen.findByRole("option", { name: "Acme Colombia" });
    fireEvent.change(screen.getByLabelText("Nombre"), { target: { value: "Ana Pérez" } });
    fireEvent.change(screen.getByLabelText("Correo"), { target: { value: "ana@example.com" } });
    fireEvent.change(screen.getByLabelText("Buscar dentro del listado de empresas"), { target: { value: "Acme" } });
    fireEvent.click(await screen.findByRole("option", { name: "Acme Colombia" }));
    fireEvent.click(screen.getByRole("checkbox", { name: /Coordinador/ }));
    fireEvent.click(screen.getByRole("button", { name: "Crear invitación" }));

    await waitFor(() => expect(api.invitar).toHaveBeenCalledWith({
      nombre: "Ana Pérez",
      email: "ana@example.com",
      empresa_id: "empresa-1",
    }));
    expect(api.previewAsignacion).toHaveBeenCalledWith(expect.objectContaining({
      rol_id: 7,
      usuario_id: 19,
      empresa_id: "empresa-1",
    }));
    expect(await screen.findByRole("dialog", { name: "La cuenta está lista para activarse" })).toBeInTheDocument();
  });

  it("explica la activación local y ofrece abrir el enlace de prueba", async () => {
    api.invitar.mockResolvedValue({
      id: 20,
      estado: "PENDIENTE",
      entrega: "LOCAL",
      enlace_activacion_local: "http://127.0.0.1:5173/activar-cuenta?token=secreto",
    });

    render(<MemoryRouter><SuperAdminUsuariosPage /></MemoryRouter>);
    fireEvent.click(screen.getByRole("button", { name: "Invitar usuario" }));
    await screen.findByRole("option", { name: "Acme Colombia" });
    fireEvent.change(screen.getByLabelText("Nombre"), { target: { value: "Luis Prueba" } });
    fireEvent.change(screen.getByLabelText("Correo"), { target: { value: "luis@example.com" } });
    fireEvent.click(screen.getByRole("option", { name: "Acme Colombia" }));
    fireEvent.click(screen.getByRole("button", { name: "Crear invitación" }));

    expect(await screen.findByText(/Estás en el entorno local/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Abrir activación/ })).toHaveAttribute(
      "href",
      "http://127.0.0.1:5173/activar-cuenta?token=secreto",
    );
  });
});
