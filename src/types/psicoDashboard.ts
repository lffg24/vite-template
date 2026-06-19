export type NivelRiesgo = "MUY_BAJO" | "SIN_RIESGO" | "BAJO" | "MEDIO" | "ALTO" | "MUY_ALTO" | "SIN_NIVEL";

export interface PsicoAplicacionItem {
  id: number;
  nombre: string;
  descripcion?: string | null;
  estado?: string | null;
  fecha_aplicacion?: string | null;
  created_at?: string | null;
  evaluaciones?: number;
}

export interface CalidadBateria {
  personas_unicas: number;
  con_a: number;
  con_b: number;
  con_extra: number;
  con_estres: number;
  bateria_completa_correcta: number;
  error_con_a_y_b: number;
  error_sin_intra: number;
  error_sin_extra: number;
  error_sin_estres: number;
  porcentaje_completitud: number;
  errores: number;
  estado: "OK" | "REVISAR" | string;
}

export interface TotalPsico {
  evaluacion_id: number;
  instrument_code: string;
  grupo_forma?: "FORMA_A" | "FORMA_B" | "SIN_FORMA" | string | null;
  instrument_group_code?: string | null;
  instrument_label: string;
  total_code: string;
  total_label: string;
  n: number;
  promedio_transformado: number;
  min_transformado: number;
  max_transformado: number;
  riesgo_sin?: number;
  sin_riesgo?: number;
  riesgo_bajo?: number;
  bajo?: number;
  riesgo_medio?: number;
  medio?: number;
  riesgo_alto?: number;
  alto?: number;
  riesgo_muy_alto?: number;
  muy_alto?: number;
  alto_muy_alto: number;
  pct_alto_muy_alto: number;
  sin_nivel: number;
  sin_transformado: number;
  fuera_rango_0_100: number;
  respuestas_total?: number;
  respuesta_siempre?: number;
  respuesta_casi_siempre?: number;
  respuesta_algunas_veces?: number;
  respuesta_casi_nunca?: number;
  respuesta_nunca?: number;
  pct_respuesta_siempre?: number;
  pct_respuesta_casi_siempre?: number;
  pct_respuesta_algunas_veces?: number;
  pct_respuesta_casi_nunca?: number;
  pct_respuesta_nunca?: number;
}

export interface NivelDistribucion {
  nivel: NivelRiesgo | string;
  label: string;
  cantidad: number;
  porcentaje: number;
  orden?: number;
}

export interface DistribucionTotal {
  evaluacion_id: number;
  instrument_code: string;
  grupo_forma?: "FORMA_A" | "FORMA_B" | "SIN_FORMA" | string | null;
  instrument_group_code?: string | null;
  instrument_label: string;
  total_code: string;
  total_label: string;
  total: number;
  niveles: NivelDistribucion[];
}

export interface DominioPsico {
  evaluacion_id: number;
  instrument_code: string;
  grupo_forma?: "FORMA_A" | "FORMA_B" | "SIN_FORMA" | string | null;
  instrument_group_code?: string | null;
  instrument_label: string;
  dominio_code: string;
  dominio_label: string;
  n: number;
  promedio_transformado: number;
  riesgo_sin?: number;
  sin_riesgo?: number;
  riesgo_bajo?: number;
  bajo?: number;
  riesgo_medio?: number;
  medio?: number;
  riesgo_alto?: number;
  alto?: number;
  riesgo_muy_alto?: number;
  muy_alto?: number;
  alto_muy_alto: number;
  pct_alto_muy_alto: number;
  sin_nivel: number;
  fuera_rango_0_100: number;
}

export interface DimensionPsico {
  evaluacion_id: number;
  instrument_code: string;
  grupo_forma?: "FORMA_A" | "FORMA_B" | "SIN_FORMA" | string | null;
  instrument_group_code?: string | null;
  instrument_label: string;
  dominio_code?: string | null;
  dominio_label?: string | null;
  dimension_code: string;
  dimension_label: string;
  n: number;
  promedio_transformado: number;
  min_transformado: number;
  max_transformado: number;
  riesgo_sin?: number;
  sin_riesgo?: number;
  riesgo_bajo?: number;
  bajo?: number;
  riesgo_medio?: number;
  medio?: number;
  riesgo_alto?: number;
  alto?: number;
  riesgo_muy_alto?: number;
  muy_alto?: number;
  alto_muy_alto: number;
  pct_alto_muy_alto: number;
  sin_nivel: number;
  fuera_rango_0_100: number;
  respuestas_total?: number;
  respuesta_siempre?: number;
  respuesta_casi_siempre?: number;
  respuesta_algunas_veces?: number;
  respuesta_casi_nunca?: number;
  respuesta_nunca?: number;
  pct_respuesta_siempre?: number;
  pct_respuesta_casi_siempre?: number;
  pct_respuesta_algunas_veces?: number;
  pct_respuesta_casi_nunca?: number;
  pct_respuesta_nunca?: number;
}


export interface SocioDistribucionItem {
  tipo: string;
  nombre: string;
  cantidad: number;
  porcentaje: number;
}

export interface SociodemografiaPsico {
  total_participantes: number;
  completitud: Record<string, number>;
  variables: Record<string, SocioDistribucionItem[]>;
}

export interface ParticipantePsico {
  empleado_id: number;
  cedula?: string | null;
  nombre: string;
  email?: string | null;
  area?: string | null;
  cargo?: string | null;
  tipo_cargo?: string | null;
  sexo?: string | null;
  intra: "A" | "B" | "Sin intra" | string;
  bateria_completa: boolean;
  nivel_critico: NivelRiesgo | string;
  niveles: { a?: string | null; b?: string | null; extra?: string | null; estres?: string | null };
  puntajes: { a?: number | null; b?: number | null; extra?: number | null; estres?: number | null };
}

export interface ParticipantesPsico {
  ok: boolean;
  aplicacion_id: number;
  total: number;
  completos: number;
  incompletos: number;
  items: ParticipantePsico[];
}


export interface SegmentacionItem {
  tipo: string;
  nombre: string;
  n: number;
  alto_muy_alto: number;
  pct_alto_muy_alto: number;
  promedio_transformado: number;
}

export interface AreaDetallePsico {
  area_id: number;
  area_nombre: string;
  kpis: {
    participantes_estimados: number;
    total_scores: number;
    alto_muy_alto: number;
    pct_alto_muy_alto: number;
    dominio_mas_critico?: DominioPsico | null;
    dimension_mas_critica?: DimensionPsico | null;
  };
  totales: TotalPsico[];
  dominios: DominioPsico[];
  dimensiones: DimensionPsico[];
  ranking_dominios: DominioPsico[];
  ranking_dimensiones: DimensionPsico[];
}

export interface AreasDetallePsico {
  ok: boolean;
  aplicacion_id: number;
  total_areas: number;
  incluye_solo_areas_registradas: boolean;
  areas: AreaDetallePsico[];
}

export interface PsicoDashboardResponse {
  ok: boolean;
  aplicacion: PsicoAplicacionItem & { evaluaciones?: any[] };
  calidad: CalidadBateria;
  kpis: {
    total_evaluados: number;
    pct_completitud: number;
    pct_global_alto_muy_alto: number;
    dominio_mas_critico?: DominioPsico | null;
    dimension_mas_critica?: DimensionPsico | null;
  };
  totales: TotalPsico[];
  distribucion_totales: DistribucionTotal[];
  dominios: DominioPsico[];
  dimensiones: DimensionPsico[];
  ranking_dimensiones: DimensionPsico[];
  ranking_dominios: DominioPsico[];
  segmentacion: Record<string, SegmentacionItem[]>;
  areas_detalle?: AreasDetallePsico;
  sociodemografia?: SociodemografiaPsico;
  participantes?: ParticipantesPsico;
  alertas: { tipo: string; nivel: string; mensaje: string }[];
}


export interface DimensionDetalleNivel {
  nivel: NivelRiesgo | string;
  label: string;
  cantidad: number;
  porcentaje: number;
  orden?: number;
}

export interface DimensionDetalleResumen {
  evaluacion_id?: number;
  dimension_code: string;
  dimension_label: string;
  dominio_code?: string | null;
  dominio_label?: string | null;
  instrument_codes: string[];
  instrument_labels: string[];
  n: number;
  promedio_bruto: number;
  promedio_transformado: number;
  min_transformado: number;
  max_transformado: number;
  riesgo_sin?: number;
  sin_riesgo?: number;
  riesgo_bajo?: number;
  bajo?: number;
  riesgo_medio?: number;
  medio?: number;
  riesgo_alto?: number;
  alto?: number;
  riesgo_muy_alto?: number;
  muy_alto?: number;
  alto_muy_alto: number;
  pct_alto_muy_alto: number;
  sin_nivel: number;
  fuera_rango_0_100: number;
}

export interface DimensionDetalleItem {
  evaluacion_id: number;
  instrument_code: string;
  instrument_label: string;
  pregunta_id: number;
  pregunta_orden: number;
  texto: string;
  dominio_code?: string | null;
  dominio_label?: string | null;
  invertida: boolean;
  respuestas_total: number;
  respuesta_siempre: number;
  respuesta_casi_siempre: number;
  respuesta_algunas_veces: number;
  respuesta_casi_nunca: number;
  respuesta_nunca: number;
  pct_respuesta_siempre: number;
  pct_respuesta_casi_siempre: number;
  pct_respuesta_algunas_veces: number;
  pct_respuesta_casi_nunca: number;
  pct_respuesta_nunca: number;
  promedio_valor_num: number;
}

export interface DimensionDetalleResponse {
  ok: boolean;
  aplicacion_id: number;
  dimension: DimensionDetalleResumen;
  distribucion_niveles: DimensionDetalleNivel[];
  items: DimensionDetalleItem[];
  meta?: Record<string, any>;
}
