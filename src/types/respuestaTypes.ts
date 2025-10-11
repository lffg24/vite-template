// respuestaTypes.ts

export interface RespuestaCreate {
  usuario_id: number;
  evaluacion_id: number;
  pregunta_id: number;
  valor: string;
}

export interface RespuestaUpdate extends RespuestaCreate {
  id: number;
}

export type Respuesta = RespuestaUpdate;
