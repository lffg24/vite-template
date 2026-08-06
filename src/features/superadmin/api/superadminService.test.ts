import { afterEach, describe, expect, it, vi } from "vitest";

import { superadminService } from "./superadminService";

describe("superadmin service", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("usa endpoints aislados para editar psicologo y reiniciar contraseña", async () => {
    const calls: Array<{ url: string; init?: RequestInit }> = [];
    vi.spyOn(globalThis, "fetch").mockImplementation(async (url, init) => {
      calls.push({ url: String(url), init });
      return new Response(JSON.stringify({ ok: true, item: {}, message: "ok" }), { status: 200 });
    });

    await superadminService.updatePsicologo(9, {
      nombre: "Psicologa Demo",
      email: "demo@example.com",
      empresa_ids: [],
    });
    await superadminService.resetPsicologoPassword(9, {
      password: "TemporalSeguro!2026",
      confirm_password: "TemporalSeguro!2026",
    });

    expect(calls[0].url).toContain("/superadmin/psicologos/9");
    expect(calls[0].init?.method).toBe("PUT");
    expect(String(calls[0].init?.body)).not.toContain("password");
    expect(calls[1].url).toContain("/superadmin/psicologos/9/password-reset");
    expect(calls[1].init?.method).toBe("POST");
    expect(String(calls[1].init?.body)).toContain("TemporalSeguro!2026");
  });

  it("usa endpoints separados para asignar y descontar creditos", async () => {
    const calls: Array<{ url: string; init?: RequestInit }> = [];
    vi.spyOn(globalThis, "fetch").mockImplementation(async (url, init) => {
      calls.push({ url: String(url), init });
      return new Response(JSON.stringify({ ok: true, saldo_nuevo: 7 }), { status: 200 });
    });

    await superadminService.assignCredits({
      psicologo_usuario_id: 9,
      cantidad: 3,
      descripcion: "Compra QA",
    });
    await superadminService.deductCredits({
      psicologo_usuario_id: 9,
      cantidad: 2,
      descripcion: "Ajuste QA",
    });

    expect(calls[0].url).toContain("/superadmin/creditos/asignar");
    expect(calls[0].init?.method).toBe("POST");
    expect(calls[1].url).toContain("/superadmin/creditos/descontar");
    expect(calls[1].init?.method).toBe("POST");
  });
});
