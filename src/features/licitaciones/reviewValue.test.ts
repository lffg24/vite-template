import { describe, expect, it } from "vitest";
import { parseReviewValue } from "./reviewValue";

describe("normalización de valores revisados", () => {
  it("conserva JSON estructurado aunque el valor original sea nulo", () => {
    const field = { data_type: "document_finding", value_json: null };

    expect(parseReviewValue('{"encontrado":true}', field, false, "CORREGIDO")).toEqual({
      encontrado: true,
    });
    expect(() => parseReviewValue("texto plano", field, false, "CORREGIDO")).toThrow(
      "JSON válido",
    );
  });

  it("mantiene booleanos, números y controles GO con su tipo", () => {
    expect(parseReviewValue("false", { data_type: "boolean", value_json: null }, false, "CORREGIDO")).toBe(false);
    expect(parseReviewValue("117", { data_type: "number", value_json: null }, false, "CORREGIDO")).toBe(117);
    expect(parseReviewValue("", undefined, true, "VERIFICADO")).toBe(true);
  });
});
