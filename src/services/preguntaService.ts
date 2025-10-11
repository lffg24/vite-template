// src/services/preguntaService.ts
import { api } from "@/lib/apiClient"; // 👈 C mayúscula
import type { Pregunta } from "@/types/pregunta";

/** Sanitiza errores para no filtrar detalles internos del backend */
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

const BASE = "/preguntas";

/** Lista preguntas, opcionalmente filtradas por evaluación */
export async function obtenerPreguntas(
  evaluacionId?: number
): Promise<Pregunta[]> {
  try {
    const url = evaluacionId
      ? `${BASE}/?evaluacion_id=${evaluacionId}`
      : `${BASE}/`;
    const { data } = await api.get<Pregunta[]>(url);
    return data;
  } catch (e) {
    throw safeError(e, "No pudimos obtener las preguntas.");
  }
}

/** Crea una pregunta (usamos Omit<Pregunta, 'id'> como payload) */
export async function crearPregunta(
  payload: Omit<Pregunta, "id">
): Promise<Pregunta> {
  try {
    const { data } = await api.post<Pregunta>(`${BASE}/`, payload);
    return data;
  } catch (e) {
    throw safeError(e, "No pudimos crear la pregunta.");
  }
}

/** Actualiza una pregunta (payload parcial) */
export async function actualizarPregunta(
  id: number | string,
  payload: Partial<Pregunta>
): Promise<Pregunta> {
  try {
    const { data } = await api.put<Pregunta>(`${BASE}/${id}`, payload);
    return data;
  } catch (e) {
    throw safeError(e, "No pudimos actualizar la pregunta.");
  }
}

/** Elimina una pregunta */
export async function eliminarPregunta(id: number | string): Promise<void> {
  try {
    await api.delete(`${BASE}/${id}`);
  } catch (e) {
    throw safeError(e, "No pudimos eliminar la pregunta.");
  }
}
