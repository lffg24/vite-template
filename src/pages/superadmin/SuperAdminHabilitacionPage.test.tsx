import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

import SuperAdminHabilitacionPage from "./SuperAdminHabilitacionPage";
import { superadminService } from "@/features/superadmin/api/superadminService";
import {
  cambiarBandera,
  cambiarBanderaGlobal,
  crearContrato,
  obtenerHabilitacion,
  obtenerHabilitacionPlataforma,
  obtenerProteccionPublicaCx,
  suspenderContrato,
  type EstadoDeHabilitacion,
} from "@/services/habilitacionService";

vi.mock("@/features/superadmin/api/superadminService", () => ({
  superadminService: { empresas: vi.fn() },
}));

vi.mock("@/services/habilitacionService", () => ({
  obtenerHabilitacion: vi.fn(),
  obtenerHabilitacionPlataforma: vi.fn(),
  obtenerProteccionPublicaCx: vi.fn(),
  crearContrato: vi.fn().mockResolvedValue(undefined),
  cambiarBandera: vi.fn().mockResolvedValue(undefined),
  cambiarBanderaGlobal: vi.fn().mockResolvedValue(undefined),
  suspenderContrato: vi.fn().mockResolvedValue(undefined),
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

function estadoCx(over: Partial<EstadoDeHabilitacion> = {}): EstadoDeHabilitacion {
  return estado({
    modulo: "CX",
    banderas: [{
      clave: "cx.calificaciones.publico",
      nombre: "Calificación pública",
      para_que: "Permitir respuestas desde enlaces y QR.",
      efectiva: false,
    }],
    ...over,
  });
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
  vi.mocked(obtenerProteccionPublicaCx).mockResolvedValue(false);
  vi.mocked(superadminService.empresas).mockResolvedValue({
    ok: true,
    items: [{ id: "e1", nombre: "Constructora del Norte", nit: "900123456" }],
    total: 1,
    page: 1,
    page_size: 20,
  });
  vi.mocked(obtenerHabilitacion).mockImplementation(async (_id, modulo) =>
    modulo === "CX" ? estadoCx() : estado()
  );
  vi.mocked(obtenerHabilitacionPlataforma).mockImplementation(async (modulo) => ({
    modulo,
    banderas: modulo === "CAPACITACIONES" ? [{
      clave: "capacitaciones.catalogo",
      nombre: "Catálogo",
      para_que: "Redactar y publicar cursos.",
      efectiva: false,
      superficie: "PLATAFORMA",
      habilitado_global: false,
    }] : [],
  }));
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

  it("administra el catálogo con el control GLOBAL", async () => {
    await elegirEmpresa();

    fireEvent.click(await screen.findByLabelText("Catálogo global"));

    await vi.waitFor(() => expect(cambiarBanderaGlobal).toHaveBeenCalledWith({
      modulo: "CAPACITACIONES",
      clave: "capacitaciones.catalogo",
      habilitado: true,
    }));
    expect(cambiarBandera).not.toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ clave: "capacitaciones.catalogo" }),
    );
  });

  it("selecciona CX y consulta solo su habilitación sin mostrar el catálogo global de Capacitaciones", async () => {
    await elegirEmpresa();
    fireEvent.click(screen.getByRole("button", { name: /satisfacción del cliente/i }));

    expect(await screen.findByText("Esta empresa nunca ha tenido Satisfacción del cliente.")).toBeInTheDocument();
    expect(obtenerHabilitacion).toHaveBeenCalledWith("e1", "CX");
    expect(obtenerHabilitacionPlataforma).toHaveBeenCalledWith("CX");
    expect(screen.getByLabelText("Calificación pública para Constructora del Norte")).toBeInTheDocument();
    expect(screen.getByText("Protección pública configurada")).toBeInTheDocument();
    expect(screen.getByText(/Los enlaces permanecen cerrados/)).toBeInTheDocument();
    expect(screen.queryByText("Catálogo global de Capacitación")).toBeNull();
    expect(screen.getByRole("button", { name: /satisfacción del cliente/i })).toHaveAttribute("aria-pressed", "true");
  });

  it("expone la protección configurada sin afirmar que el contrato está vigente", async () => {
    vi.mocked(obtenerProteccionPublicaCx).mockResolvedValue(true);
    await elegirEmpresa();
    fireEvent.click(screen.getByRole("button", { name: /satisfacción del cliente/i }));

    expect(await screen.findByText(/El servidor confirma los límites de captura/)).toBeInTheDocument();
    expect(screen.getByText(/Sin contrato no se abre nada/)).toBeInTheDocument();
  });

  it("crea contrato y cambia bandera de CX sin enviar claves de Capacitaciones", async () => {
    await elegirEmpresa();
    fireEvent.click(screen.getByRole("button", { name: /satisfacción del cliente/i }));
    fireEvent.click(await screen.findByRole("button", { name: /activar desde hoy/i }));
    await vi.waitFor(() => expect(crearContrato).toHaveBeenCalledWith("e1", expect.objectContaining({ modulo: "CX" })));

    const bandera = screen.getByLabelText("Calificación pública para Constructora del Norte");
    await vi.waitFor(() => expect(bandera).not.toBeDisabled());
    fireEvent.click(bandera);
    await vi.waitFor(() => expect(cambiarBandera).toHaveBeenCalledWith("e1", {
      modulo: "CX", clave: "cx.calificaciones.publico", habilitado: true,
    }));
    expect(cambiarBanderaGlobal).not.toHaveBeenCalled();
  });

  it("suspende el contrato CX elegido sin tocar el contrato de Capacitaciones", async () => {
    vi.mocked(obtenerHabilitacion).mockImplementation(async (_id, modulo) =>
      modulo === "CX" ? estadoCx({
        contratado: true,
        contratos: [{ id: "contrato-cx", estado: "ACTIVO", vigencia_desde: "2026-01-01", vigencia_hasta: null, notas: null, vigente: true }],
      }) : estado()
    );
    await elegirEmpresa();
    fireEvent.click(screen.getByRole("button", { name: /satisfacción del cliente/i }));
    fireEvent.click(await screen.findByRole("button", { name: "Suspender contrato" }));
    fireEvent.click(screen.getByRole("button", { name: "Suspender contrato" }));

    await vi.waitFor(() => expect(suspenderContrato).toHaveBeenCalledWith("e1", "contrato-cx", "CX"));
  });

  it("mantiene el estado efectivo y muestra el error si falla el cambio de bandera", async () => {
    vi.mocked(cambiarBandera).mockRejectedValueOnce(new Error("Falló la operación"));
    await elegirEmpresa();
    fireEvent.click(screen.getByRole("button", { name: /satisfacción del cliente/i }));
    fireEvent.click(await screen.findByLabelText("Calificación pública para Constructora del Norte"));

    await vi.waitFor(() => expect(toast).toHaveBeenCalledWith(expect.objectContaining({
      variant: "destructive", description: "Falló la operación",
    })));
    expect(screen.getByLabelText("Calificación pública para Constructora del Norte")).toHaveAttribute("aria-checked", "false");
  });
});
