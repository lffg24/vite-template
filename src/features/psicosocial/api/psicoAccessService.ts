// src/features/psicosocial/api/psicoAccessService.ts

export type EmpresaAsignada = {
  empresa_id: string;
  nombre: string;
  nit?: string | null;
  ciudad?: string | null;
  estado?: string | null;
  rol_en_empresa?: string | null;
  licencia_sst?: string | null;
  tarjeta_profesional?: string | null;
  puede_validar_informes?: boolean;
};

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

function getToken(): string | null {
  return localStorage.getItem("token") || localStorage.getItem("access_token");
}

export async function getEmpresasAsignadas(): Promise<EmpresaAsignada[]> {
  const token = getToken();
  const res = await fetch(`${API_URL}/psicosocial/access/empresas`, {
    headers: {
      Accept: "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!res.ok) {
    throw new Error(`No fue posible cargar empresas asignadas (${res.status})`);
  }

  const data = await res.json();
  return Array.isArray(data) ? data : data.empresas ?? [];
}

export function getEmpresaActivaId(): string | null {
  return localStorage.getItem("eva360.empresaActivaId");
}

export function setEmpresaActivaId(empresaId: string) {
  localStorage.setItem("eva360.empresaActivaId", empresaId);
}

export function getEmpresaHeaders(): Record<string, string> {
  const empresaId = getEmpresaActivaId();
  return empresaId ? { "X-Empresa-Id": empresaId } : {};
}
