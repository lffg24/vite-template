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
  ConstanciaEmitidaAdmin,
  ConstanciaResumen,
  InvitacionResumen,
  InvitacionesGeneradas,
  ParticipanteCrear,
  ParticipanteEditar,
  ParticipanteResumen,
  ResultadoImportacion,
  VistaPreviaImportacion,
  CursoCrear,
  CursoDetalle,
  CursoEditar,
  ContextoCapacidades,
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

// --- contexto · el contrato único de capacidades ------------------------------

/**
 * Qué puede hacer este usuario, con contrato y banderas ya resueltos.
 *
 * Es lo único que la interfaz debe consultar para decidir qué pintar. No exige
 * permiso —es el endpoint con el que se averigua si se tiene alguno— y devuelve
 * los campos comerciales en nulo cuando no hay acceso.
 */
export async function obtenerContexto(): Promise<ContextoCapacidades> {
  try {
    const { data } = await api.get<ContextoCapacidades>(`${BASE}/contexto`);
    return data;
  } catch (e) {
    throw errorApi(e, "No pudimos consultar tus permisos en el módulo.");
  }
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

/**
 * Sube o baja una lección una posición.
 *
 * Relativo y no absoluto: si la pantalla se quedó con una lista vieja, «llévala
 * a la posición 5» reordenaría otra cosa. Un paso sobre la lista que el
 * servidor tiene bloqueada no puede equivocarse de lección.
 */
export async function moverLeccion(
  cursoId: string,
  leccionId: string,
  direccion: "ARRIBA" | "ABAJO"
): Promise<void> {
  try {
    await api.post(`${BASE}/cursos/${cursoId}/lecciones/${leccionId}/mover`, { direccion });
  } catch (e) {
    throw errorApi(e, "No pudimos mover la lección.");
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

// --- B-05 · constancias ------------------------------------------------------------------

/**
 * Las constancias de la empresa, de la más reciente a la más antigua.
 *
 * Aquí **sí** llegan los nombres completos, a diferencia del verificador
 * público. Quien administra su empresa ya tiene esos datos; enmascararlos le
 * impediría hacer su trabajo. El enmascarado es del verificador, que es otra
 * audiencia con otro derecho a saber.
 */
export async function listarConstancias(): Promise<ConstanciaResumen[]> {
  try {
    const { data } = await api.get<ConstanciaResumen[]>(`${BASE}/constancias`);
    return data;
  } catch (e) {
    throw errorApi(e, "No pudimos obtener las constancias.");
  }
}

/**
 * Emite la constancia de una inscripción completada.
 *
 * Existe además de la emisión automática del recorrido público porque hay casos
 * en que aquella no ocurrió. Es idempotente: llamarla sobre una que ya tiene
 * constancia devuelve la misma, no una segunda con otro folio.
 */
export async function emitirConstancia(
  inscripcionId: string
): Promise<ConstanciaEmitidaAdmin> {
  try {
    const { data } = await api.post<ConstanciaEmitidaAdmin>(
      `${BASE}/inscripciones/${inscripcionId}/constancia`
    );
    return data;
  } catch (e) {
    throw errorApi(e, "No pudimos emitir la constancia.");
  }
}

/**
 * Anula una constancia. **No la borra.**
 *
 * El folio no se reutiliza y el código sigue verificando: quien tenga el
 * documento impreso debe poder enterarse de que ya no vale, y solo puede
 * hacerlo si el verificador se lo dice.
 */
export async function anularConstancia(
  constanciaId: string,
  motivo: string
): Promise<ConstanciaResumen> {
  try {
    const { data } = await api.post<ConstanciaResumen>(
      `${BASE}/constancias/${constanciaId}/anular`,
      { motivo }
    );
    return data;
  } catch (e) {
    throw errorApi(e, "No pudimos anular la constancia.");
  }
}


// --- A-09 · participantes ------------------------------------------------------------

/** La nómina de la empresa. Es a quién se puede invitar. */
export async function listarParticipantes(): Promise<ParticipanteResumen[]> {
  try {
    const { data } = await api.get<ParticipanteResumen[]>(`${BASE}/participantes`);
    return data;
  } catch (e) {
    throw errorApi(e, "No pudimos obtener los participantes.");
  }
}

/** Da de alta a una persona. **La empresa afirma su identidad.** */
export async function crearParticipante(
  payload: ParticipanteCrear
): Promise<ParticipanteResumen> {
  try {
    const { data } = await api.post<ParticipanteResumen>(`${BASE}/participantes`, payload);
    return data;
  } catch (e) {
    throw errorApi(e, "No pudimos dar de alta a esa persona.");
  }
}

/**
 * Corrige los datos de una persona. **Autenticado y auditado.**
 *
 * El documento no está en el contrato: cambiarlo no es corregir a alguien, es
 * señalar a otra persona.
 */
export async function editarParticipante(
  participanteId: string,
  cambios: ParticipanteEditar
): Promise<ParticipanteResumen> {
  try {
    const { data } = await api.patch<ParticipanteResumen>(
      `${BASE}/participantes/${participanteId}`,
      cambios
    );
    return data;
  } catch (e) {
    throw errorApi(e, "No pudimos guardar los cambios.");
  }
}

/** La vista previa del CSV. **No escribe nada.** */
export async function analizarImportacion(
  archivo: File
): Promise<VistaPreviaImportacion> {
  const cuerpo = new FormData();
  cuerpo.append("archivo", archivo);
  try {
    const { data } = await api.post<VistaPreviaImportacion>(
      `${BASE}/participantes/importar/analizar`,
      cuerpo
    );
    return data;
  } catch (e) {
    throw errorApi(e, "No pudimos leer el archivo.");
  }
}

/**
 * Aplica el archivo. **Todo o nada.**
 *
 * Se manda el archivo otra vez, no las filas ya clasificadas: si el servidor
 * aceptara la clasificación del cliente, esta podría saltarse la validación. La
 * vista previa es para que una persona decida, no un contrato de datos.
 */
export async function confirmarImportacion(
  archivo: File
): Promise<ResultadoImportacion> {
  const cuerpo = new FormData();
  cuerpo.append("archivo", archivo);
  try {
    const { data } = await api.post<ResultadoImportacion>(
      `${BASE}/participantes/importar`,
      cuerpo
    );
    return data;
  } catch (e) {
    throw errorApi(e, "No pudimos importar el archivo.");
  }
}

// --- invitaciones individuales ------------------------------------------------------

/** **Nunca trae el token.** Solo se puede generar uno nuevo. */
export async function listarInvitaciones(
  asignacionId: string
): Promise<InvitacionResumen[]> {
  try {
    const { data } = await api.get<InvitacionResumen[]>(
      `${BASE}/asignaciones/${asignacionId}/invitaciones`
    );
    return data;
  } catch (e) {
    throw errorApi(e, "No pudimos obtener las invitaciones.");
  }
}

/** Emite una por persona y devuelve los tokens **una sola vez**. */
export async function generarInvitaciones(
  asignacionId: string,
  participanteIds: string[],
  vigenciaDias?: number
): Promise<InvitacionesGeneradas> {
  try {
    const { data } = await api.post<InvitacionesGeneradas>(
      `${BASE}/asignaciones/${asignacionId}/invitaciones`,
      { participante_ids: participanteIds, ...(vigenciaDias ? { vigencia_dias: vigenciaDias } : {}) }
    );
    return data;
  } catch (e) {
    throw errorApi(e, "No pudimos generar las invitaciones.");
  }
}

/** Retira una invitación **que todavía no se usó**. */
export async function revocarInvitacion(
  invitacionId: string,
  motivo: string
): Promise<void> {
  try {
    await api.post(`${BASE}/invitaciones/${invitacionId}/revocar`, { motivo });
  } catch (e) {
    throw errorApi(e, "No pudimos revocar la invitación.");
  }
}
