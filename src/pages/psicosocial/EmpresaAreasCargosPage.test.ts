import { describe, expect, it } from "vitest";
import { paginateCatalogItems } from "./EmpresaAreasCargosPage";

describe("EmpresaAreasCargosPage pagination", () => {
  it("pagina catalogos y ajusta paginas fuera de rango", () => {
    const items = Array.from({ length: 23 }, (_, index) => index + 1);

    expect(paginateCatalogItems(items, 2, 10)).toEqual({
      currentPage: 2,
      items: [11, 12, 13, 14, 15, 16, 17, 18, 19, 20],
    });
    expect(paginateCatalogItems(items, 9, 10)).toEqual({
      currentPage: 3,
      items: [21, 22, 23],
    });
  });
});
