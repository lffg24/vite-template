import { beforeEach, describe, expect, it, vi } from "vitest";
import { descargarZipInformesIndividuales } from "./psicoInformesIndividualesService";

describe("psicoInformesIndividualesService.descargarZipInformesIndividuales", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    document.body.innerHTML = "";
    vi.stubGlobal("URL", {
      createObjectURL: vi.fn(() => "blob:zip"),
      revokeObjectURL: vi.fn(),
    });
  });

  it("envía selección explícita de informes y descarga el ZIP recibido", async () => {
    const click = vi.fn();
    const originalCreateElement = document.createElement.bind(document);
    vi.spyOn(document, "createElement").mockImplementation((tagName: string) => {
      const element = originalCreateElement(tagName);
      if (tagName.toLowerCase() === "a") {
        Object.defineProperty(element, "click", { value: click });
      }
      return element;
    });
    const fetchMock = vi.spyOn(global, "fetch").mockResolvedValueOnce(
      new Response(new Blob(["PK"], { type: "application/zip" }), {
        status: 200,
        headers: { "Content-Type": "application/zip" },
      }) as any,
    );

    await descargarZipInformesIndividuales(
      20,
      "doc",
      [{ empleado_id: 10, instrument_code: "PSICO_INTRA_A" }],
      "informes.zip",
    );

    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toContain("/psicosocial/aplicaciones/20/informes-individuales/zip");
    expect(init?.method).toBe("POST");
    expect(JSON.parse(String(init?.body))).toEqual({
      formato: "doc",
      items: [{ empleado_id: 10, instrument_code: "PSICO_INTRA_A" }],
    });
    expect(click).toHaveBeenCalled();
  });
});
