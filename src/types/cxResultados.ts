export type IndicadorCx = {
  tipo: "NPS_RELACIONAL" | "NPS_EXPERIENCIA" | "CSAT" | "CES";
  valor: number | null;
  n: number;
  distribucion: Record<string, number>;
  histograma: Record<string, number> | null;
};

export type DimensionResultadoCx = { id: string; nombre: string; n_envios: number; indicador: IndicadorCx | null };
export type FactorResultadoCx = { id: string; nombre: string; media: number | null; n: number };
export type PalancaResultadoCx = { id: string; nombre: string; promotores: { media: number | null; n: number }; detractores: { media: number | null; n: number }; brecha: number | null };
export type OpcionResultadoCx = [string, string];
export type FiltrosResultadoCx = {
  encuesta_id?: string; sede_id?: string; servicio_id?: string; punto_id?: string;
  campana_id?: string; desde?: string; hasta?: string; n_minimo?: number;
  tipo_indicador?: IndicadorCx["tipo"];
};
export type ResumenResultadosCx = {
  total_envios: number; contactos: number; periodo: { desde: string | null; hasta: string | null };
  n_minimo: number; indicador_principal: IndicadorCx | null; indicadores: IndicadorCx[];
  factores: FactorResultadoCx[]; palancas: PalancaResultadoCx[];
  mensual: { mes: string; indicador: IndicadorCx }[];
  desglose: Record<"sede" | "servicio" | "punto" | "campana" | "encuesta", DimensionResultadoCx[]>;
  trazas: { campana_id: string; campana: string; estado: string; encuesta: string; version: number; n: number; primera_fecha: string; ultima_fecha: string; contactos: number }[];
  opciones: Record<"encuesta" | "campana" | "sede" | "servicio" | "punto", OpcionResultadoCx[]>;
};
