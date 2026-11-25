export type AreaCx = { id: number; nombre: string; descripcion: string | null; activo: boolean };
export type PaginaAreasCx = { items: AreaCx[]; siguiente_cursor: number | null };
export type ServicioAreaCx = { area_id: number; nombre: string; tipo_responsabilidad: "principal" | "colaboradora" };
export type ServicioAreasCx = {
  servicio_id: string;
  principal_area_id: number | null;
  colaboradora_area_ids: number[];
  items: ServicioAreaCx[];
};
