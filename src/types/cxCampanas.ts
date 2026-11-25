export type EstadoCampanaCx = "ACTIVA" | "PAUSADA" | "CERRADA";
export type CampanaCx = {
  id: string;
  encuesta_id: string;
  version_actual_id: string;
  nombre: string;
  estado: EstadoCampanaCx;
  contexto: { sede_id: string; servicio_id: string | null; punto_id: string | null };
  inicio_en: string;
  fin_en: string | null;
  enlace_id: string;
  token: string;
  expira_en: string | null;
  revocado_en: string | null;
};
export type NuevaCampanaCx = {
  id: string;
  encuesta_id: string;
  version_id: string;
  nombre: string;
  sede_id: string;
  servicio_id: string | null;
  punto_id: string | null;
};
export type PaginaCampanasCx = { items: CampanaCx[]; siguiente_cursor: string | null };
