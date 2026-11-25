// src/types/capacitaciones.ts
//
// Espejo TypeScript de `backend/hseq/capacitaciones/esquemas.py`.
//
// Dos ausencias deliberadas, heredadas del contrato del backend:
//
// - `empresa_id` NO aparece en ninguna entrada. Va en la cookie de sesión;
//   aceptarlo del cliente sería dejarle elegir inquilino.
// - El token de un enlace solo existe en `EnlaceCreado`, la respuesta que lo
//   crea. `EnlaceResumen` no lo lleva, y no hay endpoint que lo devuelva
//   después: solo se guarda su hash.

export const CATEGORIAS_CURSO = ["SST", "PESV", "GENERAL"] as const;
export type CategoriaCurso = (typeof CATEGORIAS_CURSO)[number];

export const ETIQUETA_CATEGORIA: Record<CategoriaCurso, string> = {
  SST: "Seguridad y Salud en el Trabajo",
  PESV: "Plan Estratégico de Seguridad Vial",
  GENERAL: "General",
};

export const TIPOS_LECCION = [
  "NATIVA",
  "VIDEO",
  "DOCUMENTO",
  "RECURSO_EXTERNO",
  "EVALUACION",
] as const;
export type TipoLeccion = (typeof TIPOS_LECCION)[number];

/**
 * Lo que hoy se puede publicar de extremo a extremo.
 *
 * El backend rechaza publicar una versión con cualquier otro tipo: una lección
 * que nadie sabe reproducir produciría una asignación imposible de completar.
 * La interfaz lo refleja deshabilitando la opción con su motivo a la vista,
 * en vez de dejar que el usuario descubra el límite al pulsar «Publicar».
 */
export const TIPOS_LECCION_IMPLEMENTADOS: readonly TipoLeccion[] = [
  "NATIVA",
  "VIDEO",
  "DOCUMENTO",
  "EVALUACION",
];

/** Los que se reproducen desde una URL externa y por tanto exigen material. */
export const TIPOS_LECCION_CON_RECURSO: readonly TipoLeccion[] = [
  "VIDEO",
  "DOCUMENTO",
  "RECURSO_EXTERNO",
];

export const PROVEEDORES_RECURSO = ["YOUTUBE", "VIMEO", "DRIVE", "URL"] as const;
export type ProveedorRecurso = (typeof PROVEEDORES_RECURSO)[number];

/** Lo que lee quien redacta, no la clave que viaja. */
export const ETIQUETA_PROVEEDOR: Record<ProveedorRecurso, string> = {
  YOUTUBE: "YouTube",
  VIMEO: "Vimeo",
  DRIVE: "Google Drive",
  URL: "Enlace directo",
};

/**
 * Una pregunta del cuestionario, con su respuesta correcta.
 *
 * Este tipo es de la superficie AUTENTICADA — quien lo lee es quien redacta el
 * curso. Lo que ve el participante es otro tipo, en `types/participacion.ts`, y
 * no lleva `correcta`. Son dos tipos y no uno con el campo opcional a
 * propósito: un opcional se olvida de rellenar y también de quitar.
 */
export const TIPOS_PREGUNTA = [
  "OPCION_UNICA",
  "OPCION_MULTIPLE",
  "VERDADERO_FALSO",
] as const;
export type TipoPregunta = (typeof TIPOS_PREGUNTA)[number];

export const ETIQUETA_TIPO_PREGUNTA: Record<TipoPregunta, string> = {
  OPCION_UNICA: "Selección única",
  OPCION_MULTIPLE: "Selección múltiple",
  VERDADERO_FALSO: "Verdadero / Falso",
};

export const AYUDA_TIPO_PREGUNTA: Record<TipoPregunta, string> = {
  OPCION_UNICA: "Una sola respuesta",
  OPCION_MULTIPLE: "Varias respuestas",
  VERDADERO_FALSO: "Dos opciones",
};

/** Las pone el sistema, no quien redacta. El índice 0 es «Verdadero» siempre. */
export const OPCIONES_VERDADERO_FALSO = ["Verdadero", "Falso"] as const;

export interface PreguntaLeccion {
  tipo: TipoPregunta;
  enunciado: string;
  /** Ausente en verdadero/falso: sus opciones las pone el sistema. */
  opciones?: string[];
  /** Índices correctos, desde 0. Uno solo salvo en selección múltiple. */
  correctas: number[];
  /** Cuánto pesa en la nota. La nota sale de puntos, no de preguntas. */
  puntos: number;
  retroalimentacion_correcta?: string;
  retroalimentacion_incorrecta?: string;
}

export interface EvaluacionLeccion {
  nota_minima: number;
  intentos_max: number;
  preguntas: PreguntaLeccion[];
}

export const NOTA_MINIMA_DEFECTO = 70;
export const INTENTOS_DEFECTO = 1;
export const PUNTOS_DEFECTO = 1;
export const OPCIONES_MIN = 2;
export const OPCIONES_MAX = 6;
export const PREGUNTAS_MAX = 50;

export interface RecursoLeccion {
  proveedor: ProveedorRecurso;
  url: string;
  titulo: string;
  duracion_seg?: number | null;
  paginas?: number | null;
}

export const ETIQUETA_TIPO_LECCION: Record<TipoLeccion, string> = {
  NATIVA: "Contenido nativo",
  VIDEO: "Video",
  DOCUMENTO: "Documento",
  RECURSO_EXTERNO: "Recurso externo",
  EVALUACION: "Evaluación",
};

/** Un recurso externo nunca cuenta para la finalización (PRD §10). */
export const TIPOS_LECCION_NUNCA_OBLIGATORIOS: readonly TipoLeccion[] = [
  "RECURSO_EXTERNO",
];

export type EstadoCurso = "BORRADOR" | "PUBLICADO" | "ARCHIVADO";
export type EstadoAsignacion = "ACTIVA" | "CERRADA";
export type EstadoEnlace = "ACTIVO" | "REVOCADO";

export const VIGENCIA_ENLACE_DIAS_DEFAULT = 30;
export const VIGENCIA_ENLACE_DIAS_MAX = 365;

// --- cursos ------------------------------------------------------------------

export interface CursoResumen {
  id: string;
  titulo: string;
  categoria: CategoriaCurso;
  categoria_restringida: boolean;
  estado: EstadoCurso;
  version_actual: number;
  intensidad_horaria_min: number | null;
  vigencia_meses: number | null;
  lecciones: number;
}

export interface CursoCrear {
  titulo: string;
  categoria: CategoriaCurso;
  descripcion?: string | null;
  objetivos?: string | null;
  temario?: string | null;
  intensidad_horaria_min?: number | null;
  responsable_contenido?: string | null;
  categoria_restringida?: boolean;
  vigencia_meses?: number | null;
}

/**
 * `undefined` significa «no tocar». No se envía `null` para dejar un campo en
 * blanco salvo que se quiera exactamente eso: el backend usa PATCH justamente
 * para que un formulario parcial no borre lo que otra pestaña acaba de guardar.
 */
export type CursoEditar = Partial<Omit<CursoCrear, "categoria_restringida">>;

export interface CursoCabecera {
  id: string;
  titulo: string;
  categoria: CategoriaCurso;
  categoria_restringida: boolean;
  estado: EstadoCurso;
  version_actual: number;
  descripcion: string | null;
  objetivos: string | null;
  temario: string | null;
  intensidad_horaria_min: number | null;
  responsable_contenido: string | null;
  vigencia_meses: number | null;
}

export interface Leccion {
  id: string;
  orden: number;
  tipo: TipoLeccion;
  titulo: string;
  bloques: BloqueLeccion[] | null;
  /** Solo en los tipos que se reproducen desde una URL. */
  recurso: RecursoLeccion | null;
  /** Solo en las lecciones de evaluación que llevan el cuestionario dentro. */
  evaluacion: EvaluacionLeccion | null;
  /**
   * La otra forma de tener cuestionario: una versión publicada del banco.
   *
   * Excluyente con `evaluacion` — el servidor rechaza las dos a la vez porque
   * dejarían sin decidir cuál se congela al publicar el curso.
   */
  cuestionario_version_id: string | null;
  duracion_estimada_min: number | null;
  obligatoria: boolean;
}

/**
 * Un bloque de una lección nativa. El backend lo guarda como JSONB sin
 * imponerle forma, así que el contrato real de esta estructura vive aquí.
 */
export interface BloqueLeccion {
  tipo: "texto" | "lista" | "destacado";
  titulo?: string;
  contenido: string;
}

export interface CursoDetalle {
  curso: CursoCabecera;
  lecciones: Leccion[];
  /**
   * Lo que impide publicar, en español y calculado por el servidor.
   *
   * Llega en el detalle para que A-05 pinte el checklist sin tener que
   * intentar publicar y leer el error. Vacío significa publicable.
   */
  faltantes: string[];
}

export interface LeccionCrear {
  tipo: TipoLeccion;
  titulo: string;
  bloques?: BloqueLeccion[] | null;
  /**
   * El material. Se manda entero y el servidor registra uno NUEVO cada vez, en
   * vez de actualizar el anterior: una versión publicada congeló la URL que
   * tenía, y reescribir la fila cambiaría también lo que ya se publicó.
   */
  recurso?: RecursoLeccion | null;
  evaluacion?: EvaluacionLeccion | null;
  /** La versión publicada del banco. Excluyente con `evaluacion`. */
  cuestionario_version_id?: string | null;
  duracion_estimada_min?: number | null;
  obligatoria?: boolean;
}

export type LeccionEditar = Partial<Omit<LeccionCrear, "tipo">>;

export interface VersionPublicada {
  version_id: string;
  numero: number;
}

// --- asignaciones -------------------------------------------------------------

/**
 * Quién afirma la identidad de cada participante. Decide qué se reparte.
 *
 * Se manda SIEMPRE, aunque el backend tenga defecto: omitirlo dejaba todas las
 * asignaciones en `INVITACION_INDIVIDUAL` sin que nadie lo hubiera elegido, y
 * con ese modo el enlace de grupo no sirve para inscribirse.
 */
export type ModoIdentidad = "INVITACION_INDIVIDUAL" | "AUTODECLARADA";

export interface AsignacionCrear {
  curso_version_id: string;
  fecha_objetivo?: string | null;
  vigencia_meses?: number | null;
  modo_identidad: ModoIdentidad;
}

export interface AsignacionCreada {
  asignacion_id: string;
  curso_id: string;
  curso_version_id: string;
  numero_version: number;
  vigencia_meses: number | null;
}

/**
 * Una opción del selector de A-11.
 *
 * `ya_asignada` llega calculada por el servidor porque el 409 de duplicado es
 * evitable: la pantalla deshabilita la opción en vez de dejar que el usuario la
 * elija y reciba un error por algo que el sistema ya sabía.
 */
export interface VersionAsignable {
  curso_version_id: string;
  numero_version: number;
  publicado_en: string;
  curso_id: string;
  curso_titulo: string;
  categoria: CategoriaCurso;
  categoria_restringida: boolean;
  intensidad_horaria_min: number | null;
  vigencia_meses: number | null;
  ya_asignada: boolean;
}

export interface AsignacionResumen {
  id: string;
  curso_id: string;
  curso_titulo: string;
  curso_version_id: string;
  numero_version: number;
  fecha_objetivo: string | null;
  vigencia_meses: number | null;
  estado: EstadoAsignacion;
  modo_identidad: ModoIdentidad;
  enlaces_activos: number;
  creado_en: string;
}

// --- enlaces --------------------------------------------------------------------

export interface EnlaceCrear {
  vigencia_dias?: number;
  cupo_max?: number | null;
}

/** La única forma en la que el token existe del lado del cliente. */
export interface EnlaceCreado {
  enlace_id: string;
  token: string;
  expira_en: string;
  cupo_max: number | null;
  curso: string;
}

export interface EnlaceResumen {
  id: string;
  asignacion_id: string;
  expira_en: string;
  cupo_max: number | null;
  usos: number;
  estado: EstadoEnlace;
  /** Lo calcula la base con su propio reloj, no el navegador. */
  utilizable: boolean;
  creado_en: string;
  revocado_en: string | null;
}

// --- estado del módulo (A-08) -----------------------------------------------------

/**
 * Las tres condiciones por separado, nunca colapsadas en un `activo`.
 *
 * «No lo compró», «lo apagamos» y «la bandera no está declarada» se arreglan de
 * formas distintas; un único booleano obligaría a diagnosticar por eliminación.
 * `null` en una bandera significa **no declarada**: bloquea igual que apagada,
 * pero es configuración que falta, no una decisión que alguien tomó.
 */
export interface ModuloEstado {
  contratado: boolean;
  vigencia_hasta: string | null;
  /** Con override de empresa: el que gobierna esta empresa. */
  bandera_catalogo: boolean | null;
  /**
   * Sin override: el que gobierna el catálogo, que es global.
   *
   * Se muestran los dos porque cuando difieren, A-08 es el único sitio donde
   * eso se puede ver — y difieren justo cuando alguien apagó el módulo para una
   * empresa sin tocar el contenido editorial.
   */
  bandera_catalogo_global: boolean | null;
  bandera_asignacion: boolean | null;
  /**
   * Si el RECORRIDO PÚBLICO abre para esta empresa.
   *
   * No gobierna nada de la administración —quien asigna puede asignar sin
   * ella— pero decide si lo que se reparte va a servir. `null` es «no
   * declarada», que cierra igual que apagada.
   */
  bandera_participacion: boolean | null;
  operable: boolean;
}

/**
 * Lo que la interfaz consulta para saber qué pintar. **Contrato único.**
 *
 * Antes había dos verdades: el backend leía `role_assignments` con alcance y
 * esta interfaz leía la lista plana de permisos que el login dejó en la sesión,
 * que sale del RBAC global y no conoce las asignaciones con alcance. Divergían
 * en las dos direcciones, y la peor es la que ofrece una acción que la API va a
 * rechazar con un 403 que el usuario no puede arreglar.
 *
 * Los `puede_*` **no son permisos**: son permiso + contrato + bandera, ya
 * resueltos por el servidor. Nunca se recombinan aquí.
 */
export interface ContextoCapacidades {
  empresa_id: string;
  roles_plataforma: string[];

  /** Catálogo: bandera global + permiso de plataforma. Sin contrato. */
  puede_editar_catalogo: boolean;
  puede_publicar: boolean;
  /** Asignaciones: superficie de inquilino. Las tres condiciones. */
  puede_asignar: boolean;
  /** Mantener la nómina. Permiso propio: es otro trabajo. */
  puede_gestionar_participantes: boolean;
  /** Si es falso, el módulo no debe aparecer en la navegación. */
  tiene_acceso: boolean;

  // --- diagnóstico, para explicar un «no». Nunca para decidirlo. ---
  permisos_plataforma: string[];
  permisos_empresa: string[];
  /** `null` cuando no hay acceso: el estado comercial no lo lee cualquiera. */
  contratado: boolean | null;
  vigencia_hasta: string | null;
  bandera_catalogo: boolean | null;
  bandera_catalogo_empresa: boolean | null;
  bandera_asignacion: boolean | null;
  /**
   * Si el RECORRIDO PÚBLICO abre para esta empresa.
   *
   * No gobierna nada de la administración —quien asigna puede asignar sin
   * ella— pero decide si lo que se reparte va a servir. `null` es «no
   * declarada», que cierra igual que apagada.
   */
  bandera_participacion: boolean | null;
}

// --- errores ----------------------------------------------------------------------

/**
 * Error de la API con el estado HTTP a la vista.
 *
 * El código importa porque el backend distingue con cuidado: 404 para un
 * identificador de otra empresa (403 confirmaría que existe), 403 para
 * contrato/bandera/permiso, 422 con la lista de faltantes al publicar, 409 por
 * asignación duplicada. La interfaz no puede tratarlos como «algo salió mal».
 */
export interface ErrorApi extends Error {
  status?: number;
  /** Presente solo en el 422 de publicación. */
  faltantes?: string[];
}

// --- B-05 · constancias ------------------------------------------------------------------

/**
 * Una fila del listado administrativo.
 *
 * Lleva los nombres **completos**, a diferencia del verificador público: quien
 * administra su empresa ya tiene esos datos, y enmascararlos le impediría hacer
 * su trabajo.
 */
export interface ConstanciaResumen {
  id: string;
  folio: number;
  codigo_verificacion: string;
  estado: "VIGENTE" | "ANULADA";
  nombres: string | null;
  apellidos: string | null;
  curso: string | null;
  emitida_en: string;
  vence_el: string | null;
  anulada_en: string | null;
  anulacion_motivo: string | null;
  /**
   * Derivados por el servidor al leer.
   *
   * `estado` dice lo que se escribió; `situacion` le suma el vencimiento, que
   * no se escribe nunca porque es consecuencia de la fecha. Una tarea que
   * «pasara a VENCIDA» fallaría un día y dejaría constancias afirmando una
   * vigencia que ya no tienen.
   */
  situacion: "VIGENTE" | "VENCIDA" | "ANULADA" | null;
  dias_para_vencer: number | null;
  /** Vigente y dentro del umbral de aviso. El umbral lo pone el servidor. */
  por_vencer: boolean;
}

export interface ConstanciaEmitidaAdmin {
  id: string;
  folio: number;
  codigo_verificacion: string;
  estado: string;
  emitida_en: string;
  vence_el: string | null;
  /** Emitir es idempotente: `false` significa que ya existía, no que falló. */
  nueva: boolean;
}

// --- A-09 · participantes ------------------------------------------------------------

export interface ParticipanteResumen {
  id: string;
  tipo_documento: string;
  numero_documento: string;
  nombres: string;
  apellidos: string;
  cargo: string | null;
  correo: string | null;
  telefono: string | null;
  /**
   * `PUBLICO` = se autodeclaró por el enlace del grupo; `ADMIN` / `IMPORTACION`
   * = lo afirmó la empresa. Cambia lo que su constancia puede acreditar, así que
   * se muestra.
   */
  origen: "PUBLICO" | "ADMIN" | "IMPORTACION";
  creado_en: string;
  actualizado_en: string | null;
  inscripciones: number;
}

export interface ParticipanteCrear {
  tipo_documento: string;
  numero_documento: string;
  nombres: string;
  apellidos: string;
  cargo?: string | null;
  correo?: string | null;
  telefono?: string | null;
}

export interface ParticipanteEditar {
  nombres?: string;
  apellidos?: string;
  cargo?: string | null;
  correo?: string | null;
  telefono?: string | null;
}

// --- A-09.1 / A-09.2 · importación -----------------------------------------------------

export interface FilaAnalizada {
  fila: number;
  /**
   * `DUPLICADA` no es `ACTUALIZA`: el documento se repite DENTRO del archivo, y
   * ninguna de las dos filas se escribe.
   */
  resultado: "CREA" | "ACTUALIZA" | "RECHAZADA" | "DUPLICADA";
  errores: string[];
  datos: Record<string, string | null>;
  cambios: string[];
}

export interface VistaPreviaImportacion {
  resumen: {
    crea: number;
    actualiza: number;
    rechazadas: number;
    duplicadas: number;
    total: number;
  };
  filas: FilaAnalizada[];
  archivo_hash: string;
  columnas_opcionales: string[];
}

export interface ResultadoImportacion {
  creados: number;
  actualizados: number;
  rechazados: number;
  duplicados: number;
  total: number;
}

// --- invitaciones individuales ----------------------------------------------------------

export interface InvitacionEmitida {
  invitacion_id: string;
  participante_id: string;
  nombre: string;
  tipo_documento: string;
  numero_documento: string;
  /** **La única vez que llega.** El servidor guarda solo su SHA-256. */
  token: string;
  expira_en: string;
}

export interface InvitacionesGeneradas {
  curso: string;
  modo_identidad: string;
  emitidas: InvitacionEmitida[];
  /** Quien ya tenía una viva. No es un error. */
  omitidas: { participante_id: string; nombre: string; motivo: string }[];
}

export interface InvitacionResumen {
  id: string;
  participante_id: string;
  nombres: string;
  apellidos: string;
  tipo_documento: string;
  numero_documento: string;
  estado: "PENDIENTE" | "CONSUMIDA" | "REVOCADA";
  /** Caducada NO es revocada: una se acabó sola, la otra la retiró alguien. */
  utilizable: boolean;
  expira_en: string;
  creado_en: string;
  consumida_en: string | null;
  revocada_en: string | null;
  revocacion_motivo: string | null;
}


// --- seguimiento ---------------------------------------------------------------

/**
 * En qué punto está una persona dentro de una asignación.
 *
 * Cuatro y no tres: «invitado y no ha entrado» y «se le venció la invitación»
 * parecen lo mismo y piden acciones distintas —a uno se le recuerda, al otro
 * hay que volver a invitarlo—.
 */
export type SituacionParticipante =
  | "SIN_EMPEZAR"
  | "INVITACION_VENCIDA"
  | "EN_CURSO"
  | "COMPLETADO";

export interface AvanceParticipante {
  participante_id: string;
  nombres: string;
  apellidos: string;
  tipo_documento: string;
  numero_documento: string;
  cargo: string | null;
  correo: string | null;

  situacion: SituacionParticipante;
  obligatorias_completas: number;
  obligatorias_totales: number;

  invitacion_estado: string | null;
  invitacion_utilizable: boolean | null;
  invitada_en: string | null;

  inscripcion_id: string | null;
  iniciada_en: string | null;
  completada_en: string | null;
  ultima_actividad: string | null;

  constancia_codigo: string | null;
  constancia_estado: string | null;
  constancia_vence_el: string | null;
}

export interface AvanceAsignacion {
  asignacion: {
    id: string;
    curso_titulo: string;
    numero_version: number;
    estado: string;
    modo_identidad: ModoIdentidad;
    fecha_objetivo: string | null;
  };
  obligatorias_totales: number;
  /**
   * Si esta versión se puede medir.
   *
   * Las publicadas antes de que el snapshot congelara el id de cada lección no
   * tienen con qué casar el progreso: no se pueden cursar y tampoco medir.
   */
  version_medible: boolean;
  /** En modo autodeclarado no hay lista previa: no hay «faltan N» que dar. */
  hay_convocatoria: boolean;
  resumen: {
    personas: number;
    sin_empezar: number;
    invitacion_vencida: number;
    en_curso: number;
    completados: number;
    con_constancia: number;
  };
  participantes: AvanceParticipante[];
  /** Lo que llegó es una parte. La pantalla tiene que decirlo. */
  hay_mas: boolean;
  limite: number;
}

export interface AsignacionAtrasada {
  id: string;
  curso_titulo: string;
  fecha_objetivo: string;
  en_curso: number;
  sin_empezar: number;
}

export interface Tablero {
  asignaciones_activas: number;
  personas_en_curso: number;
  personas_completadas: number;
  sin_empezar: number;
  constancias_vigentes: number;
  constancias_por_vencer: number;
  constancias_vencidas: number;
  /** El umbral lo decide el servidor: repetirlo aquí lo dejaría viejo. */
  dias_aviso_vencimiento: number;
  atrasadas: AsignacionAtrasada[];
}

// --- R1 · matriz de capacitación ---------------------------------------------------

/** El estado de UNA persona en UN curso. Lo decide el servidor. */
export type EstadoCelda =
  | "VIGENTE"
  | "POR_VENCER"
  | "VENCIDA"
  | "EN_CURSO"
  | "PENDIENTE"
  | "ANULADA";

export interface CursoMatriz {
  curso_id: string;
  titulo: string;
  categoria: string | null;
}

export interface CeldaMatriz {
  curso_id: string;
  estado: EstadoCelda;
  /** Hasta cuándo vale, o cuándo venció. */
  vence_el: string | null;
}

export interface FilaMatriz {
  participante_id: string;
  nombres: string | null;
  apellidos: string | null;
  tipo_documento: string | null;
  numero_documento: string | null;
  cargo: string | null;
  /** Solo los cursos que se le pidieron: una celda ausente es «no aplica». */
  celdas: CeldaMatriz[];
  cumplidas: number;
  aplicables: number;
}

export interface MatrizCapacitacion {
  cursos: CursoMatriz[];
  filas: FilaMatriz[];
  total: number;
  pagina: number;
  por_pagina: number;
  /** Celdas por estado en TODA la empresa, no en la página. */
  resumen: Record<EstadoCelda, number>;
  /** El umbral de «por vencer», en días. Lo decide el servidor. */
  dias_aviso: number;
}
