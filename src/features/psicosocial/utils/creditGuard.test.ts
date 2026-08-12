import { describe, expect, it } from "vitest";
import { AbrilApiError } from "@/features/psicosocial/api/httpClient";
import { CREDIT_PURCHASE_WHATSAPP_URL, REL_PRIMARY_COLOR, getCreditGuardInfo } from "./creditGuard";

describe("creditGuard", () => {
  it("detecta errores de saldo insuficiente y expone el enlace comercial", () => {
    const info = getCreditGuardInfo(
      new AbrilApiError("CREDITOS_INSUFICIENTES", 402, {
        error: "CREDITOS_INSUFICIENTES",
        saldo_actual: 0,
        requeridos: 1,
        message: "No hay créditos disponibles.",
      }),
    );

    expect(info.isInsufficient).toBe(true);
    expect(info.saldoActual).toBe(0);
    expect(info.requeridos).toBe(1);
    expect(info.message).toBe("No hay créditos disponibles.");
    expect(CREDIT_PURCHASE_WHATSAPP_URL).toBe("https://wa.me/573002458438");
    expect(REL_PRIMARY_COLOR).toBe("#00b89f");
  });

  it("mantiene errores no relacionados como errores comunes", () => {
    const info = getCreditGuardInfo(new Error("Error inesperado"));

    expect(info.isInsufficient).toBe(false);
    expect(info.message).toBe("Error inesperado");
  });
});
