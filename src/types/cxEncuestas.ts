export type TipoItemCx = "NPS_RELACIONAL" | "NPS_EXPERIENCIA" | "CSAT" | "CES" | "FACTOR";
export type ItemCx = { tipo: TipoItemCx; enunciado: string; obligatorio: boolean; factor_id?: string | null };
/** `null` es encuesta anónima, y es lo que vale por omisión. Nombre y correo
 *  son obligatorios siempre que se capture, así que no son parámetros. */
export type ContactoCx = { pide_telefono: boolean };
export type VersionCx = { id: string; numero: number; publicado_en: string; items: ItemCx[]; contacto: ContactoCx | null };
export type EncuestaCx = { id: string; codigo: string; titulo: string; borrador: ItemCx[]; contacto: ContactoCx | null; versiones: VersionCx[] };
export type ResumenEncuestaCx = { id: string; codigo: string; titulo: string; tiene_borrador: boolean; ultima_version: number | null };
export type PaginaEncuestasCx = { items: ResumenEncuestaCx[]; siguiente_cursor: string | null };
