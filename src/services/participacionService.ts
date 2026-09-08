// src/services/participacionService.ts
//
// Cliente del recorrido público. **No usa `api` de `apiClient`.**
//
// Aquel instancia axios con un interceptor que, ante un 401, emite
// `sessionExpired` y manda al login. Es lo correcto para la aplicación
// administrativa y sería un defecto aquí: un participante sin sesión recibe 401
// de forma normal —al abrir el curso en otro dispositivo, por ejemplo— y
// expulsarlo a una pantalla de inicio de sesión que no puede usar lo dejaría sin
// salida.
//
// Por eso este archivo tiene su propia instancia: mismos `withCredentials` para
// que viaje la cookie `HttpOnly`, y ningún interceptor de sesión.

import axios from "axios";

import { API_URL } from "@/lib/config";
import type {
  AceptacionEnviada,
  Aterrizaje,
  AterrizajeInvitacion,
  ErrorPublico,
  EstadoCurso,
  Finalizado,
  Identificacion,
  Inscrito,
  LeccionCompleta,
  MotivoPublico,
  ProgresoGuardado,
  Verificacion,
} from "@/types/participacion";

const publico = axios.create({
  baseURL: API_URL,
  // La cookie de sesión del participante es `HttpOnly`: el navegador la manda,
  // el JavaScript no la ve. Sin esto no viaja y toda reanudación falla.
  withCredentials: true,
});

const MOTIVOS: readonly MotivoPublico[] = [
  "enlace_no_disponible",
  "participacion_cerrada",
  "sesion_invalida",
  "datos_invalidos",
  "orden_no_respetado",
  "leccion_no_valida",
  "texto_cambio",
  "demasiadas_peticiones",
  "constancia_no_encontrada",
  "requiere_invitacion",
  "invitacion_no_disponible",
];

/**
 * Traduce un fallo a un error con `motivo`, que es por lo que la interfaz elige
 * pantalla.
 *
 * Un fallo de red **no** se disfraza de `enlace_no_disponible`: quedarían el
 * túnel del metro y un enlace revocado mostrando lo mismo, y son cosas
 * distintas para quien está delante. Lo desconocido se marca como tal y la
 * pantalla ofrece reintentar.
 */
function errorPublico(e: unknown, respaldo: string): ErrorPublico {
  const err = e as {
    response?: { status?: number; data?: { detail?: unknown } };
    message?: string;
  };
  const detalle = err?.response?.data?.detail;

  let motivo: ErrorPublico["motivo"] = "desconocido";
  let mensaje = respaldo;
  let textoVigente: Record<string, unknown> | null | undefined;

  if (detalle && typeof detalle === "object") {
    const d = detalle as {
      motivo?: string;
      mensaje?: string;
      texto_vigente?: Record<string, unknown> | null;
    };
    if (d.motivo && (MOTIVOS as readonly string[]).includes(d.motivo)) {
      motivo = d.motivo as MotivoPublico;
    }
    if (d.mensaje) mensaje = d.mensaje;
    textoVigente = d.texto_vigente;
  } else if (typeof detalle === "string") {
    mensaje = detalle;
  }

  const salida = new Error(mensaje) as ErrorPublico;
  salida.motivo = motivo;
  salida.status = err?.response?.status;
  if (textoVigente !== undefined) salida.texto_vigente = textoVigente;
  return salida;
}

/** D-01. No consume cupo: se puede abrir tantas veces como haga falta. */
export async function abrirEnlace(token: string): Promise<Aterrizaje> {
  try {
    const { data } = await publico.get<Aterrizaje>(`/c/${encodeURIComponent(token)}`);
    return data;
  } catch (e) {
    throw errorPublico(e, "No pudimos abrir este enlace.");
  }
}

/**
 * D-02. Identifica, consiente e inscribe.
 *
 * El servidor deja la cookie de sesión; aquí no se guarda nada. El `secreto` que
 * devuelve se muestra **una vez** y no se persiste en el navegador: guardarlo en
 * `localStorage` lo dejaría legible por cualquier script de la página, que es
 * justo lo que la cookie `HttpOnly` evita.
 */
export async function inscribirse(
  token: string,
  datos: Identificacion
): Promise<Inscrito> {
  try {
    const { data } = await publico.post<Inscrito>(
      `/c/${encodeURIComponent(token)}/inscribir`,
      datos
    );
    return data;
  } catch (e) {
    throw errorPublico(e, "No pudimos completar tu inscripción.");
  }
}

/** D-03. El curso de quien tiene la cookie. Mismo dispositivo, sin teclear nada. */
export async function miCurso(): Promise<EstadoCurso> {
  try {
    const { data } = await publico.get<EstadoCurso>("/c/sesion/estado");
    return data;
  } catch (e) {
    throw errorPublico(e, "No pudimos recuperar tu curso.");
  }
}

/**
 * D-02b. Reanudar en otro dispositivo.
 *
 * Solo con el secreto. El número de documento no sirve y no hay endpoint que lo
 * acepte: quien tuviera el enlace del grupo y conociera el documento de un
 * compañero podría continuar su curso.
 */
export async function reanudar(secreto: string): Promise<EstadoCurso> {
  try {
    const { data } = await publico.post<EstadoCurso>("/c/sesion/reanudar", { secreto });
    return data;
  } catch (e) {
    throw errorPublico(e, "No pudimos reanudar con ese código.");
  }
}

/** D-06. El contenido de una lección. Una por petición, no el curso entero. */
export async function leerLeccion(leccionId: string): Promise<LeccionCompleta> {
  try {
    const { data } = await publico.get<LeccionCompleta>(
      `/c/sesion/leccion/${encodeURIComponent(leccionId)}`
    );
    return data;
  } catch (e) {
    throw errorPublico(e, "No pudimos abrir esta lección.");
  }
}

/**
 * D-06. Guarda el avance. Idempotente y sin retroceso: reenviar un número menor
 * no borra progreso, así que se puede llamar sin miedo al reintentar.
 */
export async function guardarProgreso(
  leccionId: string,
  bloquesVistos: number
): Promise<ProgresoGuardado> {
  try {
    const { data } = await publico.post<ProgresoGuardado>("/c/sesion/progreso", {
      leccion_id: leccionId,
      bloques_vistos: bloquesVistos,
    });
    return data;
  } catch (e) {
    throw errorPublico(e, "No pudimos guardar tu avance.");
  }
}

/** D-08. Cierra el curso y deja la asistencia registrada. Idempotente. */
export async function finalizar(): Promise<Finalizado> {
  try {
    const { data } = await publico.post<Finalizado>("/c/sesion/finalizar");
    return data;
  } catch (e) {
    throw errorPublico(e, "No pudimos registrar tu asistencia.");
  }
}

/**
 * D-10. Verifica una constancia por su código. **Sin sesión.**
 *
 * No usa la instancia autenticada ni ninguna cookie: quien verifica es alguien
 * ajeno —un inspector con el papel delante— y pedirle que se registre
 * convertiría la verificación en un trámite que nadie hace.
 *
 * El código se manda tal como lo teclearon. Normalizarlo aquí duplicaría una
 * regla que el servidor ya aplica, y las dos copias divergirían.
 */
export async function verificarConstancia(codigo: string): Promise<Verificacion> {
  try {
    const { data } = await publico.get<Verificacion>(
      `/c/verificar/${encodeURIComponent(codigo.trim())}`
    );
    return data;
  } catch (e) {
    throw errorPublico(e, "No pudimos verificar ese código.");
  }
}

/** D-01b. Abre una invitación personal. **No la consume.** */
export async function abrirInvitacion(token: string): Promise<AterrizajeInvitacion> {
  try {
    const { data } = await publico.get<AterrizajeInvitacion>(
      `/c/i/${encodeURIComponent(token)}`
    );
    return data;
  } catch (e) {
    throw errorPublico(e, "No pudimos abrir esta invitación.");
  }
}

/**
 * D-02c. Consume la invitación e inscribe.
 *
 * **Solo manda las aceptaciones.** Ningún dato de identidad: la persona sale de
 * la invitación, no de este cuerpo, y por eso no hay forma de afirmar ser otro.
 */
export async function aceptarInvitacion(
  token: string,
  aceptaciones: AceptacionEnviada[]
): Promise<Inscrito> {
  try {
    const { data } = await publico.post<Inscrito>(
      `/c/i/${encodeURIComponent(token)}/aceptar`,
      { aceptaciones }
    );
    return data;
  } catch (e) {
    throw errorPublico(e, "No pudimos completar tu inscripción.");
  }
}
