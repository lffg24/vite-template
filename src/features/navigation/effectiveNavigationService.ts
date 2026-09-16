import { API_URL } from "@/lib/config";
import { emitSessionExpired } from "@/lib/sessionEvents";

export async function fetchEffectiveDestinations(signal?: AbortSignal): Promise<string[]> {
  const response = await fetch(`${API_URL}/acceso/navegacion`, {
    credentials: "include",
    signal,
  });
  if (response.status === 401) emitSessionExpired();
  if (!response.ok) throw new Error("No pudimos cargar tu navegación.");
  const body = (await response.json()) as { destinos?: unknown };
  if (!Array.isArray(body.destinos)) {
    throw new Error("La navegación recibida no es válida.");
  }
  return body.destinos.filter((value): value is string => typeof value === "string");
}
