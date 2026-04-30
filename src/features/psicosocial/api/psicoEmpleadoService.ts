export type NivelRiesgo = "SIN_RIESGO" | "MUY_BAJO" | "BAJO" | "MEDIO" | "ALTO" | "MUY_ALTO" | string;

export type PsicoEvaluacionEmpleado = {
  aplicacion_id: number;
  evaluacion_id: number;
  instrument_code: string;
  nombre?: string | null;
  label?: string | null;
  total_preguntas: number;
  respondidas: number;
  score_count: number;
  puntaje_transformado?: number | null;
  nivel_riesgo?: NivelRiesgo | null;
  estado_respuestas: "sin_iniciar" | "borrador" | "completa" | "calculada" | string;
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
  resumen_aplicaciones?: {
    total: number;
    completas: number;
    activas: number;
  };
};

export type PsicoAplicacionesEmpleadoResponse = {
  empleado_id: number;
  aplicaciones: PsicoAplicacionEmpleado[];
  resumen: {
    total: number;
    completas: number;
    activas: number;
  };
};

export type PsicoResultadoIndividual = {
  empleado_id: number;
  aplicacion_id: number;
  totales: Array<Record<string, unknown>>;
  dominios: Array<Record<string, unknown>>;
  dimensiones: Array<Record<string, unknown>>;
};

function apiBase() {
  return (
    import.meta.env.VITE_API_URL ||
    import.meta.env.VITE_API_BASE_URL ||
    "http://localhost:8000"
  ).replace(/\/$/, "");
}

function authHeaders(): HeadersInit {
  const token =
    localStorage.getItem("token") ||
    localStorage.getItem("access_token") ||
    localStorage.getItem("accessToken") ||
    "";
  const empresaId =
    localStorage.getItem("empresa_id") ||
    localStorage.getItem("empresaId") ||
    localStorage.getItem("X-Empresa-Id") ||
    "46fa152f-cafc-4a1a-bee8-3831403ae1db";

  return {
    Accept: "application/json",
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(empresaId ? { "X-Empresa-Id": empresaId } : {}),
  };
}

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${apiBase()}${path}`, {
    ...init,
    headers: {
      ...authHeaders(),
      ...(init?.headers || {}),
    },
  });

  if (!res.ok) {
    let detail = `HTTP ${res.status}`;
    try {
      const body = await res.json();
      detail = body?.detail || body?.message || detail;
    } catch {
      // ignore
    }
    throw new Error(detail);
  }
  return (await res.json()) as T;
}

export function obtenerPerfilPsicoEmpleado(empleadoId: number | string) {
  return requestJson<PsicoEmpleadoPerfil>(`/psicosocial/empleados/${empleadoId}/perfil`);
}

export function obtenerAplicacionesPsicoEmpleado(empleadoId: number | string) {
  return requestJson<PsicoAplicacionesEmpleadoResponse>(`/psicosocial/empleados/${empleadoId}/aplicaciones`);
}

export function obtenerAplicacionesDisponiblesPsicoEmpleado(empleadoId: number | string) {
  return requestJson<PsicoAplicacionesEmpleadoResponse>(`/psicosocial/empleados/${empleadoId}/aplicaciones-disponibles`);
}

export function obtenerResultadosPsicoEmpleado(empleadoId: number | string, aplicacionId: number | string) {
  return requestJson<PsicoResultadoIndividual>(`/psicosocial/empleados/${empleadoId}/aplicaciones/${aplicacionId}/resultados`);
}
