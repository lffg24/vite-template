import { describe, expect, it } from "vitest";
import { creditLoadErrorMessage, validateCreditDeductionAmount } from "./SuperAdminCreditosPage";

describe("SuperAdminCreditosPage", () => {
  it("normaliza mensajes de error de carga obligatoria", () => {
    expect(creditLoadErrorMessage(new Error("HTTP 500"))).toBe("HTTP 500");
    expect(creditLoadErrorMessage("fallo")).toBe("No fue posible cargar créditos.");
  });

  it("valida descuentos de creditos contra el saldo disponible", () => {
    expect(validateCreditDeductionAmount("", 10)).toBe("Ingresa una cantidad entera mayor a cero.");
    expect(validateCreditDeductionAmount("1.5", 10)).toBe("Ingresa una cantidad entera mayor a cero.");
    expect(validateCreditDeductionAmount("11", 10)).toBe("No puedes descontar más créditos que el saldo disponible.");
    expect(validateCreditDeductionAmount("10", 10)).toBeNull();
  });
});
