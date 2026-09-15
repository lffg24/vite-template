import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

import SuperAdminHabilitacionPage from "./SuperAdminHabilitacionPage";
import { superadminService } from "@/features/superadmin/api/superadminService";
import {
  cambiarBandera,
  crearContrato,
  obtenerHabilitacion,
  type EstadoDeHabilitacion,
} from "@/services/habilitacionService";

vi.mock("@/features/superadmin/api/superadminService", () => ({
  superadminService: { empresas: vi.fn() },
}));

vi.mock("@/services/habilitacionService", () => ({
  obtenerHabilitacion: vi.fn(),
  crearContrato: vi.fn().mockResolvedValue(undefined),
  cambiarBandera: vi.fn().mockResolvedValue(undefined),
}));

const toast = vi.fn();
vi.mock("@/hooks/use-toast", () => ({ useToast: () => ({ toast }) }));

function estado(over: Partial<EstadoDeHabilitacion> = {}): EstadoDeHabilitacion {
  return {
    modulo: "CAPACITACIONES",
    contratos: [],
    contratado: false,
    banderas: [
      {
        clave: "capacitaciones.asignacion",
        nombre: "Asignaciones",
        para_que: "Asignar versiones a esta empresa.",
        efectiva: false,
      },
      {
        clave: "capacitaciones.participacion",
        nombre: "Acceso público",
        para_que: "Que su gente entre por el enlace sin cuenta.",
        efectiva: false,
      },
    ],
    ...over,
  };
}

async function elegirEmpresa() {
  render(
    <MemoryRouter>
      <SuperAdminHabilitacionPage />
    </MemoryRouter>
  );
  fireEvent.click(await screen.findByText("Constructora del Norte"));
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(superadminService.empresas).mockResolvedValue({
    ok: true,
    items: [{ id: "e1", nombre: "Constructora del Norte", nit: "900123456" }],
    total: 1,
    page: 1,
    page_size: 20,
  });
  vi.mocked(obtenerHabilitacion).mockResolvedValue(estado());
});

/**
 * Esta pantalla existe por un síntoma concreto: se creaba el curso, se asignaba,
 * se generaba el enlace, se repartía… y al abrirlo respondía «no está habilitado
 * para esta empresa». Habilitarla era SQL a mano.
 */
describe("Habilitar módulos", () => {
  it("nombra las TRES condiciones, incluida la que no administra", async () => {
    // Enseñar dos de tres deja a quien habilita creyendo que terminó, y el 403
    // que llega después parece una avería del sistema.
    await elegirEmpresa();

    expect(await screen.findByText("Contrato vigente")).toBeInTheDocument();
    expect(screen.getByText("Acceso público encendido")).toBeInTheDocument();
    expect(screen.getByText("Permiso de quien opera")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Roles y permisos" })
    ).toHaveAttribute("href", "/superadmin/roles-permisos");
  });

  it("explica QUÉ se rompe sin el acceso público", async () => {
    // Es exactamente el mensaje que recibió quien repartió el enlace.
    await elegirEmpresa();

    expect(
      await screen.findByText(/responde que no está habilitado para esta empresa/i)
    ).toBeInTheDocument();
  });

  it("activa el contrato de hoy en adelante", async () => {
    await elegirEmpresa();

    fireEvent.click(
      await screen.findByRole("button", { name: /activar desde hoy/i })
    );

    await vi.waitFor(() => expect(crearContrato).toHaveBeenCalled());
    const [empresaId, datos] = vi.mocked(crearContrato).mock.calls[0];
    expect(empresaId).toBe("e1");
    expect(datos.modulo).toBe("CAPACITACIONES");
    // Sin fecha de fin: es lo normal en un contrato vigente, y obligar a
    // inventarse un año produce vencimientos que nadie decidió.
    expect(datos.vigencia_hasta).toBeNull();
  });

  it("con contrato vigente NO ofrece crear otro", async () => {
    // Contraprueba. El motor solo admite uno activo por empresa y módulo, así
    // que ofrecerlo sería ofrecer un botón que devuelve un conflicto.
    vi.mocked(obtenerHabilitacion).mockResolvedValue(
      estado({
        contratado: true,
        contratos: [
          {
            id: "c1",
            estado: "ACTIVO",
            vigencia_desde: "2026-01-01",
            vigencia_hasta: null,
            notas: null,
            vigente: true,
          },
        ],
      })
    );
    await elegirEmpresa();

    await screen.findByText("Contrato vigente");
    expect(screen.queryByRole("button", { name: /activar desde hoy/i })).toBeNull();
  });

  it("enciende una funcionalidad para ESA empresa", async () => {
    await elegirEmpresa();

    fireEvent.click(
      await screen.findByLabelText("Acceso público para Constructora del Norte")
    );

    await vi.waitFor(() => expect(cambiarBandera).toHaveBeenCalled());
    expect(vi.mocked(cambiarBandera).mock.calls[0][1]).toEqual({
      modulo: "CAPACITACIONES",
      clave: "capacitaciones.participacion",
      habilitado: true,
    });
  });
});
