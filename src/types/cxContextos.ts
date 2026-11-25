export type TipoContexto = "sedes" | "servicios";

export interface ContextoBase {
  id: string;
  codigo: string;
  nombre: string;
  activo: boolean;
  creado_en: string;
  actualizado_en: string;
}

export interface SedeCx extends ContextoBase {
  zona_horaria: string;
}

export interface ServicioCx extends ContextoBase {
  sector: string | null;
}

export interface PaginaContextos<T> {
  items: T[];
  siguiente_cursor: string | null;
}

export interface ServicioDeSede {
  id: string;
  servicio_id: string;
  codigo: string;
  nombre: string;
  vigente_desde: string;
}

export type DatosSede = Pick<SedeCx, "codigo" | "nombre" | "zona_horaria">;
export type DatosServicio = Pick<ServicioCx, "codigo" | "nombre" | "sector">;

export interface ErrorCx extends Error {
  status?: number;
}
