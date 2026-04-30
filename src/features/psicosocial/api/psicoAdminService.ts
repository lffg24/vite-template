const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

function getEmpresaId(): string | null {
  return localStorage.getItem("empresa_id") || localStorage.getItem("empresaId") || null;
}

function getToken(): string | null {
  return localStorage.getItem("token") || localStorage.getItem("access_token") || null;
}

async function http<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getToken();
  const empresaId = getEmpresaId();
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(empresaId ? { "X-Empresa-Id": empresaId } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(init.headers || {}),
  };

  const res = await fetch(`${API_URL}${path}`, { ...init, headers });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

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

export type AplicacionEmpresa = {
  id: number;
  nombre: string;
  estado: string;
  creado_en?: string;
  participantes_calculados?: number;
  evaluaciones?: Array<{ evaluacion_id: number; instrument_code: string }>;
};

export const psicoAdminService = {
  listarEmpresas: (todas = true) =>
    http<{ ok: boolean; items: EmpresaPsico[] }>(`/psicosocial/admin/empresas?todas=${todas}`),

  perfilEmpresa: (empresaId: string) =>
    http<{ ok: boolean; empresa: EmpresaPsico; resumen: any; aplicaciones_recientes: AplicacionEmpresa[] }>(
      `/psicosocial/admin/empresas/${empresaId}`,
      { headers: { "X-Empresa-Id": empresaId } }
    ),

  empleadosEmpresa: (empresaId: string, q = "") =>
    http<{ ok: boolean; items: EmpleadoEmpresa[] }>(
      `/psicosocial/admin/empresas/${empresaId}/empleados?q=${encodeURIComponent(q)}`,
      { headers: { "X-Empresa-Id": empresaId } }
    ),

  aplicacionesEmpresa: (empresaId: string) =>
    http<{ ok: boolean; items: AplicacionEmpresa[] }>(
      `/psicosocial/admin/empresas/${empresaId}/aplicaciones`,
      { headers: { "X-Empresa-Id": empresaId } }
    ),

  crearBateria: (empresaId: string, nombre: string) =>
    http<any>(
      `/psicosocial/bateria/crear?nombre=${encodeURIComponent(nombre)}&include_intra_a=true&include_intra_b=true&include_extra=true&include_estres=true`,
      { method: "POST", headers: { "X-Empresa-Id": empresaId } }
    ),

  resultadoAplicacion: (empresaId: string, aplicacionId: number) =>
    http<any>(`/psicosocial/admin/empresas/${empresaId}/aplicaciones/${aplicacionId}/resultados`, {
      headers: { "X-Empresa-Id": empresaId },
    }),
};
