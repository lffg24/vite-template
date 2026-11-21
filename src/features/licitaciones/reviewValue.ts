type ReviewField = {
  data_type: string;
  value_json: unknown;
};

const JSON_TYPES = new Set(["document_finding", "quantity", "json", "object", "array"]);
const NUMBER_TYPES = new Set(["integer", "number", "decimal", "money", "percentage"]);
const BOOLEAN_TYPES = new Set(["boolean"]);

export function parseReviewValue(
  raw: string,
  field: ReviewField | undefined,
  control: boolean,
  status: string,
) {
  if (control) return ["VERIFICADO", "CORREGIDO"].includes(status) ? true : null;
  const trimmed = raw.trim();
  if (!trimmed) return null;

  const dataType = field?.data_type?.toLowerCase() || "";
  if (BOOLEAN_TYPES.has(dataType) || typeof field?.value_json === "boolean") {
    if (!/^(true|false)$/i.test(trimmed)) throw new Error("El valor debe ser true o false.");
    return trimmed.toLowerCase() === "true";
  }
  if (NUMBER_TYPES.has(dataType) || typeof field?.value_json === "number") {
    const parsed = Number(trimmed);
    if (!Number.isFinite(parsed)) throw new Error("El valor debe ser numérico.");
    return parsed;
  }
  if (JSON_TYPES.has(dataType) || (field?.value_json && typeof field.value_json === "object")) {
    try { return JSON.parse(trimmed); }
    catch { throw new Error("El valor debe ser JSON válido para conservar su estructura."); }
  }
  return raw;
}
