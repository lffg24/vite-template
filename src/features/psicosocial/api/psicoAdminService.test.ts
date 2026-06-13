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
