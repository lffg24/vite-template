import { requestJson } from "./httpClient";

export type NivelRiesgo = "SIN_RIESGO" | "MUY_BAJO" | "BAJO" | "MEDIO" | "ALTO" | "MUY_ALTO" | string;

export type PsicoEvaluacionEmpleado = {
  aplicacion_id?: number;
  evaluacion_id: number;
  instrument_code: string;
  nombre?: string | null;
  label?: string | null;
  total_preguntas: number;
  respondidas: number;
  score_count: number;
  puntaje_transformado?: number | null;
  nivel_riesgo?: NivelRiesgo | null;
  estado_respuestas: "sin_iniciar" | "borrador" | "completa" | "calculada" | "finalizada" | string;
  editable: boolean;
};

export type PsicoAplicacionEmpleado = {
  aplicacion_id: number;
  nombre: string;
  estado?: string | null;
  fecha_aplicacion?: string | null;
  updated_at?: string | null;
  created_at?: string | null;
  evaluaciones: PsicoEvaluacionEmpleado[];
  formulario_intra: string;
  tiene_a: boolean;
  tiene_b: boolean;
  tiene_extra: boolean;
  tiene_estres: boolean;
  bateria_completa: boolean;
  completitud_bateria: number;
  estado_bateria: string;
  errores: string[];
  riesgo_mas_alto?: NivelRiesgo | null;
  puede_registrar: boolean;
};

export type PsicoEmpleadoPerfil = {
  empleado_id: number;
  empresa_id: string;
  cedula?: string | null;
  nombre_completo?: string | null;
  nombres?: string | null;
  apellidos?: string | null;
  correo?: string | null;
  telefono?: string | null;
  sexo?: string | null;
  anio_nacimiento?: number | null;
  edad?: number | null;
  estado_civil?: string | null;
  nivel_estudios?: string | null;
  ocupacion?: string | null;
  estrato?: number | string | null;
  tipo_vivienda?: string | null;
  personas_dependen?: number | null;
  empresa?: string | null;
  cargo?: string | null;
  area?: string | null;
  tipo_cargo?: string | null;
  tipo_contrato?: string | null;
  horas_diarias?: number | null;
  tipo_salario?: string | null;
  antiguedad_empresa_anios?: number | null;
  antiguedad_cargo_anios?: number | null;
  ultima_actualizacion?: string | null;
  completitud_perfil?: number | null;
  aplicaciones?: PsicoAplicacionEmpleado[];
  resumen_aplicaciones?: { total: number; completas: number; activas: number };
};

export type PsicoAplicacionesEmpleadoResponse = {
  empleado_id: number;
  aplicaciones: PsicoAplicacionEmpleado[];
  resumen: { total: number; completas: number; activas: number };
};

export type PreguntaRespuesta = {
  pregunta_id: number;
  orden: number;
  texto: string;
  parametros?: any;
  respuesta?: string | null;
  dimension_label?: string | null;
  dimension_code?: string | null;
  dominio_label?: string | null;
  dominio_code?: string | null;
};

export type RespuestasEvaluacionResponse = {
  empleado_id: number;
  evaluacion_id: number;
  total_preguntas: number;
  respondidas: number;
  estado_captura?: string | null;
  observaciones?: string | null;
  finalizado_en?: string | null;
  preguntas: PreguntaRespuesta[];
};

export type PsicoResultadoIndividual = {
  empleado_id: number;
  aplicacion_id: number;
  totales: Array<Record<string, unknown>>;
  dominios: Array<Record<string, unknown>>;
  dimensiones: Array<Record<string, unknown>>;
};

export function obtenerPerfilPsicoEmpleado(empleadoId: number | string) {
  return requestJson<PsicoEmpleadoPerfil>(`/psicosocial/empleados/${empleadoId}/perfil`);
}

export function obtenerAplicacionesPsicoEmpleado(empleadoId: number | string) {
  return requestJson<PsicoAplicacionesEmpleadoResponse>(`/psicosocial/empleados/${empleadoId}/aplicaciones`);
}

export function obtenerAplicacionesDisponiblesPsicoEmpleado(empleadoId: number | string) {
  return requestJson<PsicoAplicacionesEmpleadoResponse>(`/psicosocial/empleados/${empleadoId}/aplicaciones-disponibles`);
}

export function obtenerRespuestasPsicoEmpleado(empleadoId: number | string, evaluacionId: number | string) {
  return requestJson<RespuestasEvaluacionResponse>(`/psicosocial/evaluaciones/${evaluacionId}/empleados/${empleadoId}/respuestas`);
}

export function guardarRespuestasPsicoEmpleado(
  empleadoId: number | string,
  evaluacionId: number | string,
  respuestas: Array<{ pregunta_id: number; orden?: number; respuesta?: string | null }>,
  finalizar = false,
  observaciones = "",
) {
  return requestJson<{ ok: boolean; respondidas: number; total: number; estado: string }>(
    `/psicosocial/evaluaciones/${evaluacionId}/empleados/${empleadoId}/respuestas`,
    { method: "PUT", body: JSON.stringify({ respuestas, finalizar, observaciones }) },
  );
}

export function finalizarRespuestasPsicoEmpleado(empleadoId: number | string, evaluacionId: number | string) {
  return requestJson<{ ok: boolean }>(`/psicosocial/evaluaciones/${evaluacionId}/empleados/${empleadoId}/finalizar`, {
    method: "POST",
  });
}

export function obtenerResultadosPsicoEmpleado(empleadoId: number | string, aplicacionId: number | string) {
  return requestJson<PsicoResultadoIndividual>(`/psicosocial/empleados/${empleadoId}/aplicaciones/${aplicacionId}/resultados`);
}

export type FichaSociodemografica = {
  sexo?: string | null;
  anio_nacimiento?: number | null;
  edad?: number | null;
  estado_civil?: string | null;
  nivel_estudios?: string | null;
  ocupacion_profesion?: string | null;
  ciudad_residencia?: string | null;
  departamento_residencia?: string | null;
  ciudad_trabajo?: string | null;
  departamento_trabajo?: string | null;
  estrato?: string | null;
  tipo_vivienda?: string | null;
  personas_dependen?: number | null;
  area?: string | null;
  cargo?: string | null;
  tipo_cargo?: string | null;
  tipo_contrato?: string | null;
  tipo_salario?: string | null;
  horas_diarias_trabajo?: number | null;
  antiguedad_empresa?: string | null;
  antiguedad_cargo?: string | null;
  estado?: string | null;
  datos?: Record<string, unknown>;
};

export function obtenerFichaSociodemografica(empleadoId: number | string, aplicacionId: number | string) {
  return requestJson<{ ok: boolean; item: FichaSociodemografica; completa: boolean }>(
    `/psicosocial/empleados/${empleadoId}/aplicaciones/${aplicacionId}/ficha-sociodemografica`,
  );
}

export function guardarFichaSociodemografica(
  empleadoId: number | string,
  aplicacionId: number | string,
  payload: FichaSociodemografica & { finalizar?: boolean },
) {
  return requestJson<{ ok: boolean; estado: string; completa: boolean }>(
    `/psicosocial/empleados/${empleadoId}/aplicaciones/${aplicacionId}/ficha-sociodemografica`,
    { method: "PUT", body: JSON.stringify(payload) },
  );
}

export type PsicoCatalogoItem = { id?: number | string; nombre: string };
export type MunicipioCatalogoItem = { id: number; municipio: string; departamento?: string | null };

export function obtenerCatalogosSociodemograficos() {
  return requestJson<{
    ok: boolean;
    estado_civil: PsicoCatalogoItem[];
    nivel_estudios: PsicoCatalogoItem[];
    tipo_vivienda: PsicoCatalogoItem[];
    tipo_cargo: PsicoCatalogoItem[];
    tipo_contrato: PsicoCatalogoItem[];
    tipo_salario: PsicoCatalogoItem[];
  }>(`/psicosocial/catalogos/sociodemograficos`);
}

export function buscarMunicipiosPsico(q: string) {
  const params = new URLSearchParams({ q });
  return requestJson<{ ok: boolean; items: MunicipioCatalogoItem[] }>(`/psicosocial/catalogos/municipios?${params.toString()}`);
}
