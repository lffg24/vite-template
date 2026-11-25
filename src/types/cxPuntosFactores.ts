import type { ContextoBase, PaginaContextos } from "./cxContextos";

export interface PuntoCx extends ContextoBase {
  sede_id: string;
  servicio_id: string | null;
  sede_nombre?: string | null;
  servicio_nombre?: string | null;
}

export interface FactorCx extends ContextoBase {}

export interface SubfactorCx extends FactorCx {
  factor_id: string;
}

export type PaginaCx<T> = PaginaContextos<T>;

export interface AplicabilidadCx {
  factor_id: string;
  sede_ids: string[];
  servicio_ids: string[];
  sedes?: { id: string; nombre: string }[];
  servicios?: { id: string; nombre: string }[];
}
