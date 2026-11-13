import { api } from "@/lib/apiClient";

export type Opportunity = {
  id: string;
  workflow_state: string;
  lane: string;
  row_version: number;
  updated_at: string;
  external_process_id: string;
  buyer_name: string;
  object_original: string;
  official_status: string;
  budget_amount: string | number | null;
  budget_currency: string | null;
  next_deadline: string | null;
  deadline_precision: string | null;
  current_revision: string;
  service_category: string | null;
  department: string | null;
  municipalities_json: string[] | null;
  territory_evidence_status: string | null;
  volume_amount: string | number | null;
  volume_unit: string | null;
  volume_evidence_status: string | null;
  completeness: number | null;
  decision: string | null;
};

export type EvidenceField = {
  field_key: string;
  value_json: unknown;
  data_type: string;
  evidence_status: string;
  confidence: number | null;
  evidence_json: Array<{ document_id?: string; page?: number; quote?: string }> | null;
  extractor_version: string;
};

export type OpportunityDetail = {
  opportunity: Opportunity & {
    quality_json?: Record<string, unknown>;
    metadata_json?: Record<string, unknown>;
    artifact_ref?: string;
  };
  fields: EvidenceField[];
  decisions: Array<Record<string, unknown>>;
};

export type Summary = {
  totals: {
    total: number;
    closed: number;
    go_count: number;
    with_volume: number;
    with_department: number;
    average_completeness: number;
  };
  categories: Array<{ category: string; total: number }>;
};

export async function listOpportunities(state?: string) {
  const response = await api.get<{ total: number; items: Opportunity[] }>("/licitaciones/opportunities", {
    params: state ? { state } : undefined,
  });
  return response.data;
}

export async function getOpportunity(id: string) {
  return (await api.get<OpportunityDetail>(`/licitaciones/opportunities/${encodeURIComponent(id)}`)).data;
}

export async function getSummary() {
  return (await api.get<Summary>("/licitaciones/reports/summary")).data;
}

export async function createReview(id: string, payload: Record<string, unknown>) {
  return (await api.post(`/licitaciones/opportunities/${encodeURIComponent(id)}/reviews`, payload)).data;
}

export async function closeDecision(
  id: string,
  payload: Record<string, unknown>,
  idempotencyKey: string,
) {
  return (
    await api.post(`/licitaciones/opportunities/${encodeURIComponent(id)}/decision`, payload, {
      headers: { "Idempotency-Key": idempotencyKey },
    })
  ).data;
}
