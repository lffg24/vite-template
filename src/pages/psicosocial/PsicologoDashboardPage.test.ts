import { describe, expect, it } from "vitest";
import { CREDIT_PURCHASE_WHATSAPP_URL } from "./PsicologoDashboardPage";

describe("PsicologoDashboardPage", () => {
  it("expone el enlace comercial de compra de creditos por WhatsApp", () => {
    expect(CREDIT_PURCHASE_WHATSAPP_URL).toBe("https://wa.me/573002458438");
  });
});
