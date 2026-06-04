import { requestJson } from "@/features/psicosocial/api/httpClient";

export type Paged<T> = { ok: boolean; items: T[]; total: number; page: number; page_size: number };
export type CreditAccount = {
  id: number;
  psicologo_usuario_id: number;
  psicologo_nombre: string;
  psicologo_email?: string;
  empresa_id?: string | null;
  empresa_nombre: string;
  saldo_actual: number;
  creditos_asignados: number;
  estado: string;
  actualizado_en?: string;
};
export type SuperAdminKpis = { empresas: number; usuarios: number; aplicaciones: number; cuentas: number; saldo_total: number; asignados_total: number };

export const superadminService = {
  dashboard: () => requestJson<{ ok: boolean; kpis: SuperAdminKpis }>("/superadmin/dashboard"),
  empresas: (params: { q?: string; page?: number; pageSize?: number } = {}) => {
    const qs = new URLSearchParams({ page: String(params.page ?? 1), page_size: String(params.pageSize ?? 20) });
    if (params.q) qs.set("q", params.q);
    return requestJson<Paged<{ id: string; nombre: string; nit?: string }>>(`/superadmin/empresas?${qs}`);
  },
  psicologos: (params: { q?: string; page?: number; pageSize?: number } = {}) => {
    const qs = new URLSearchParams({ page: String(params.page ?? 1), page_size: String(params.pageSize ?? 20) });
    if (params.q) qs.set("q", params.q);
    return requestJson<Paged<{ id: number; nombre: string; email?: string; empresas_asignadas: number }>>(`/superadmin/psicologos?${qs}`);
  },
  creditAccounts: (params: { q?: string; page?: number; pageSize?: number } = {}) => {
    const qs = new URLSearchParams({ page: String(params.page ?? 1), page_size: String(params.pageSize ?? 20) });
    if (params.q) qs.set("q", params.q);
    return requestJson<Paged<CreditAccount>>(`/superadmin/creditos/cuentas?${qs}`);
  },
  assignCredits: (payload: { psicologo_usuario_id: number; empresa_id?: string | null; cantidad: number; descripcion?: string }) =>
    requestJson<{ ok: boolean; account_id: number; saldo_anterior: number; saldo_nuevo: number }>("/superadmin/creditos/asignar", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  rolesPermisos: () => requestJson<{ ok: boolean; roles: any[]; permisos: string[] }>("/superadmin/roles-permisos"),
};
