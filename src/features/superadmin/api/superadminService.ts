// src/features/superadmin/api/superadminService.ts
import { API_URL } from "@/lib/config";

async function parseError(res: Response): Promise<string> {
  try {
    const data = await res.json();
    if (typeof data?.detail === "string") return data.detail;
    if (typeof data?.detail?.message === "string") return data.detail.message;
    if (typeof data?.message === "string") return data.message;
  } catch {}
  return `Error HTTP ${res.status}`;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    credentials: "include",
    headers: { Accept: "application/json", "Content-Type": "application/json", ...(init?.headers || {}) },
    ...init,
  });
  if (!res.ok) throw new Error(await parseError(res));
  return (await res.json()) as T;
}

export type Paginated<T> = { ok: boolean; items: T[]; total: number; page: number; page_size: number };
export type SuperAdminDashboard = { ok: boolean; kpis: Record<string, number> };
export type SuperEmpresa = { id: string; nombre: string; nit?: string; empleados?: number; aplicaciones?: number };
export type SuperPsicologo = { id: number; nombre: string; email?: string; empresas_asignadas: number; creditos_disponibles?: number; creditos_asignados?: number };
export type CreditAccount = { id: number; psicologo_usuario_id: number; psicologo_nombre?: string; psicologo_email?: string; empresa_id?: string | null; empresa_nombre?: string; saldo_actual: number; creditos_asignados: number; estado: string; actualizado_en?: string };
export type CreditMovement = { id: number; account_id: number; tipo: string; cantidad: number; saldo_anterior: number; saldo_nuevo: number; descripcion?: string; creado_en: string };

function qs(params: Record<string, string | number | undefined | null>) {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => { if (v !== undefined && v !== null && String(v) !== "") sp.set(k, String(v)); });
  const s = sp.toString();
  return s ? `?${s}` : "";
}

export const superadminService = {
  dashboard: () => request<SuperAdminDashboard>("/superadmin/dashboard"),
  empresas: (p: { q?: string; page?: number; page_size?: number }) => request<Paginated<SuperEmpresa>>(`/superadmin/empresas${qs(p)}`),
  psicologos: (p: { q?: string; page?: number; page_size?: number }) => request<Paginated<SuperPsicologo>>(`/superadmin/psicologos${qs(p)}`),
  creditAccounts: (p: { q?: string; page?: number; page_size?: number }) => request<Paginated<CreditAccount>>(`/superadmin/creditos/cuentas${qs(p)}`),
  creditMovements: (p: { account_id?: number; page?: number; page_size?: number }) => request<Paginated<CreditMovement>>(`/superadmin/creditos/movimientos${qs(p)}`),
  assignCredits: (payload: { psicologo_usuario_id: number; empresa_id?: string | null; cantidad: number; descripcion?: string; idempotency_key?: string }) => request<any>("/superadmin/creditos/asignar", { method: "POST", body: JSON.stringify(payload) }),
  rolesPermisos: () => request<any>("/superadmin/roles-permisos"),
  auditoria: (p: { page?: number; page_size?: number }) => request<Paginated<any>>(`/superadmin/auditoria${qs(p)}`),
};
