import { beforeEach, expect, it, vi } from "vitest";
import { api } from "@/lib/apiClient";
import { guardarAreasServicioCx, listarAreasCx, obtenerAreasServicioCx } from "./cxAreasService";

vi.mock("@/lib/apiClient", () => ({ api: { get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn() } }));
beforeEach(() => vi.clearAllMocks());

it("lista áreas por cursor sin tomar empresa del navegador", async () => {
  vi.mocked(api.get).mockResolvedValueOnce({ data: { items: [], siguiente_cursor: null } });
  await listarAreasCx({ buscar: "Calidad", activo: true, cursor: 10, limite: 20 });
  expect(api.get).toHaveBeenCalledWith("/cx/catalogos/areas", {
    params: { buscar: "Calidad", activo: true, cursor: 10, limite: 20 },
  });
});

it("guarda la responsabilidad en una sola solicitud y propaga conflictos", async () => {
  vi.mocked(api.put).mockRejectedValueOnce({ response: { status: 409, data: { detail: "Área duplicada" } } });
  await expect(guardarAreasServicioCx("servicio-1", { principal_area_id: 1, colaboradora_area_ids: [2] }))
    .rejects.toMatchObject({ status: 409, message: "Área duplicada" });
  expect(api.put).toHaveBeenCalledWith("/cx/catalogos/servicios/servicio-1/areas", {
    principal_area_id: 1, colaboradora_area_ids: [2],
  });
});

it("propaga falta de permiso al consultar responsabilidad", async () => {
  vi.mocked(api.get).mockRejectedValueOnce({ response: { status: 403, data: { detail: "Sin permiso CX" } } });
  await expect(obtenerAreasServicioCx("servicio-1"))
    .rejects.toMatchObject({ status: 403, message: "Sin permiso CX" });
});
