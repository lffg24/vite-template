import type { BulkInformeIndividualItem } from "@/features/psicosocial/api/psicoInformesIndividualesService";
import type { ParticipantePsico } from "@/types/psicoDashboard";

export type InstrumentFilter = "INTRA" | "EXTRA" | "ESTRES";
export type RiskFilter = "SIN_RIESGO" | "BAJO" | "MEDIO" | "ALTO" | "MUY_ALTO" | "SIN_NIVEL";

export const ALL_INSTRUMENT_FILTERS: InstrumentFilter[] = ["INTRA", "EXTRA", "ESTRES"];
export const ALL_RISK_FILTERS: RiskFilter[] = ["SIN_RIESGO", "BAJO", "MEDIO", "ALTO", "MUY_ALTO", "SIN_NIVEL"];

export const INSTRUMENT_FILTER_LABELS: Record<InstrumentFilter, string> = {
  INTRA: "Intralaboral",
  EXTRA: "Extralaboral",
  ESTRES: "Estrés",
};

export const RISK_ORDER: Record<string, number> = {
  MUY_ALTO: 5,
  ALTO: 4,
  MEDIO: 3,
  BAJO: 2,
  SIN_RIESGO: 1,
  MUY_BAJO: 1,
  SIN_NIVEL: 0,
};

export function normalizeRisk(value?: string | null) {
  return String(value || "SIN_NIVEL").toUpperCase();
}

export function intraInstrumentCode(item: ParticipantePsico) {
  if (item.intra === "A") return item.niveles?.a ? "PSICO_INTRA_A" : null;
  if (item.intra === "B") return item.niveles?.b ? "PSICO_INTRA_B" : null;
  return null;
}

export function reportsForParticipant(item: ParticipantePsico, filters: InstrumentFilter[] | InstrumentFilter): BulkInformeIndividualItem[] {
  const selected = Array.isArray(filters) ? filters : [filters];
  const reports: BulkInformeIndividualItem[] = [];
  const intraCode = intraInstrumentCode(item);
  if (selected.includes("INTRA") && intraCode) reports.push({ empleado_id: item.empleado_id, instrument_code: intraCode });
  if (selected.includes("EXTRA") && item.niveles?.extra) reports.push({ empleado_id: item.empleado_id, instrument_code: "PSICO_EXTRA" });
  if (selected.includes("ESTRES") && item.niveles?.estres) reports.push({ empleado_id: item.empleado_id, instrument_code: "PSICO_ESTRES" });
  return reports;
}

export function riskForParticipant(item: ParticipantePsico, filter: InstrumentFilter) {
  if (filter === "INTRA") return item.intra === "A" ? item.niveles?.a : item.niveles?.b;
  if (filter === "EXTRA") return item.niveles?.extra;
  return item.niveles?.estres;
}

export function highestRiskForFilters(item: ParticipantePsico, filters: InstrumentFilter[]) {
  const risks = filters.map((filter) => normalizeRisk(riskForParticipant(item, filter)));
  if (!risks.length) return normalizeRisk(item.nivel_critico);
  return risks.sort((a, b) => (RISK_ORDER[b] ?? 0) - (RISK_ORDER[a] ?? 0))[0] || "SIN_NIVEL";
}

export function participantMatchesReportFilters(
  item: ParticipantePsico,
  filters: { instrumentos: InstrumentFilter[]; riesgos: RiskFilter[] },
) {
  const availableReports = reportsForParticipant(item, filters.instrumentos);
  if (!availableReports.length) return false;
  if (!filters.riesgos.length) return false;
  return filters.instrumentos.some((instrumento) => filters.riesgos.includes(normalizeRisk(riskForParticipant(item, instrumento)) as RiskFilter));
}
