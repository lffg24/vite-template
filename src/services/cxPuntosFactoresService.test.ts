import { beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "@/lib/apiClient";
import {
  cambiarEstadoCatalogoCx, crearCatalogoCx, guardarAplicabilidad,
  listarCatalogoCx, obtenerAplicabilidad,
} from "./cxPuntosFactoresService";

vi.mock("@/lib/apiClient", () => ({
  api: { get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn() },
}));

beforeEach(() => vi.clearAllMocks());

describe("configuración de puntos y factores CX", () => {
  it("pagina puntos con filtros y sin identificador de empresa enviado por el cliente", async () => {
    vi.mocked(api.get).mockResolvedValueOnce({ data: { items: [], siguiente_cursor: null } });
    await listarCatalogoCx("puntos", { buscar: "Caja", activo: true, cursor: "A", limite: 20 });
    expect(api.get).toHaveBeenCalledWith("/cx/catalogos/puntos", {
      params: { buscar: "Caja", activo: true, cursor: "A", limite: 20 },
    });
  });

  it("consulta subfactores siempre dentro de su factor", async () => {
    vi.mocked(api.get).mockResolvedValueOnce({ data: { items: [], siguiente_cursor: null } });
    await listarCatalogoCx("subfactores", { limite: 10 }, "factor-1");
    expect(api.get).toHaveBeenCalledWith("/cx/catalogos/factores/factor-1/subfactores", {
      params: { buscar: undefined, activo: undefined, cursor: undefined, limite: 10 },
    });
  });

  it("muestra el conflicto real de código duplicado y no da éxito falso", async () => {
    vi.mocked(api.post).mockRejectedValueOnce({ response: { status: 409, data: { detail: "Código duplicado" } } });
    await expect(crearCatalogoCx("factores", { codigo: "SERVICIO", nombre: "Servicio" }))
      .rejects.toMatchObject({ status: 409, message: "Código duplicado" });
  });

  it("cambia estado con baja lógica y guarda aplicabilidad por identificadores", async () => {
    vi.mocked(api.patch).mockResolvedValueOnce({ data: { id: "factor-1", activo: false } });
    vi.mocked(api.put).mockResolvedValueOnce({ data: { factor_id: "factor-1", sede_ids: ["s1"], servicio_ids: [] } });
    await cambiarEstadoCatalogoCx("factores", "factor-1", false);
    await guardarAplicabilidad("factor-1", { sede_ids: ["s1"], servicio_ids: [] });
    expect(api.patch).toHaveBeenCalledWith("/cx/catalogos/factores/factor-1/estado", { activo: false });
    expect(api.put).toHaveBeenCalledWith("/cx/catalogos/factores/factor-1/aplicabilidad", { sede_ids: ["s1"], servicio_ids: [] });
  });

  it("propaga un fallo de lectura de aplicabilidad", async () => {
    vi.mocked(api.get).mockRejectedValueOnce({ response: { status: 403, data: { detail: "Sin permiso CX" } } });
    await expect(obtenerAplicabilidad("factor-1"))
      .rejects.toMatchObject({ status: 403, message: "Sin permiso CX" });
  });
});
