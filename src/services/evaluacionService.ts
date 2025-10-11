// src/services/evaluacionService.ts
import { api } from "@/lib/apiClient";
import type {
  Evaluacion,
  EvaluacionCreate,
  TipoEvaluacion,
  UsuarioAsignado,
  EvaluacionConProgreso,
} from "@/types/evaluacion";

/** No filtramos detalles internos del backend */
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

/* ===================== Tipos de evaluación ===================== */
export async function obtenerTiposEvaluacion(): Promise<TipoEvaluacion[]> {
  try {
    const { data } = await api.get<TipoEvaluacion[]>("/tipos-evaluacion/");
    return data;
  } catch (e) {
    throw safeError(e, "No pudimos obtener los tipos de evaluación.");
  }
}

export async function crearTipoEvaluacion(
  payload: Omit<TipoEvaluacion, "id">
): Promise<TipoEvaluacion> {
  try {
    const { data } = await api.post<TipoEvaluacion>(
      "/tipos-evaluacion/",
      payload
    );
    return data;
  } catch (e) {
    throw safeError(e, "No pudimos crear el tipo de evaluación.");
  }
}

/* ===================== Evaluaciones (CRUD) ===================== */
export async function obtenerEvaluaciones(): Promise<Evaluacion[]> {
  try {
    const { data } = await api.get<Evaluacion[]>("/evaluaciones/");
    return data;
  } catch (e) {
    throw safeError(e, "No pudimos obtener las evaluaciones.");
  }
}

export async function crearEvaluacion(
  payload: EvaluacionCreate
): Promise<Evaluacion> {
  try {
    const { data } = await api.post<Evaluacion>("/evaluaciones/", payload);
    return data;
  } catch (e) {
    throw safeError(e, "No pudimos crear la evaluación.");
  }
}

// Trae el detalle de una evaluación por id
export async function obtenerEvaluacion(id: number) {
  const { data } = await api.get(`/evaluaciones/${id}`);
  return data;
}

export async function actualizarEvaluacion(
  id: number,
  payload: Partial<EvaluacionCreate>
): Promise<Evaluacion> {
  try {
    const { data } = await api.put<Evaluacion>(`/evaluaciones/${id}`, payload);
    return data;
  } catch (e) {
    throw safeError(e, "No pudimos actualizar la evaluación.");
  }
}

export async function eliminarEvaluacion(id: number): Promise<void> {
  try {
    await api.delete(`/evaluaciones/${id}`);
  } catch (e) {
    throw safeError(e, "No pudimos eliminar la evaluación.");
  }
}

/* ===================== Asignaciones ===================== */
export async function asignarUsuariosAEvaluacion(
  evaluacionId: number,
  usuarios: UsuarioAsignado[]
): Promise<void> {
  try {
    await api.post(`/evaluaciones/${evaluacionId}/asignar-usuarios`, {
      usuarios,
    });
  } catch (e) {
    throw safeError(e, "No pudimos asignar usuarios a la evaluación.");
  }
}

export async function obtenerUsuariosAsignados(
  evaluacionId: number
): Promise<UsuarioAsignado[]> {
  try {
    const { data } = await api.get<UsuarioAsignado[]>(
      `/evaluaciones/${evaluacionId}/usuarios-asignados`
    );
    return data;
  } catch (e) {
    throw safeError(e, "No pudimos obtener los usuarios asignados.");
  }
}

export async function reemplazarAsignaciones(
  evaluacionId: number,
  usuarios: UsuarioAsignado[]
): Promise<void> {
  try {
    await api.post(`/evaluaciones/${evaluacionId}/asignaciones/reemplazar`, {
      usuarios,
    });
  } catch (e) {
    throw safeError(e, "No pudimos reemplazar las asignaciones.");
  }
}

/* ===================== Progreso ===================== */
export async function actualizarProgresoEvaluacion(
  usuarioId: number,
  evaluacionId: number
): Promise<void> {
  try {
    await api.patch(
      `/usuarios/evaluacion-progreso/${usuarioId}/${evaluacionId}`
    );
  } catch (e) {
    throw safeError(e, "No pudimos actualizar el progreso de la evaluación.");
  }
}

export async function obtenerEvaluacionesConProgreso(
  usuarioId: number
): Promise<EvaluacionConProgreso[]> {
  try {
    // 1) Traer progreso como está hoy
    const { data } = await api.get<EvaluacionConProgreso[]>(
      `/usuarios/${usuarioId}/evaluaciones-con-progreso`
    );
    if (!Array.isArray(data) || data.length === 0) return [];

    // 2) Si YA vienen nombre/descripcion, devolver tal cual (no tocamos nada)
    const yaTraeNombre = data.some(
      (x: any) => x?.nombre || x?.evaluacion?.nombre || x?.evaluacion_nombre
    );
    const yaTraeDescripcion = data.some(
      (x: any) =>
        x?.descripcion ||
        x?.evaluacion?.descripcion ||
        x?.evaluacion_descripcion
    );
    if (yaTraeNombre && yaTraeDescripcion) return data;

    // 3) Recolectar IDs que necesiten detalle
    const ids: number[] = Array.from(
      new Set(
        data
          .map((x: any) => x?.evaluacion_id ?? x?.evaluacionId ?? x?.id)
          .filter((v: any) => typeof v === "number")
      )
    );
    if (ids.length === 0) return data;

    // 4) Intentar batch opcional /evaluaciones/batch?ids=1,2,3
    const mapa = new Map<
      number,
      { nombre?: string; descripcion?: string | null }
    >();
    let batchOK = false;
    // 5) Fallback: llamadas individuales a /evaluaciones/{id}
    if (!batchOK) {
      await Promise.all(
        ids.map(async (id) => {
          try {
            const { data: det } = await api.get(`/evaluaciones/${id}`);
            mapa.set(id, {
              nombre: det?.nombre ?? det?.titulo ?? undefined,
              descripcion: det?.descripcion ?? det?.resumen ?? null,
            });
          } catch {
            /* ignorar id con error */
          }
        })
      );
    }

    // 6) Merge NO destructivo (si backend ya trae algo, se respeta)
    return data.map((item: any) => {
      const key = item?.evaluacion_id ?? item?.evaluacionId ?? item?.id;
      const det = typeof key === "number" ? mapa.get(key) : undefined;
      return {
        ...item,
        nombre:
          item?.nombre ??
          item?.evaluacion?.nombre ??
          item?.evaluacion_nombre ??
          det?.nombre ??
          "Evaluación",
        descripcion:
          item?.descripcion ??
          item?.evaluacion?.descripcion ??
          item?.evaluacion_descripcion ??
          det?.descripcion ??
          "Sin descripción",
      } as EvaluacionConProgreso;
    });
  } catch (e) {
    throw safeError(e, "No pudimos obtener tus evaluaciones.");
  }
}
