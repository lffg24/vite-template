import { describe, expect, it } from "vitest";

import {
  DISABLED_PSICO_FEATURE_FLAGS,
  normalizePsicoFeatureFlags,
} from "./psicoAccessService";

describe("feature flags de Psicosocial", () => {
  it("falla cerrado cuando la respuesta está ausente o mal formada", () => {
    expect(normalizePsicoFeatureFlags(null)).toEqual(DISABLED_PSICO_FEATURE_FLAGS);
    expect(normalizePsicoFeatureFlags({})).toEqual(DISABLED_PSICO_FEATURE_FLAGS);
    expect(normalizePsicoFeatureFlags({ web_direct: "true" })).toEqual(DISABLED_PSICO_FEATURE_FLAGS);
  });

  it("habilita WEB_DIRECT únicamente con un booleano verdadero del backend", () => {
    expect(normalizePsicoFeatureFlags({ web_direct: true })).toEqual({ web_direct: true });
    expect(normalizePsicoFeatureFlags({ web_direct: false })).toEqual({ web_direct: false });
  });
});
