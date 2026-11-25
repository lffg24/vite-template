import { beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "@/lib/apiClient";
import { closeDecision } from "./service";

vi.mock("@/lib/apiClient", () => ({
  api: {
    post: vi.fn(async () => ({ data: { ok: true } })),
  },
}));

describe("servicio de licitaciones", () => {
  beforeEach(() => vi.clearAllMocks());

  it("propaga la clave de la operación para que un reintento sea idempotente", async () => {
    const payload = {
      revision: "1",
      decision: "NO_GO",
      reason_code: "CAPACIDAD",
      rationale: "No hay capacidad disponible.",
      row_version: 3,
    };
    const operationKey = "decision-logica-0001";

    await closeDecision("opportunity-1", payload, operationKey);
    await closeDecision("opportunity-1", payload, operationKey);

    expect(api.post).toHaveBeenCalledTimes(2);
    for (const call of vi.mocked(api.post).mock.calls) {
      expect(call[2]).toEqual({ headers: { "Idempotency-Key": operationKey } });
    }
  });
});
