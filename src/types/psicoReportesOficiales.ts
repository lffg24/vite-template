export type TipoReportePsicoOficial =
  | "resultados"
  | "resultados_areas"
  | "sociodemografico"
  | "base_forma_a"
  | "base_forma_b"
  | "base_general";

export interface ReporteAplicacionOption {
  id: number;
  nombre: string;
  empresa_id?: string;
  empresa_nombre?: string;
  estado?: string | null;
  fecha_aplicacion?: string | null;
}

export interface ReporteHtmlResponse {
  html: string;
}

export interface ReporteAnalisisPrioridad {
  label: string;
  instrumento?: string;
  pt: number;
  pct_alto_muy_alto: number;
  indice_prioridad: number;
  criticidad: "Crítica" | "Alta" | "Media" | "Preventiva" | string;
}
