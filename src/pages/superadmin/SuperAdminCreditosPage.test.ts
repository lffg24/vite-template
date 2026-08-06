import { describe, expect, it } from "vitest";
import { creditLoadErrorMessage } from "./SuperAdminCreditosPage";

describe("SuperAdminCreditosPage", () => {
  it("normaliza mensajes de error de carga obligatoria", () => {
    expect(creditLoadErrorMessage(new Error("HTTP 500"))).toBe("HTTP 500");
    expect(creditLoadErrorMessage("fallo")).toBe("No fue posible cargar créditos.");
  });
});
