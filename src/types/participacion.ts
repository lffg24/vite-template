// src/types/participacion.ts
//
// Espejo TypeScript de `backend/hseq/capacitaciones/esquemas_publicos.py`.
//
// Separado de `capacitaciones.ts` a propósito: aquello es la superficie
// administrativa, autenticada. Esto es el recorrido público, donde **no hay
// sesión de usuario** y el inquilino sale del enlace. Mezclarlos haría fácil que
// un tipo administrativo acabara describiendo una respuesta pública.

/** Documentos de identidad admitidos en Colombia. */
export const TIPOS_DOCUMENTO = ["CC", "CE", "TI", "PA", "PPT"] as const;
export type TipoDocumento = (typeof TIPOS_DOCUMENTO)[number];

export const ETIQUETA_DOCUMENTO: Record<TipoDocumento, string> = {
  CC: "Cédula de ciudadanía",
  CE: "Cédula de extranjería",
  TI: "Tarjeta de identidad",
  PA: "Pasaporte",
  PPT: "Permiso por Protección Temporal",
};

/**
 * Un texto legal tal como se presentó.
 *
 * `texto_id` viaja de vuelta al aceptar porque la aceptación se registra contra
 * **la versión exacta que se mostró**. Entre que la pantalla se pinta y la
 * persona marca la casilla cabe una publicación nueva, y sin este dato la
 * aceptación quedaría contra un texto que nadie leyó.
 */
export interface TextoPresentado {
  clave: string;
  texto_id: string;
  version: number;
  /** La Ley 1581 exige informarla, así que la pantalla la muestra. */
  finalidad: string | null;
  contenido: string;
}

/** D-01. Lo que se ve antes de identificarse: sin datos de nadie. */
export interface Aterrizaje {
  curso: string;
  empresa: string;
  numero_version: number;
  lecciones: number;
  duracion_estimada_min: number | null;
  textos: TextoPresentado[];
}

export interface AceptacionEnviada {
  clave: string;
  texto_id_presentado: string;
}

export interface Identificacion {
  tipo_documento: TipoDocumento;
  numero_documento: string;
  nombres: string;
  apellidos: string;
  /** Opcionales de verdad: el PRD admite participantes sin ninguno de los dos. */
  cargo?: string | null;
  correo?: string | null;
  telefono?: string | null;
  aceptaciones: AceptacionEnviada[];
}

/**
 * `secreto` llega **solo cuando la inscripción es nueva**.
 *
 * Reinscribirse devuelve nulo a propósito: emitir otro invalidaría la sesión que
 * la persona quizá tiene abierta en otro dispositivo. La pantalla debe mostrarlo
 * una vez y no volver a pedirlo.
 */
export interface Inscrito {
  inscripcion_id: string;
  estado: "EN_CURSO" | "COMPLETADA";
  nueva: boolean;
  secreto: string | null;
}

export interface LeccionEnCurso {
  leccion_id: string;
  orden: number;
  titulo: string;
  tipo: string;
  obligatoria: boolean;
  bloques_totales: number;
  bloques_vistos: number;
  completada: boolean;
  /**
   * Lo calcula el servidor. **No se recalcula aquí.** Una regla que solo viva en
   * el cliente se salta escribiendo la URL, y el backend la vuelve a comprobar
   * de todos modos.
   */
  desbloqueada: boolean;
}

export interface EstadoCurso {
  curso: string;
  numero_version: number;
  estado: "EN_CURSO" | "COMPLETADA";
  lecciones: LeccionEnCurso[];
  obligatorias_completas: number;
  obligatorias_totales: number;
  puede_finalizar: boolean;
}

export interface ProgresoGuardado {
  leccion_id: string;
  bloques_vistos: number;
  bloques_totales: number;
  completada_en: string | null;
}

export interface Finalizado {
  estado: "COMPLETADA";
  /** `null` cuando ya estaba finalizada: no se registra asistencia dos veces. */
  asistencia_id: string | null;
  nueva: boolean;
}

/**
 * Los códigos que decide el servidor. La interfaz elige pantalla por `motivo`,
 * **nunca por el texto**: el mensaje se puede reescribir sin avisar y entonces
 * la comparación por cadena fallaría en silencio.
 *
 * Los cuatro casos malos del enlace comparten `enlace_no_disponible` a
 * propósito. Distinguirlos revelaría que el enlace existió, o cuánta gente hay
 * en esa empresa.
 */
export type MotivoPublico =
  | "enlace_no_disponible"
  | "participacion_cerrada"
  | "sesion_invalida"
  | "datos_invalidos"
  | "orden_no_respetado"
  | "leccion_no_valida"
  | "texto_cambio"
  | "demasiadas_peticiones";

export interface ErrorPublico extends Error {
  motivo: MotivoPublico | "desconocido";
  status?: number;
  /** Solo en `texto_cambio`: la redacción nueva, para volver a presentarla. */
  texto_vigente?: Record<string, unknown> | null;
}
