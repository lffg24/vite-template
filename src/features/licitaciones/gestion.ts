import type { Opportunity } from "./service";

export const CARRILES = [
  ["SIN_TIEMPO", "Tiempo insuficiente"],
  ["URGENTE", "Urgentes"],
  ["PRIORITARIO", "Prioritarias"],
  ["CONFIRMAR_CIERRE", "Por confirmar cierre"],
  ["EVALUACION_POSTERIOR", "Evaluación posterior"],
] as const;

export function carril(item: Opportunity): string {
  const metadata = item.metadata_json;
  const extra = metadata?.extra ?? metadata;
  if (extra && typeof extra === "object" && "group" in extra && extra.group === "CONTROL") {
    return "CONTROL";
  }
  return item.lane;
}

export function etiquetaCarril(value: string) {
  return CARRILES.find(([id]) => id === value)?.[1] ?? (value === "CONTROL" ? "Caso de control" : "Sin prioridad");
}

export function categoria(value: string | null) {
  if (value === "BATERIA_PSICOSOCIAL") return "Batería psicosocial";
  if (value === "AUDITORIA_ISO") return "Auditoría ISO";
  if (value === "SALUD_OCUPACIONAL") return "Salud ocupacional";
  return value?.replaceAll("_", " ") || "Sin clasificar";
}

export function diaBogota(value: Date) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Bogota" }).format(value);
}

export function diaCierre(item: Opportunity) {
  const value = item.next_deadline;
  if (!value) return null;
  if (item.deadline_precision === "FECHA_HORA" && Number.isFinite(Date.parse(value))) {
    return diaBogota(new Date(value));
  }
  return value.slice(0, 10);
}

export function estaVencida(item: Opportunity, now: Date) {
  const day = diaCierre(item);
  if (!day) return false;
  return item.deadline_precision === "FECHA_HORA"
    ? Date.parse(item.next_deadline!) <= now.getTime()
    : day < diaBogota(now);
}

export function cierreVisible(item: Opportunity, today: string) {
  const day = diaCierre(item);
  if (!day) return "Sin fecha de cierre";
  const instant = new Date(item.next_deadline!);
  const withTime = item.deadline_precision === "FECHA_HORA" && Number.isFinite(instant.getTime());
  const label = new Intl.DateTimeFormat("es-CO", {
    dateStyle: "medium",
    timeZone: "UTC",
  }).format(new Date(day + "T12:00:00Z"));
  const tomorrow = new Date(Date.parse(today + "T00:00:00Z") + 86_400_000).toISOString().slice(0, 10);
  const prefix = day === today ? "Cierre previsto hoy" : day === tomorrow ? "Cierre previsto mañana" : "Cierre previsto";
  const time = withTime ? new Intl.DateTimeFormat("es-CO", {
    timeStyle: "short",
    timeZone: "America/Bogota",
  }).format(instant) : null;
  return [prefix, label, time && (time + " Colombia")].filter(Boolean).join(" · ");
}

export function textoHallazgo(value: unknown): string[] {
  if (typeof value === "boolean") return [value ? "Sí" : "No"];
  if (typeof value === "number") return [String(value)];
  if (typeof value === "string") return value.trim() ? [value.trim()] : [];
  if (Array.isArray(value)) return value.flatMap(textoHallazgo);
  if (!value || typeof value !== "object") return [];
  const item = value as Record<string, unknown>;
  if (item.items) return [...textoHallazgo(item.summary), ...textoHallazgo(item.items)];
  const data = item.fragmento || item.texto || item.valor_textual || item.summary;
  if (data) return textoHallazgo(data);
  if (typeof item.amount === "number" && typeof item.unit === "string") return [String(item.amount) + " " + item.unit];
  return [];
}
