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
  await screen.findByText("Contrato vigente");
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
  it("separa acceso de empresa, plataforma y permisos personales", async () => {
    await elegirEmpresa();

    expect(await screen.findByText("Contrato vigente")).toBeInTheDocument();
    expect(screen.getByText("Asignaciones")).toBeInTheDocument();
    expect(screen.getByText("Acceso público encendido")).toBeInTheDocument();
    expect(screen.getByText("Permisos de las personas")).toBeInTheDocument();
    expect(screen.getByText(/La facturación y los pagos se gestionan fuera de ABRIL360/i)).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Roles y permisos" })
    ).toHaveAttribute("href", "/superadmin/roles-permisos");
  });

  it("explica cómo habilitar el acceso público", async () => {
    await elegirEmpresa();

    expect(
      await screen.findByText(/al abrirlo responde que no está habilitado para esta empresa/i)
    ).toBeInTheDocument();
  });

  it("registra las fechas y la referencia del contrato acordado externamente", async () => {
    await elegirEmpresa();
    fireEvent.change(screen.getByLabelText("Vigente desde"), { target: { value: "2026-11-12" } });
    fireEvent.change(screen.getByLabelText("Vigente hasta (opcional)"), { target: { value: "2027-11-11" } });
    fireEvent.change(screen.getByLabelText("Referencia del acuerdo (opcional)"), { target: { value: "Acuerdo 123" } });
    fireEvent.click(
      await screen.findByRole("button", { name: /registrar vigencia de capacitaciones/i })
    );

    await vi.waitFor(() => expect(crearContrato).toHaveBeenCalled());
    const [empresaId, datos] = vi.mocked(crearContrato).mock.calls[0];
    expect(empresaId).toBe("e1");
    expect(datos.modulo).toBe("CAPACITACIONES");
    expect(datos).toEqual({
      modulo: "CAPACITACIONES",
      vigencia_desde: "2026-11-12",
      vigencia_hasta: "2027-11-11",
      notas: "Acuerdo 123",
    });
  });

  it("rechaza una fecha de fin anterior al inicio", async () => {
    await elegirEmpresa();
    fireEvent.change(screen.getByLabelText("Vigente desde"), { target: { value: "2026-11-12" } });
    fireEvent.change(screen.getByLabelText("Vigente hasta (opcional)"), { target: { value: "2026-11-11" } });

    expect(screen.getByText(/fecha de fin debe ser igual o posterior/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /registrar vigencia de capacitaciones/i })).toBeDisabled();
    expect(crearContrato).not.toHaveBeenCalled();
  });

  it("muestra una función activada como pendiente si aún no existe contrato vigente", async () => {
    vi.mocked(obtenerHabilitacion).mockResolvedValue(estado({
      banderas: [
        { clave: "capacitaciones.asignacion", nombre: "Asignaciones", para_que: "Asignar cursos", efectiva: true },
        { clave: "capacitaciones.participacion", nombre: "Acceso público", para_que: "Entrar por enlace", efectiva: true },
      ],
    }));
    await elegirEmpresa();
    expect(screen.getByLabelText("Asignaciones para Constructora del Norte")).toBeChecked();
    expect(screen.getByLabelText("Acceso público para Constructora del Norte")).toBeChecked();
    expect(screen.getByText(/las funciones por sí solas no habilitan el acceso/i)).toBeInTheDocument();
  });

  it("no muestra ni opera datos de otra empresa mientras carga la selección", async () => {
    vi.mocked(superadminService.empresas).mockResolvedValue({
      ok: true,
      items: [
        { id: "e1", nombre: "Constructora del Norte", nit: "900123456" },
        { id: "e2", nombre: "Empresa del Sur", nit: "900999999" },
      ],
      total: 2,
      page: 1,
      page_size: 20,
    });
    let resolverSegunda: (valor: EstadoDeHabilitacion) => void = () => undefined;
    vi.mocked(obtenerHabilitacion).mockImplementation((empresaId) => empresaId === "e1"
      ? Promise.resolve(estado())
      : new Promise((resolve) => { resolverSegunda = resolve; }));

    await elegirEmpresa();
    fireEvent.click(screen.getByText("Empresa del Sur"));
    expect(screen.queryByText("Contrato y vigencia del módulo")).toBeNull();
    expect(screen.queryByRole("button", { name: /registrar vigencia de capacitaciones/i })).toBeNull();

    resolverSegunda(estado());
    expect(await screen.findByText("3. Vigencia técnica del módulo")).toBeInTheDocument();
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
    expect(screen.queryByRole("button", { name: /registrar vigencia de capacitaciones/i })).toBeNull();
  });

  it("no ofrece duplicar un contrato activo aunque sus fechas ya no estén vigentes", async () => {
    vi.mocked(obtenerHabilitacion).mockResolvedValue(estado({
      contratado: false,
      contratos: [{
        id: "c1", estado: "ACTIVO", vigencia_desde: "2020-01-01",
        vigencia_hasta: "2020-12-31", notas: null, vigente: false,
      }],
    }));
    await elegirEmpresa();
    expect(screen.queryByRole("button", { name: /registrar vigencia de capacitaciones/i })).toBeNull();
    expect(screen.getByText(/Existe un contrato activo fuera de vigencia/i)).toBeInTheDocument();
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

    fireEvent.click(screen.getByText("Configuración global del catálogo"));
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

    expect(await screen.findByLabelText("Calificación pública para Constructora del Norte")).toBeInTheDocument();
    expect(obtenerHabilitacion).toHaveBeenCalledWith("e1", "CX");
    expect(obtenerHabilitacionPlataforma).toHaveBeenCalledWith("CX");
    expect(screen.getByLabelText("Calificación pública para Constructora del Norte")).toBeInTheDocument();
    expect(screen.getByText("Protección pública configurada")).toBeInTheDocument();
    expect(screen.getByText(/Los enlaces permanecen cerrados/)).toBeInTheDocument();
    expect(screen.queryByText("Catálogo global de Capacitación")).toBeNull();
    expect(screen.getAllByRole("button", { name: /satisfacción del cliente/i })
      .some((button) => button.getAttribute("aria-pressed") === "true")).toBe(true);
  });

  it("expone la protección configurada sin afirmar que el contrato está vigente", async () => {
    vi.mocked(obtenerProteccionPublicaCx).mockResolvedValue(true);
    await elegirEmpresa();
    fireEvent.click(screen.getByRole("button", { name: /satisfacción del cliente/i }));

    expect(await screen.findByText(/El servidor confirma los límites de captura/)).toBeInTheDocument();
    expect(screen.getByText(/Falta registrar una vigencia técnica para este módulo/i)).toBeInTheDocument();
  });

  it("crea contrato y cambia bandera de CX sin enviar claves de Capacitaciones", async () => {
    await elegirEmpresa();
    fireEvent.click(screen.getByRole("button", { name: /satisfacción del cliente/i }));
    await screen.findByLabelText("Calificación pública para Constructora del Norte");
    fireEvent.change(screen.getByLabelText("Vigente desde"), { target: { value: "2026-11-23" } });
    fireEvent.click(await screen.findByRole("button", { name: /registrar vigencia de satisfacción del cliente/i }));
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
