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

/** El texto de tratamiento de datos tal como se le muestra a la persona. El
 *  `texto_id` vuelve en el envío: la aceptación se registra contra la versión
 *  exacta que se presentó, no contra «la vigente al enviar». */
export interface AutorizacionCalificacion {
  clave: string;
  texto_id: string;
  version: number;
  finalidad: string | null;
  contenido: string;
}

export interface ContactoSolicitado {
  pide_telefono: boolean;
  autorizacion: AutorizacionCalificacion;
}

export interface FormularioCalificacion {
  titulo: string;
  version: number;
  presentacion: string;
  preguntas: PreguntaCalificacion[];
  /** `null` = encuesta anónima. Llega `null` también cuando la versión pide
   *  contacto pero su texto de autorización dejó de ser utilizable: ahí el
   *  formulario degrada a anónimo en vez de dejar de funcionar. */
  contacto: ContactoSolicitado | null;
}

export interface ContactoCalificacion {
  nombre: string;
  correo: string;
  telefono: string | null;
  consentimiento: boolean;
  texto_id_presentado: string;
}

export interface EnvioCalificacion {
  id: string;
  version_id: string;
  repetido: boolean;
}

export interface ErrorCalificacion {
  status?: number;
  motivo?: string;
  /** El mensaje del servidor. Se usa en los rechazos que la persona puede
   *  corregir —le falta el nombre, el correo no es válido—, donde un texto
   *  genérico la dejaría sin saber qué arreglar. */
  mensaje?: string;
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
    /** Omitirlo es siempre válido: la calificación anónima se puede enviar
     *  incluso en una encuesta que pide contacto. */
    contacto?: ContactoCalificacion | null;
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
    mensaje: typeof detalle?.mensaje === "string" ? detalle.mensaje : undefined,
  };
}
