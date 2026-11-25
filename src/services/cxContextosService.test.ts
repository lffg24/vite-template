import { beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "@/lib/apiClient";
import { crearSede, listarContextos, vincularServicio } from "./cxContextosService";

vi.mock("@/lib/apiClient", () => ({ api: { get: vi.fn(), post: vi.fn(), put: vi.fn() } }));

beforeEach(() => vi.clearAllMocks());

describe("catálogos CX", () => {
  it("lista con límite y filtros sin enviar empresa desde el navegador", async () => {
    vi.mocked(api.get).mockResolvedValueOnce({ data: { items: [], siguiente_cursor: null } });
    await listarContextos("sedes", { buscar: "Centro", activo: true, cursor: "A", limite: 20 });
    expect(api.get).toHaveBeenCalledWith("/cx/catalogos/sedes", {
      params: { buscar: "Centro", activo: true, cursor: "A", limite: 20 },
    });
  });

  it("un conflicto de código conserva el estado 409 para el formulario", async () => {
    vi.mocked(api.post).mockRejectedValueOnce({ response: { status: 409, data: { detail: "Código duplicado" } } });
    await expect(crearSede({ codigo: "CENTRO", nombre: "Centro", zona_horaria: "America/Bogota" }))
      .rejects.toMatchObject({ status: 409, message: "Código duplicado" });
  });

  it("vincula por identificadores acotados sin meter tenant en el payload", async () => {
    vi.mocked(api.put).mockResolvedValueOnce({ data: { id: "v", servicio_id: "s" } });
    await vincularServicio("a", "s");
    expect(api.put).toHaveBeenCalledWith("/cx/catalogos/sedes/a/servicios/s");
  });
});
