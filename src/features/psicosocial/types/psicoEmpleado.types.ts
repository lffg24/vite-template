export type Nullable<T> = T | null | undefined;

export type PsicoEmpleadoPerfil = {
  empleado_id: number;
  empresa_id?: string;
  cedula: string;
  nombre_completo: string;
  sexo?: Nullable<string>;
  genero?: Nullable<string>;
  fecha_nacimiento?: Nullable<string>;
  anio_nacimiento?: Nullable<number>;
  edad?: Nullable<number>;
  estado_civil?: Nullable<string>;
  correo?: Nullable<string>;
  telefono?: Nullable<string>;
  nivel_estudios?: Nullable<string>;
  ocupacion?: Nullable<string>;
  ciudad_residencia?: Nullable<string>;
  departamento_residencia?: Nullable<string>;
  estrato?: Nullable<string | number>;
  tipo_vivienda?: Nullable<string>;
  personas_dependen?: Nullable<number>;
  ciudad_trabajo?: Nullable<string>;
  departamento_trabajo?: Nullable<string>;
  area?: Nullable<string>;
  cargo?: Nullable<string>;
  tipo_cargo?: Nullable<string>;
  tipo_contrato?: Nullable<string>;
  horas_diarias?: Nullable<number>;
  tipo_salario?: Nullable<string>;
  antiguedad_empresa_anios?: Nullable<number>;
  antiguedad_cargo_anios?: Nullable<number>;
  completitud_perfil?: Nullable<number>;
};

export type PsicoAplicacionEmpleado = {
  aplicacion_id: number;
  nombre: string;
  estado?: string;
  creada_en?: string;
  evaluaciones: PsicoEvaluacionDisponible[];
};

export type PsicoEvaluacionDisponible = {
  evaluacion_id: number;
  instrument_code: string;
  nombre: string;
  total_preguntas?: number;
  respondidas?: number;
  estado_respuestas?: string;
};

export type PsicoEmpleadoResultados = {
  empleado_id: number;
  aplicacion_id: number;
  totales: Array<{
    evaluacion_id: number;
    instrument_code: string;
    total_code: string;
    puntaje_transformado: number | null;
    nivel_riesgo: string | null;
  }>;
  dominios: Array<{
    evaluacion_id: number;
    instrument_code: string;
    dominio_code: string;
    dominio: string;
    puntaje_transformado: number | null;
    nivel_riesgo: string | null;
  }>;
  dimensiones: Array<{
    evaluacion_id: number;
    instrument_code: string;
    dominio_code?: string | null;
    dominio?: string | null;
    dimension_code: string;
    dimension: string;
    puntaje_transformado: number | null;
    nivel_riesgo: string | null;
  }>;
};

export type PsicoPreguntaRespuesta = {
  pregunta_id: number;
  orden: number;
  texto: string;
  dimension_code?: string | null;
  dimension?: string | null;
  dominio?: string | null;
  respuesta?: string | null;
  valor?: number | null;
  es_obligatoria?: boolean;
};

export type SaveRespuestasPayload = {
  respuestas: Array<{ pregunta_id: number; orden: number; respuesta: string | null }>;
  finalizar?: boolean;
};
