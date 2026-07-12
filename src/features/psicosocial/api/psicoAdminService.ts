import { requestJson } from "./httpClient";

export type EmpresaPsico = {
  id: string;
  nombre: string;
  razon_social?: string;
  nit?: string;
  email?: string;
  telefono?: string;
  ciudad?: string;
  pais?: string;
  estado?: string;
  empleados?: number;
  aplicaciones?: number;
  evaluaciones_calculadas?: number;
};

export type CreditosResumen = {
  ok: boolean;
  cuenta_id?: number | string | null;
  saldo_actual: number;
  creditos_asignados: number;
  creditos_consumidos: number;
  registros_consumidos: number;
  estado?: string | null;
  actualizado_en?: string | null;
};

export type AreaEmpresa = { id: number; nombre: string; descripcion?: string; activo?: boolean; cargos_count?: number };
export type CargoEmpresa = { id: number; nombre: string; area_id?: number | null; area_nombre?: string; nivel?: string; activo?: boolean; empleados_count?: number };

export type EmpleadoEmpresa = {
  id: number;
  cedula: string;
  nombre: string;
  cargo: string;
  area: string;
  email?: string;
  telefono?: string;
  activo?: boolean;
};

export type CrearEmpleadoPayload = {
  nombres: string;
  apellidos: string;
  cedula: string;
  area_id?: number | null;
  cargo_id?: number | null;
  area?: string;
  cargo?: string;
  email?: string;
  telefono?: string;
  identificador_externo?: string;
};

export type EmpleadoImportError = {
  row: number | null;
  field: string;
  message: string;
};

export type EmpleadoImportPreview = {
  row: number;
  cedula: string;
  nombres: string;
  apellidos: string;
  cargo: string;
  nivel_academico: string;
  area_departamento: string;
  action?: "create" | "update" | string;
};

export type EmpleadoImportResponse = {
  ok: boolean;
  dry_run: boolean;
  total_rows: number;
  valid_rows: number;
  created: number;
  updated: number;
  errors: EmpleadoImportError[];
  preview: EmpleadoImportPreview[];
  items?: EmpleadoEmpresa[];
};

export type AplicacionEmpresa = {
  id: number;
  nombre: string;
  estado: string;
  created_at?: string;
  creado_en?: string;
  fecha_aplicacion?: string;
  participantes?: number;
  participantes_calculados?: number;
  evaluaciones?: Array<{ evaluacion_id: number; instrument_code: string }>;
};

export type CrearBateriaPayload = {
  nombre: string;
  fecha_aplicacion?: string;
  include_intra_a?: boolean;
  include_intra_b?: boolean;
  include_extra?: boolean;
  include_estres?: boolean;
};

export type PsicoCreditSummary = {
  ok: boolean;
  cuenta_id?: number | null;
  saldo_actual: number;
  creditos_asignados: number;
  creditos_consumidos: number;
  registros_consumidos: number;
  estado?: string;
  actualizado_en?: string;
};

export type PsicoApplicationCreditSummary = {
  ok: boolean;
  aplicacion_id: number;
  creditos_consumidos: number;
  registros_consumidos: number;
  ultimos_movimientos?: Array<{
    id: number;
    cantidad: number;
    saldo_anterior: number;
    saldo_nuevo: number;
    referencia_id?: string;
    descripcion?: string;
    creado_en?: string;
  }>;
};

export type AplicacionDetalleEmpleado = EmpleadoEmpresa & {
  registrado: boolean;
  completo?: boolean;
  instrumentos_registrados: string[];
  instrumentos_en_captura?: string[];
  instrumentos_pendientes: string[];
  total_instrumentos: number;
  completados: number;
  avance_porcentaje?: number;
  ficha_sociodemografica?: { requerida: boolean; estado: string; completa: boolean };
};

export type AplicacionDetalle = {
  ok: boolean;
  empresa: EmpresaPsico;
  aplicacion: AplicacionEmpresa;
  instrumentos: Array<{ evaluacion_id: number; instrument_code: string; nombre?: string; total_preguntas?: number }>;
  resumen: {
    empleados_total: number;
    participantes_registrados: number;
    participantes_completos?: number;
    participantes_pendientes_completar?: number;
    pendientes: number;
    instrumentos_total: number;
    creditos_consumidos: number;
    creditos_reservados?: number;
    creditos_estimados: number;
    ficha_sociodemografica_requerida?: boolean;
  };
  creditos?: PsicoApplicationCreditSummary;
  empleados: AplicacionDetalleEmpleado[];
};

export const psicoAdminService = {
  listarEmpresas: (todas = true) =>
    requestJson<{ ok: boolean; items: EmpresaPsico[] }>(`/psicosocial/admin/empresas?todas=${todas}`),

  creditosResumen: () =>
    requestJson<CreditosResumen>("/psicosocial/admin/creditos/resumen"),

  perfilEmpresa: (empresaId: string) =>
    requestJson<{ ok: boolean; empresa: EmpresaPsico; resumen: any; aplicaciones_recientes: AplicacionEmpresa[] }>(
      `/psicosocial/admin/empresas/${empresaId}`,
      { headers: { "X-Empresa-Id": empresaId } },
    ),

  listarAreas: (empresaId: string, includeInactive = false) =>
    requestJson<{ ok: boolean; items: AreaEmpresa[] }>(`/psicosocial/admin/empresas/${empresaId}/areas${includeInactive ? "?include_inactive=true" : ""}`, {
      headers: { "X-Empresa-Id": empresaId },
    }),

  crearArea: (empresaId: string, payload: { nombre: string; descripcion?: string }) =>
    requestJson<{ ok: boolean; item: AreaEmpresa }>(`/psicosocial/admin/empresas/${empresaId}/areas`, {
      method: "POST",
      headers: { "X-Empresa-Id": empresaId },
      body: JSON.stringify(payload),
    }),

  actualizarArea: (empresaId: string, areaId: number, payload: { nombre?: string; descripcion?: string; activo?: boolean }) =>
    requestJson<{ ok: boolean; item: AreaEmpresa }>(`/psicosocial/admin/empresas/${empresaId}/areas/${areaId}`, {
      method: "PUT",
      headers: { "X-Empresa-Id": empresaId },
      body: JSON.stringify(payload),
    }),

  eliminarArea: (empresaId: string, areaId: number) =>
    requestJson<{ ok: boolean; deleted_id: number }>(`/psicosocial/admin/empresas/${empresaId}/areas/${areaId}`, {
      method: "DELETE",
      headers: { "X-Empresa-Id": empresaId },
    }),

  listarCargos: (empresaId: string, areaId?: number | null, includeInactive = false) => {
    const params = new URLSearchParams();
    if (areaId) params.set("area_id", String(areaId));
    if (includeInactive) params.set("include_inactive", "true");
    const query = params.toString() ? `?${params.toString()}` : "";
    return requestJson<{ ok: boolean; items: CargoEmpresa[] }>(`/psicosocial/admin/empresas/${empresaId}/cargos${query}`, {
      headers: { "X-Empresa-Id": empresaId },
    });
  },

  crearCargo: (empresaId: string, payload: { nombre: string; area_id?: number | null; nivel?: string }) =>
    requestJson<{ ok: boolean; item: CargoEmpresa }>(`/psicosocial/admin/empresas/${empresaId}/cargos`, {
      method: "POST",
      headers: { "X-Empresa-Id": empresaId },
      body: JSON.stringify(payload),
    }),

  actualizarCargo: (empresaId: string, cargoId: number, payload: { nombre?: string; area_id?: number | null; nivel?: string; activo?: boolean }) =>
    requestJson<{ ok: boolean; item: CargoEmpresa }>(`/psicosocial/admin/empresas/${empresaId}/cargos/${cargoId}`, {
      method: "PUT",
      headers: { "X-Empresa-Id": empresaId },
      body: JSON.stringify(payload),
    }),

  eliminarCargo: (empresaId: string, cargoId: number) =>
    requestJson<{ ok: boolean; deleted_id: number }>(`/psicosocial/admin/empresas/${empresaId}/cargos/${cargoId}`, {
      method: "DELETE",
      headers: { "X-Empresa-Id": empresaId },
    }),

  empleadosEmpresa: (empresaId: string, q = "") =>
    requestJson<{ ok: boolean; items: EmpleadoEmpresa[] }>(
      `/psicosocial/admin/empresas/${empresaId}/empleados?q=${encodeURIComponent(q)}`,
      { headers: { "X-Empresa-Id": empresaId } },
    ),

  crearEmpleado: (empresaId: string, payload: CrearEmpleadoPayload) =>
    requestJson<{ ok: boolean; empleado_id: number; item?: EmpleadoEmpresa }>(`/psicosocial/admin/empresas/${empresaId}/empleados`, {
      method: "POST",
      headers: { "X-Empresa-Id": empresaId },
      body: JSON.stringify(payload),
    }),

  importarEmpleados: (empresaId: string, file: File, dryRun = true) => {
    const form = new FormData();
    form.append("file", file);
    return requestJson<EmpleadoImportResponse>(
      `/psicosocial/admin/empresas/${empresaId}/empleados/importar?dry_run=${dryRun}`,
      {
        method: "POST",
        headers: { "X-Empresa-Id": empresaId },
        body: form,
      },
    );
  },

  aplicacionesEmpresa: (empresaId: string) =>
    requestJson<{ ok: boolean; items: AplicacionEmpresa[] }>(
      `/psicosocial/admin/empresas/${empresaId}/aplicaciones`,
      { headers: { "X-Empresa-Id": empresaId } },
    ),

  crearBateria: (empresaId: string, payload: CrearBateriaPayload) =>
    requestJson<any>(`/psicosocial/admin/empresas/${empresaId}/aplicaciones/crear-bateria`, {
      method: "POST",
      headers: { "X-Empresa-Id": empresaId },
      body: JSON.stringify({
        include_intra_a: true,
        include_intra_b: true,
        include_extra: true,
        include_estres: true,
        ...payload,
      }),
    }),

  detalleAplicacion: (empresaId: string, aplicacionId: number) =>
    requestJson<AplicacionDetalle>(`/psicosocial/admin/empresas/${empresaId}/aplicaciones/${aplicacionId}`, {
      headers: { "X-Empresa-Id": empresaId },
    }),

  resultadoAplicacion: (empresaId: string, aplicacionId: number) =>
    requestJson<any>(`/psicosocial/admin/empresas/${empresaId}/aplicaciones/${aplicacionId}/resultados`, {
      headers: { "X-Empresa-Id": empresaId },
    }),

  cerrarAplicacion: (empresaId: string, aplicacionId: number, minParticipantes = 3) =>
    requestJson<{ ok: boolean; estado: string; participantes: number; evaluacion_ids: number[] }>(
      `/psicosocial/admin/empresas/${empresaId}/aplicaciones/${aplicacionId}/cerrar?min_participantes=${minParticipantes}`,
      { method: "POST", headers: { "X-Empresa-Id": empresaId } },
    ),


  previewLimpiarRespuestasEmpleado: (empresaId: string, aplicacionId: number, empleadoId: number) =>
    requestJson<{ ok: boolean; counts: Record<string, number>; total_registros: number; bloqueada: boolean; estado: string }>(
      `/psicosocial/admin/empresas/${empresaId}/aplicaciones/${aplicacionId}/empleados/${empleadoId}/respuestas/cleanup-preview`,
      { headers: { "X-Empresa-Id": empresaId } },
    ),

  limpiarRespuestasEmpleado: (empresaId: string, aplicacionId: number, empleadoId: number) =>
    requestJson<{ ok: boolean; deleted: Record<string, number>; total_eliminado: number }>(
      `/psicosocial/admin/empresas/${empresaId}/aplicaciones/${aplicacionId}/empleados/${empleadoId}/respuestas?confirm=true`,
      { method: "DELETE", headers: { "X-Empresa-Id": empresaId } },
    ),

  reabrirAplicacion: (empresaId: string, aplicacionId: number, payload: { motivo?: string; consumir_credito?: boolean }) =>
    requestJson<{ ok: boolean; estado: string; credito_reproceso_consumido: boolean }>(
      `/psicosocial/admin/empresas/${empresaId}/aplicaciones/${aplicacionId}/reabrir`,
      { method: "POST", headers: { "X-Empresa-Id": empresaId }, body: JSON.stringify(payload) },
    ),
};

export type AplicacionBTServerItem = {
  id: number;
  empresa_id: string;
  empresa_nombre: string;
  nombre: string;
  estado: "BORRADOR" | "EN_CAPTURA" | "CALCULANDO" | "FINALIZADA" | "REABIERTA" | "ERROR_CALCULO" | string;
  estado_label?: string;
  fecha_aplicacion?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  evaluaciones?: Array<{ evaluacion_id: number; instrument_code: string }>;
  instrumentos?: string[];
  participantes?: number;
  registrados?: number;
  respuestas_registradas?: number;
  participantes_con_scores?: number;
  scores_total?: number;
  avance_porcentaje?: number;
  creditos?: number;
  puede_editar?: boolean;
  puede_cerrar?: boolean;
  tiene_resultados?: boolean;
};

export type AplicacionesBTResponse = {
  ok: boolean;
  items: AplicacionBTServerItem[];
  total: number;
  page: number;
  page_size: number;
  counters: {
    total?: number;
    borrador?: number;
    en_captura?: number;
    calculando?: number;
    finalizada?: number;
    reabierta?: number;
    error_calculo?: number;
    creditos_consumidos?: number;
  };
};

export const psicoAplicacionesBTService = {
  listar: (params: { page?: number; pageSize?: number; empresaId?: string; estado?: string; instrumento?: string; q?: string } = {}) => {
    const qs = new URLSearchParams();
    qs.set("page", String(params.page ?? 1));
    qs.set("page_size", String(params.pageSize ?? 10));
    if (params.empresaId && params.empresaId !== "TODAS") qs.set("empresa_id", params.empresaId);
    if (params.estado && params.estado !== "TODOS") qs.set("estado", params.estado);
    if (params.instrumento && params.instrumento !== "TODOS") qs.set("instrumento", params.instrumento);
    if (params.q) qs.set("q", params.q);
    return requestJson<AplicacionesBTResponse>(`/psicosocial/admin/aplicaciones-bt?${qs.toString()}`);
  },
};
