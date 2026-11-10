import axios from "axios";

import { API_URL } from "@/lib/config";

export type TipoCalificacion = "NPS_RELACIONAL" | "NPS_EXPERIENCIA" | "CSAT" | "CES" | "FACTOR";

export interface PreguntaCalificacion {
  id: string;
  orden: number;
  tipo: TipoCalificacion;
  enunciado: string;
  obligatorio: boolean;
}

export interface FormularioCalificacion {
  titulo: string;
  version: number;
  presentacion: string;
  preguntas: PreguntaCalificacion[];
}

export interface EnvioCalificacion {
  id: string;
  version_id: string;
  repetido: boolean;
}

export interface ErrorCalificacion {
  status?: number;
  motivo?: string;
}

// La captura no usa el cliente administrativo: un visitante no tiene sesión.
const publico = axios.create({ baseURL: API_URL, timeout: 15000 });

export async function abrirCalificacion(token: string, signal?: AbortSignal): Promise<FormularioCalificacion> {
  const { data } = await publico.get<FormularioCalificacion>(`/cx/publico/${encodeURIComponent(token)}`, { signal });
  return data;
}

export async function enviarCalificacion(
  token: string,
  datos: {
    presentacion: string;
    idempotency_key: string;
    respuestas: Array<{ item_id: string; valor: number }>;
  },
): Promise<EnvioCalificacion> {
  const { data } = await publico.post<EnvioCalificacion>(
    `/cx/publico/${encodeURIComponent(token)}/respuestas`,
    datos,
  );
  return data;
}

export function errorCalificacion(error: unknown): ErrorCalificacion {
  if (!axios.isAxiosError(error)) return {};
  const detalle = error.response?.data?.detail;
  return {
    status: error.response?.status,
    motivo: typeof detalle?.motivo === "string" ? detalle.motivo : undefined,
  };
}
