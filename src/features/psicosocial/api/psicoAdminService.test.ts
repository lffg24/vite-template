import { beforeEach, describe, expect, it, vi } from "vitest";
import { psicoAdminService } from "./psicoAdminService";

describe("psicoAdminService.importarEmpleados", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("envía archivo como multipart sin forzar Content-Type JSON", async () => {
    const fetchMock = vi.spyOn(global, "fetch").mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          ok: true,
          dry_run: true,
          total_rows: 1,
          valid_rows: 1,
          created: 1,
          updated: 0,
          errors: [],
          preview: [],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ) as any,
    );
    const file = new File(["Cedula,Nombres\n"], "colaboradores.csv", { type: "text/csv" });

    await psicoAdminService.importarEmpleados("empresa-1", file, true);

    const [, init] = fetchMock.mock.calls[0];
    expect(init?.method).toBe("POST");
    expect(init?.body).toBeInstanceOf(FormData);
    expect((init?.headers as Record<string, string>)["X-Empresa-Id"]).toBe("empresa-1");
    expect((init?.headers as Record<string, string>)["Content-Type"]).toBeUndefined();
  });
});

describe("psicoAdminService áreas y cargos", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("consulta áreas y cargos inactivos solo cuando se solicita para administración", async () => {
    const fetchMock = vi.spyOn(global, "fetch").mockImplementation(async () => new Response(
      JSON.stringify({ ok: true, items: [] }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    ) as any);

    await psicoAdminService.listarAreas("empresa-1", true);
    await psicoAdminService.listarCargos("empresa-1", null, true);

    expect(String(fetchMock.mock.calls[0][0])).toContain("/psicosocial/admin/empresas/empresa-1/areas?include_inactive=true");
    expect(String(fetchMock.mock.calls[1][0])).toContain("/psicosocial/admin/empresas/empresa-1/cargos?include_inactive=true");
  });

  it("actualiza y elimina áreas/cargos con métodos HTTP explícitos", async () => {
    const fetchMock = vi.spyOn(global, "fetch").mockImplementation(async () => new Response(
      JSON.stringify({ ok: true, item: { id: 1, nombre: "Operaciones" } }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    ) as any);

    await psicoAdminService.actualizarArea("empresa-1", 10, { activo: false });
    await psicoAdminService.eliminarArea("empresa-1", 10);
    await psicoAdminService.actualizarCargo("empresa-1", 20, { nombre: "Analista", area_id: 10 });
    await psicoAdminService.eliminarCargo("empresa-1", 20);

    expect(fetchMock.mock.calls.map(([, init]) => init?.method)).toEqual(["PUT", "DELETE", "PUT", "DELETE"]);
  });
});
