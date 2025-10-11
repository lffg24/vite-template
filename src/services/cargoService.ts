// src/services/cargoService.ts
import { api } from "@/lib/apiClient";
import type { Cargo, CargoCreate } from "@/types/cargo";

/** No exponemos detalles internos del backend en los errores */
function safeError(e: any, fallback = "Error de red o del servidor.") {
  const msg =
    e?.response?.data?.detail ??
    e?.response?.data?.message ??
    e?.message ??
    fallback;
  const err = new Error(typeof msg === "string" ? msg : fallback);
  (err as any).status = e?.response?.status;
  return err;
}

/** Obtener todos los cargos (scopeado por empresa en backend) */
export async function obtenerCargos(): Promise<Cargo[]> {
  try {
    const { data } = await api.get<Cargo[]>("/cargos/");
    // Normalizamos nulos por consistencia
    return data.map((c) => ({
      ...c,
      reporta_a_id: c.reporta_a_id ?? null,
      area_id: c.area_id ?? null,
      nivel: c.nivel ?? null,
    }));
  } catch (e) {
    throw safeError(e, "No pudimos obtener los cargos.");
  }
}

/** Crear cargo */
export async function crearCargo(payload: CargoCreate): Promise<Cargo> {
  try {
    const { data } = await api.post<Cargo>("/cargos/", payload);
    return data;
  } catch (e) {
    throw safeError(e, "No pudimos crear el cargo.");
  }
}

/** Actualizar cargo */
export async function actualizarCargo(
  id: number,
  payload: Partial<CargoCreate>
): Promise<Cargo> {
  try {
    const { data } = await api.put<Cargo>(`/cargos/${id}`, payload);
    return data;
  } catch (e) {
    throw safeError(e, "No pudimos actualizar el cargo.");
  }
}

/** Eliminar cargo */
export async function eliminarCargo(id: number): Promise<void> {
  try {
    await api.delete(`/cargos/${id}`);
  } catch (e) {
    throw safeError(e, "No pudimos eliminar el cargo.");
  }
}

/** (Opcional) Obtener un cargo por id */
export async function obtenerCargo(id: number): Promise<Cargo> {
  try {
    const { data } = await api.get<Cargo>(`/cargos/${id}`);
    return data;
  } catch (e) {
    throw safeError(e, "No pudimos obtener el cargo.");
  }
}
