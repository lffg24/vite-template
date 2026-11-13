export type TipoItemCx = "NPS_RELACIONAL" | "NPS_EXPERIENCIA" | "CSAT" | "CES" | "FACTOR";
export type ItemCx = { tipo: TipoItemCx; enunciado: string; obligatorio: boolean; factor_id?: string | null };
export type VersionCx = { id: string; numero: number; publicado_en: string; items: ItemCx[] };
export type EncuestaCx = { id: string; codigo: string; titulo: string; borrador: ItemCx[]; versiones: VersionCx[] };
export type ResumenEncuestaCx = { id: string; codigo: string; titulo: string; tiene_borrador: boolean; ultima_version: number | null };
export type PaginaEncuestasCx = { items: ResumenEncuestaCx[]; siguiente_cursor: string | null };
