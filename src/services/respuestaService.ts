// src/services/respuestaService.ts
import { api } from "@/lib/apiClient";
import type {
  RespuestaCreate,
  Respuesta,
  RespuestaUpdate,
} from "@/types/respuestaTypes";

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

const BASE = "/respuestas";

/**
 * Guarda en lote respuestas para un usuario/evaluación.
 * La API espera:
 *   - Query params: usuario_id, evaluacion_id
 *   - Body: lista de items con { pregunta_id, valor, comentario? }
 *
 * Para compatibilidad: si los elementos del array incluyen usuario_id/evaluacion_id,
 * se infieren desde el primer elemento.
 */
export async function guardarRespuestas(
  items: RespuestaCreate[]
): Promise<{ insertados: number; actualizados: number }> {
  if (!Array.isArray(items) || items.length === 0) {
    return { insertados: 0, actualizados: 0 };
  }

  const anyItem: any = items[0] as any;
  const usuarioId: number = Number(anyItem.usuario_id ?? anyItem.usuarioId);
  const evaluacionId: number = Number(
    anyItem.evaluacion_id ?? anyItem.evaluacionId
  );

  if (!usuarioId || !evaluacionId) {
    throw new Error("Faltan usuario_id o evaluacion_id en las respuestas.");
  }

  // Minimizar payload a lo que espera el backend
  const body = items.map((r: any) => ({
    pregunta_id: Number(r.pregunta_id ?? r.preguntaId),
    valor: r.valor,
    comentario: r.comentario ?? undefined,
  }));

  try {
    const { data } = await api.post<{
      insertados: number;
      actualizados: number;
    }>(`${BASE}/guardar-multiples`, body, {
      params: { usuario_id: usuarioId, evaluacion_id: evaluacionId },
    });
    return data;
  } catch (e) {
    throw safeError(e, "No pudimos guardar tus respuestas.");
  }
}

/** Obtener respuestas por usuario y evaluación */
export async function obtenerRespuestasPorUsuarioYEvaluacion(
  usuarioId: number,
  evaluacionId: number
): Promise<Respuesta[]> {
  try {
    const { data } = await api.get<Respuesta[]>(
      `${BASE}/${usuarioId}/${evaluacionId}`
    );
    return data ?? [];
  } catch (e) {
    throw safeError(e, "No pudimos obtener tus respuestas previas.");
  }
}

/** Guarda múltiples respuestas de una sola vez */
export async function guardarRespuestasMultiples(
  evaluacionId: number,
  usuarioId: number,
  items: Array<Pick<RespuestaCreate, "pregunta_id" | "valor">> // enviamos pregunta y valor; el service rellena usuario/evaluación
): Promise<void> {
  try {
    // Armamos el payload que el backend espera (incluyendo usuario y evaluación por ítem)
    const payload: RespuestaCreate[] = items.map((it) => ({
      usuario_id: usuarioId,
      evaluacion_id: evaluacionId,
      pregunta_id: it.pregunta_id,
      valor: it.valor,
    }));

    await api.post(
      `/respuestas/guardar-multiples?usuario_id=${usuarioId}&evaluacion_id=${evaluacionId}`,
      payload
    );
  } catch (e) {
    throw safeError(e, "No pudimos guardar tus respuestas.");
  }
}

/* Edición puntual (si la usas)
// export async function actualizarRespuesta(
//   id: number | string,
//   payload: Partial<RespuestaUpdate>
// ): Promise<Respuesta> {
//   try {
//     const { data } = await api.put<Respuesta>(`${BASE}/${id}`, payload);
//     return data;
//   } catch (e) {
//     throw safeError(e, "No pudimos actualizar la respuesta.");
//   }
// }
*/
