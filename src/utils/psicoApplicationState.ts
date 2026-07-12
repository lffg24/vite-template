const REPORTABLE_STATES = new Set(["FINALIZADA"]);

export function normalizePsicoApplicationState(value?: string | null): string {
  const raw = String(value ?? "").trim().toUpperCase().replace(/[ -]+/g, "_");
  if (!raw || raw === "NULL" || raw === "NONE" || raw === "DRAFT") return "BORRADOR";
  if (["ACTIVA", "ABIERTA", "EN_PROGRESO", "ENPROGRESO", "CAPTURA", "EN_CAPTURA"].includes(raw)) return "EN_CAPTURA";
  if (["CALCULADA", "CALCULADO", "CERRADA", "CERRADO", "FINALIZADA", "FINALIZADO"].includes(raw)) return "FINALIZADA";
  if (["REABIERTA", "REABIERTO", "REAPERTURA"].includes(raw)) return "REABIERTA";
  if (["ERROR", "ERROR_CALCULO", "FALLO_CALCULO", "FALLIDA"].includes(raw)) return "ERROR_CALCULO";
  if (["CALCULANDO", "PROCESANDO"].includes(raw)) return "CALCULANDO";
  return "BORRADOR";
}

export function isReportablePsicoApplicationState(value?: string | null): boolean {
  return REPORTABLE_STATES.has(normalizePsicoApplicationState(value));
}
