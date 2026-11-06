import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  superadminService,
  type SuperEmpresa,
} from "@/features/superadmin/api/superadminService";
import SuperAdminEmpresasPage from "./SuperAdminEmpresasPage";

vi.mock("@/features/superadmin/api/superadminService", () => ({
  superadminService: {
    empresas: vi.fn(),
    createEmpresa: vi.fn(),
    updateEmpresa: vi.fn(),
  },
}));

const EMPRESA: SuperEmpresa = {
  id: "empresa-1",
  nombre: "Cliente Abril",
  razon_social: "Cliente Abril SAS",
  nit: "900123456-7",
  ciudad: "Bogotá",
  pais: "Colombia",
  empleados: 4,
  aplicaciones: 2,
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(superadminService.empresas).mockResolvedValue({
    ok: true,
    items: [EMPRESA],
    total: 1,
    page: 1,
    page_size: 10,
  });
  vi.mocked(superadminService.createEmpresa).mockResolvedValue({
    ok: true,
    item: EMPRESA,
  });
  vi.mocked(superadminService.updateEmpresa).mockResolvedValue({
    ok: true,
    item: EMPRESA,
  });
});

describe("SuperAdminEmpresasPage", () => {
  it("distingue la carga inicial del estado vacío", () => {
    vi.mocked(superadminService.empresas).mockReturnValue(
      new Promise(() => {}),
    );
    render(<SuperAdminEmpresasPage />);

    expect(screen.getByText("Cargando empresas…")).toBeInTheDocument();
    expect(
      screen.queryByText("Todavía no hay empresas"),
    ).not.toBeInTheDocument();
  });

  it("crea una empresa desde un panel accesible y vuelve a cargar el listado", async () => {
    render(<SuperAdminEmpresasPage />);
    expect((await screen.findAllByText("Cliente Abril")).length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole("button", { name: "Nueva empresa" }));
    expect(
      screen.getByRole("dialog", { name: "Nueva empresa" }),
    ).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Nombre visible *"), {
      target: { value: "Nueva compañía" },
    });
    fireEvent.change(screen.getByLabelText("NIT"), {
      target: { value: "901000111-2" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Crear empresa" }));

    await waitFor(() => {
      expect(superadminService.createEmpresa).toHaveBeenCalledWith(
        expect.objectContaining({
          nombre: "Nueva compañía",
          nit: "901000111-2",
        }),
      );
      expect(superadminService.empresas).toHaveBeenCalledTimes(2);
    });
  });

  it("edita la empresa por id en vez de crear un duplicado", async () => {
    render(<SuperAdminEmpresasPage />);
    expect((await screen.findAllByText("Cliente Abril")).length).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole("button", { name: "Editar" }));

    const nombre = screen.getByLabelText("Nombre visible *");
    expect(nombre).toHaveValue("Cliente Abril");
    fireEvent.change(nombre, {
      target: { value: "Cliente Abril actualizado" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Guardar cambios" }));

    await waitFor(() => {
      expect(superadminService.updateEmpresa).toHaveBeenCalledWith(
        "empresa-1",
        expect.objectContaining({ nombre: "Cliente Abril actualizado" }),
      );
      expect(superadminService.createEmpresa).not.toHaveBeenCalled();
    });
  });
});
