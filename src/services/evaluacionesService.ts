// src/services/evaluacionesService.ts
//
// Cliente HTTP del banco de evaluaciones.
//
// Las rutas cuelgan de `/hseq/evaluaciones` y no de `/evaluaciones`, que ya
// está ocupado por el router heredado de las evaluaciones 360. No es un
// capricho de nombres: FastAPI resuelve por orden de registro, y
// `/evaluaciones/cuestionarios` habría entrado por la ruta dinámica
// `/evaluaciones/{id}` de aquel intentando leer «cuestionarios» como un
// identificador.

import { api } from "@/lib/apiClient";
import { errorApi } from "@/services/capacitacionesService";
import type {
  CuestionarioCrear,
  CuestionarioDetalle,
  CuestionarioEditar,
  CuestionarioResumen,
  VersionElegible,
} from "@/types/evaluaciones";

const BASE = "/hseq/evaluaciones";

export async function listarCuestionarios(): Promise<CuestionarioResumen[]> {
  try {
    const { data } = await api.get<CuestionarioResumen[]>(`${BASE}/cuestionarios`);
    return data;
  } catch (e) {
    throw errorApi(e, "No pudimos cargar el banco de evaluaciones.");
  }
}

export async function obtenerCuestionario(id: string): Promise<CuestionarioDetalle> {
  try {
    const { data } = await api.get<CuestionarioDetalle>(`${BASE}/cuestionarios/${id}`);
    return data;
  } catch (e) {
    throw errorApi(e, "No pudimos abrir la evaluación.");
  }
}

export async function crearCuestionario(
  payload: CuestionarioCrear
): Promise<{ cuestionario_id: string; codigo: string }> {
  try {
    const { data } = await api.post<{ cuestionario_id: string; codigo: string }>(
      `${BASE}/cuestionarios`,
      payload
    );
    return data;
  } catch (e) {
    throw errorApi(e, "No pudimos crear la evaluación.");
  }
}

export async function editarCuestionario(
  id: string,
  cambios: CuestionarioEditar
): Promise<void> {
  try {
    await api.patch(`${BASE}/cuestionarios/${id}`, cambios);
  } catch (e) {
    throw errorApi(e, "No pudimos guardar la evaluación.");
  }
}

/**
 * Congela una versión. Es lo único que una lección puede referenciar.
 *
 * Lo que se publica no vuelve a cambiar: corregir una pregunta después crea la
 * versión siguiente y deja intacta la que alguien ya respondió.
 */
export async function publicarCuestionario(
  id: string
): Promise<{ version_id: string; numero: number }> {
  try {
    const { data } = await api.post<{ version_id: string; numero: number }>(
      `${BASE}/cuestionarios/${id}/publicar`
    );
    return data;
  } catch (e) {
    throw errorApi(e, "No pudimos publicar la evaluación.");
  }
}

/** La retira del banco SIN invalidar lo ya publicado ni lo ya respondido. */
export async function archivarCuestionario(id: string): Promise<void> {
  try {
    await api.post(`${BASE}/cuestionarios/${id}/archivar`);
  } catch (e) {
    throw errorApi(e, "No pudimos archivar la evaluación.");
  }
}

/**
 * La versión VIGENTE de cada cuestionario publicado. Nunca el historial.
 *
 * `incluirVersionId` es la excepción: la que una lección ya tiene elegida viaja
 * aunque la hayan sustituido, marcada como no vigente.
 */
export async function listarVersionesElegibles(
  incluirVersionId?: string | null
): Promise<VersionElegible[]> {
  try {
    const { data } = await api.get<VersionElegible[]>(
      `${BASE}/cuestionarios/publicadas`,
      incluirVersionId
        ? { params: { incluir_version_id: incluirVersionId } }
        : undefined
    );
    return data;
  } catch (e) {
    throw errorApi(e, "No pudimos cargar las evaluaciones publicadas.");
  }
}
