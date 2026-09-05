// src/services/capacitacionesService.ts
//
// Cliente HTTP del módulo de Capacitaciones.
//
// La superficie que consume vive en `backend/hseq/capacitaciones/api.py`, dentro
// del propio módulo y no en `routers/`, para que el producto no adquiera una
// dependencia hacia `hseq/` por cada endpoint. Aquí eso se traduce en que este
// archivo es el ÚNICO punto del frontend que conoce esas rutas.

import { api } from "@/lib/apiClient";
import type {
  AsignacionCreada,
  AsignacionCrear,
  AsignacionResumen,
  CursoCrear,
  CursoDetalle,
  CursoEditar,
  CursoResumen,
  EnlaceCreado,
  EnlaceCrear,
  EnlaceResumen,
  ErrorApi,
  LeccionCrear,
  LeccionEditar,
  ModuloEstado,
  VersionAsignable,
  VersionPublicada,
} from "@/types/capacitaciones";

const BASE = "/capacitaciones";

/**
 * Traduce un fallo de axios a un `Error` con el estado a la vista.
 *
 * El estado se conserva porque el backend lo usa para decir cosas distintas y
 * la interfaz tiene que distinguirlas:
 *
 * - **404** — no existe, o es de otra empresa. El backend responde lo mismo en
 *   ambos casos a propósito: un 403 confirmaría que el identificador existe en
 *   otro inquilino, que es exactamente lo que no debe poder averiguarse.
 * - **403** — el módulo no está contratado, la bandera está apagada, o este
 *   usuario no tiene el permiso. Se arreglan de formas distintas, así que la
 *   pantalla manda a A-08 en vez de repetir «sin permiso».
 * - **422** al publicar — trae `faltantes`, la lista de lo que impide publicar.
 * - **409** — ya existe una asignación activa para esa versión.
 */
function errorApi(e: unknown, fallback: string): ErrorApi {
  const anyErr = e as {
    response?: { status?: number; data?: { detail?: unknown; message?: string } };
    message?: string;
  };
  const detail = anyErr?.response?.data?.detail;

  let mensaje: string = fallback;
  let faltantes: string[] | undefined;

  if (typeof detail === "string") {
    mensaje = detail;
  } else if (detail && typeof detail === "object") {
    const d = detail as { mensaje?: string; detail?: string; faltantes?: string[] };
    if (Array.isArray(d.faltantes)) faltantes = d.faltantes;
    mensaje = d.mensaje ?? d.detail ?? fallback;
  } else if (typeof anyErr?.response?.data?.message === "string") {
    mensaje = anyErr.response.data.message;
  }

  const err = new Error(mensaje) as ErrorApi;
  err.status = anyErr?.response?.status;
  if (faltantes) err.faltantes = faltantes;
  return err;
}

// --- A-08 · estado del módulo -------------------------------------------------

export async function obtenerEstadoModulo(): Promise<ModuloEstado> {
  try {
    const { data } = await api.get<ModuloEstado>(`${BASE}/modulo/estado`);
    return data;
  } catch (e) {
    throw errorApi(e, "No pudimos consultar el estado del módulo.");
  }
}

// --- A-02 · catálogo ----------------------------------------------------------

export async function listarCursos(): Promise<CursoResumen[]> {
  try {
    const { data } = await api.get<CursoResumen[]>(`${BASE}/cursos`);
    return data;
  } catch (e) {
    throw errorApi(e, "No pudimos obtener los cursos.");
  }
}

export async function crearCurso(payload: CursoCrear): Promise<{ curso_id: string }> {
  try {
    const { data } = await api.post<{ curso_id: string }>(`${BASE}/cursos`, payload);
    return data;
  } catch (e) {
    throw errorApi(e, "No pudimos crear el curso.");
  }
}

// --- A-03 · detalle y edición --------------------------------------------------

export async function obtenerCurso(cursoId: string): Promise<CursoDetalle> {
  try {
    const { data } = await api.get<CursoDetalle>(`${BASE}/cursos/${cursoId}`);
    return data;
  } catch (e) {
    throw errorApi(e, "No pudimos abrir el curso.");
  }
}

/**
 * PATCH, no PUT: lo ausente no se toca.
 *
 * Un PUT obligaría a reenviar el curso entero para cambiar el título, y ese
 * reenvío es donde se pierde lo que otra pestaña acaba de guardar.
 */
export async function editarCurso(cursoId: string, cambios: CursoEditar): Promise<void> {
  try {
    await api.patch(`${BASE}/cursos/${cursoId}`, cambios);
  } catch (e) {
    throw errorApi(e, "No pudimos guardar los cambios del curso.");
  }
}

// --- A-04 · lecciones -----------------------------------------------------------

export async function agregarLeccion(
  cursoId: string,
  payload: LeccionCrear
): Promise<{ leccion_id: string; orden: number }> {
  try {
    const { data } = await api.post<{ leccion_id: string; orden: number }>(
      `${BASE}/cursos/${cursoId}/lecciones`,
      payload
    );
    return data;
  } catch (e) {
    throw errorApi(e, "No pudimos agregar la lección.");
  }
}

export async function editarLeccion(
  cursoId: string,
  leccionId: string,
  cambios: LeccionEditar
): Promise<void> {
  try {
    await api.patch(`${BASE}/cursos/${cursoId}/lecciones/${leccionId}`, cambios);
  } catch (e) {
    throw errorApi(e, "No pudimos guardar la lección.");
  }
}

/** Al eliminar, el backend compacta el orden: no quedan huecos en la numeración. */
export async function eliminarLeccion(cursoId: string, leccionId: string): Promise<void> {
  try {
    await api.delete(`${BASE}/cursos/${cursoId}/lecciones/${leccionId}`);
  } catch (e) {
    throw errorApi(e, "No pudimos eliminar la lección.");
  }
}

// --- A-05 · publicación -----------------------------------------------------------

/**
 * Congela una versión inmutable.
 *
 * Si falta algo normativo devuelve 422 con `faltantes`. La pantalla no debería
 * llegar aquí a ciegas: el detalle ya trae esa misma lista calculada.
 */
export async function publicarCurso(cursoId: string): Promise<VersionPublicada> {
  try {
    const { data } = await api.post<VersionPublicada>(`${BASE}/cursos/${cursoId}/publicar`);
    return data;
  } catch (e) {
    throw errorApi(e, "No pudimos publicar el curso.");
  }
}

// --- A-11 · asignaciones -------------------------------------------------------------

/**
 * Lo que se puede asignar hoy, con lo ya asignado marcado.
 *
 * Se protege con la misma guarda que crear la asignación —bandera de asignación
 * y permiso de asignar— y no con la del catálogo: con menos sería un endpoint
 * para enumerar el catálogo entero sin poder asignar nada.
 */
export async function listarVersionesAsignables(): Promise<VersionAsignable[]> {
  try {
    const { data } = await api.get<VersionAsignable[]>(`${BASE}/versiones-asignables`);
    return data;
  } catch (e) {
    throw errorApi(e, "No pudimos obtener las versiones publicadas.");
  }
}

export async function listarAsignaciones(): Promise<AsignacionResumen[]> {
  try {
    const { data } = await api.get<AsignacionResumen[]>(`${BASE}/asignaciones`);
    return data;
  } catch (e) {
    throw errorApi(e, "No pudimos obtener las asignaciones.");
  }
}

export async function crearAsignacion(payload: AsignacionCrear): Promise<AsignacionCreada> {
  try {
    const { data } = await api.post<AsignacionCreada>(`${BASE}/asignaciones`, payload);
    return data;
  } catch (e) {
    throw errorApi(e, "No pudimos crear la asignación.");
  }
}

/** Cerrar no revoca lo repartido: deja de admitir inscripciones nuevas. */
export async function cerrarAsignacion(asignacionId: string): Promise<void> {
  try {
    await api.post(`${BASE}/asignaciones/${asignacionId}/cerrar`);
  } catch (e) {
    throw errorApi(e, "No pudimos cerrar la asignación.");
  }
}

// --- A-12 · enlaces ---------------------------------------------------------------------

/** Nunca trae el token. No existe endpoint que lo devuelva: solo se guarda su hash. */
export async function listarEnlaces(asignacionId: string): Promise<EnlaceResumen[]> {
  try {
    const { data } = await api.get<EnlaceResumen[]>(
      `${BASE}/asignaciones/${asignacionId}/enlaces`
    );
    return data;
  } catch (e) {
    throw errorApi(e, "No pudimos obtener los enlaces.");
  }
}

/**
 * Genera un enlace y devuelve el token **una sola vez**.
 *
 * Rotar es volver a llamar aquí. El anterior sigue vigente hasta que se revoque,
 * así que rotar no deja tirado a quien ya lo tenía abierto.
 */
export async function generarEnlace(
  asignacionId: string,
  payload: EnlaceCrear = {}
): Promise<EnlaceCreado> {
  try {
    const { data } = await api.post<EnlaceCreado>(
      `${BASE}/asignaciones/${asignacionId}/enlaces`,
      payload
    );
    return data;
  } catch (e) {
    throw errorApi(e, "No pudimos generar el enlace.");
  }
}

export async function revocarEnlace(enlaceId: string): Promise<void> {
  try {
    await api.post(`${BASE}/enlaces/${enlaceId}/revocar`);
  } catch (e) {
    throw errorApi(e, "No pudimos revocar el enlace.");
  }
}
