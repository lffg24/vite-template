// src/features/psicosocial/api/psicoAccessService.ts
import { API_URL } from "@/lib/config";

export type EmpresaAsignada = {
  empresa_id: string;
  id?: string;
  nombre: string;
  nit?: string | null;
  ciudad?: string | null;
  estado?: string | null;
  rol_en_empresa?: string | null;
  identificacion_profesional?: string | null;
  profesion?: string | null;
  postgrado?: string | null;
  licencia_sst?: string | null;
  tarjeta_profesional?: string | null;
  fecha_expedicion_licencia?: string | null;
  puede_validar_informes?: boolean;
  puede_ver_individuales?: boolean;
  puede_cargar_respuestas?: boolean;
  puede_crear_aplicaciones?: boolean;
  empleados?: number;
  aplicaciones?: number;
  resultados?: number;
  evaluaciones_calculadas?: number;
};

export type EmpresasAsignadasResponse = {
  ok: boolean;
  total: number;
  empresas: EmpresaAsignada[];
  onboarding_required: boolean;
  message?: string | null;
};

export type CrearEmpresaPsicoPayload = {
  nombre: string;
  nit?: string | null;
};

export type CrearEmpresaPsicoResponse = {
  ok: boolean;
  empresa_id: string;
  message?: string | null;
};

export type PsicoFeatureFlags = {
  web_direct: boolean;
};

export type WebDirectParticipantConfiguration = {
  empleado_id: number;
  fecha_nacimiento: string;
  forma_asignada: "A" | "B";
};

export type WebDirectConfigurationResponse = {
  ok: boolean;
  aplicacion_id: number;
  participantes_habilitados: number;
  public_url: string;
};

export const DISABLED_PSICO_FEATURE_FLAGS: PsicoFeatureFlags = {
  web_direct: false,
};

export function getToken(): string | null {
  // La sesión definitiva usa cookie HttpOnly; no existe token legible desde JavaScript.
  return null;
}

async function parseApiError(res: Response, fallback: string): Promise<string> {
  try {
    const data = await res.json();
    if (typeof data?.detail === "string") return data.detail;
    if (Array.isArray(data?.detail)) return data.detail[0]?.msg ?? fallback;
    if (typeof data?.message === "string") return data.message;
  } catch {
    try {
      const text = await res.text();
      if (text) return text;
    } catch {
      // noop
    }
  }
  return fallback;
}

function jsonHeaders(): HeadersInit {
  return {
    Accept: "application/json",
    "Content-Type": "application/json",
  };
}

export function normalizePsicoFeatureFlags(data: unknown): PsicoFeatureFlags {
  if (!data || typeof data !== "object") return DISABLED_PSICO_FEATURE_FLAGS;
  return {
    web_direct: (data as { web_direct?: unknown }).web_direct === true,
  };
}

export async function getPsicoFeatureFlags(): Promise<PsicoFeatureFlags> {
  const res = await fetch(`${API_URL}/psicosocial/access/features`, {
    method: "GET",
    credentials: "include",
    headers: jsonHeaders(),
  });

  if (!res.ok) {
    const detail = await parseApiError(res, `No fue posible cargar funcionalidades habilitadas (${res.status})`);
    const err = new Error(detail) as Error & { status?: number };
    err.status = res.status;
    throw err;
  }

  return normalizePsicoFeatureFlags(await res.json());
}

export async function configureWebDirectAccess(
  applicationId: number,
  participants: WebDirectParticipantConfiguration[],
): Promise<WebDirectConfigurationResponse> {
  const res = await fetch(`${API_URL}/psicosocial/access/aplicaciones/${applicationId}/web-direct`, {
    method: "POST",
    credentials: "include",
    headers: jsonHeaders(),
    body: JSON.stringify({ participantes: participants }),
  });
  if (!res.ok) {
    const detail = await parseApiError(res, `No fue posible habilitar el acceso web (${res.status})`);
    const err = new Error(detail) as Error & { status?: number };
    err.status = res.status;
    throw err;
  }
  return res.json();
}

export async function getEmpresasAsignadasResponse(): Promise<EmpresasAsignadasResponse> {
  const res = await fetch(`${API_URL}/psicosocial/access/empresas`, {
    method: "GET",
    credentials: "include",
    headers: jsonHeaders(),
  });

  if (!res.ok) {
    const detail = await parseApiError(res, `No fue posible cargar empresas asignadas (${res.status})`);
    const err = new Error(detail) as Error & { status?: number };
    err.status = res.status;
    throw err;
  }

  const data = await res.json();
  const empresas = Array.isArray(data) ? data : data.empresas ?? [];

  return {
    ok: data?.ok ?? true,
    total: data?.total ?? empresas.length,
    empresas,
    onboarding_required: Boolean(data?.onboarding_required ?? empresas.length === 0),
    message: data?.message ?? null,
  };
}

export async function getEmpresasAsignadas(): Promise<EmpresaAsignada[]> {
  const data = await getEmpresasAsignadasResponse();
  return data.empresas;
}

export async function crearEmpresaPsicologo(
  payload: CrearEmpresaPsicoPayload
): Promise<CrearEmpresaPsicoResponse> {
  const res = await fetch(`${API_URL}/psicosocial/access/empresas`, {
    method: "POST",
    credentials: "include",
    headers: jsonHeaders(),
    body: JSON.stringify({
      nombre: payload.nombre.trim(),
      nit: payload.nit?.trim() || null,
    }),
  });

  if (!res.ok) {
    const detail = await parseApiError(res, `No fue posible crear la empresa (${res.status})`);
    const err = new Error(detail) as Error & { status?: number };
    err.status = res.status;
    throw err;
  }

  return res.json();
}

