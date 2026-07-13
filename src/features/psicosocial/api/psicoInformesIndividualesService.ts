import { API_URL } from "@/lib/config";
import { emitSessionExpired } from "@/lib/sessionEvents";
import { requestJson } from "./httpClient";

export type InformeIndividualStatus =
  | "AVAILABLE"
  | "NOT_APPLICABLE"
  | "MISSING_SCORE"
  | "MISSING_LEVEL"
  | "APP_NOT_CALCULATED"
  | "FORBIDDEN"
  | "INCONSISTENT_FORM"
  | string;

export type PsicoInformeIndividualItem = {
  instrument_code: string;
  instrumento: string;
  titulo: string;
  available: boolean;
  status: InformeIndividualStatus;
  reason?: string;
  puntaje_transformado?: number | null;
  nivel_riesgo?: string | null;
  nivel_riesgo_key?: string | null;
  nivel_riesgo_label?: string | null;
};

export type PsicoInformesIndividualesResponse = {
  ok: boolean;
  empleado: {
    id?: number;
    cedula?: string | null;
    nombre_completo?: string | null;
    cargo?: string | null;
    area?: string | null;
  };
  empresa: {
    id?: string;
    nombre?: string | null;
    razon_social?: string | null;
    nit?: string | null;
  };
  aplicacion: {
    id?: number;
    nombre?: string | null;
    estado?: string | null;
    fecha_aplicacion?: string | null;
    created_at?: string | null;
  };
  informes: PsicoInformeIndividualItem[];
  no_disponibles: PsicoInformeIndividualItem[];
  fuente_normativa?: string[];
};

export type BulkInformeIndividualFormat = "doc" | "pdf";

export type BulkInformeIndividualItem = {
  empleado_id: number;
  instrument_code: string;
};

export type BulkInformeIndividualProgress = {
  receivedBytes: number;
};

export function obtenerInformesIndividuales(empleadoId: number | string, aplicacionId: number | string) {
  return requestJson<PsicoInformesIndividualesResponse>(
    `/psicosocial/empleados/${empleadoId}/aplicaciones/${aplicacionId}/informes`,
  );
}

export function informeIndividualHtmlUrl(empleadoId: number | string, aplicacionId: number | string, instrumentCode: string) {
  return `${API_URL}/psicosocial/empleados/${empleadoId}/aplicaciones/${aplicacionId}/informes/${encodeURIComponent(instrumentCode)}/html`;
}

export async function obtenerHtmlInformeIndividual(
  empleadoId: number | string,
  aplicacionId: number | string,
  instrumentCode: string,
) {
  const response = await fetch(informeIndividualHtmlUrl(empleadoId, aplicacionId, instrumentCode), {
    credentials: "include",
  });
  if (!response.ok) {
    if (response.status === 401) emitSessionExpired();
    throw new Error(await response.text());
  }
  return response.text();
}

export async function descargarInformeIndividualDoc(
  empleadoId: number | string,
  aplicacionId: number | string,
  instrumentCode: string,
  filename: string,
) {
  return descargarArchivoInformeIndividual(empleadoId, aplicacionId, instrumentCode, "doc", filename);
}

export async function descargarInformeIndividualPdf(
  empleadoId: number | string,
  aplicacionId: number | string,
  instrumentCode: string,
  filename: string,
) {
  return descargarArchivoInformeIndividual(empleadoId, aplicacionId, instrumentCode, "pdf", filename);
}

export async function descargarZipInformesIndividuales(
  aplicacionId: number | string,
  formato: BulkInformeIndividualFormat,
  items: BulkInformeIndividualItem[],
  filename: string,
  onProgress?: (progress: BulkInformeIndividualProgress) => void,
) {
  const response = await fetch(`${API_URL}/psicosocial/aplicaciones/${aplicacionId}/informes-individuales/zip`, {
    method: "POST",
    credentials: "include",
    headers: {
      Accept: "application/zip",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ formato, items }),
  });
  if (!response.ok) {
    if (response.status === 401) emitSessionExpired();
    let message = `HTTP ${response.status}`;
    const raw = await response.text().catch(() => "");
    try {
      const body = raw ? JSON.parse(raw) : null;
      message = typeof body?.detail === "string" ? body.detail : message;
    } catch {
      message = raw || message;
    }
    throw new Error(message);
  }

  let blob: Blob;
  if (response.body?.getReader) {
    const reader = response.body.getReader();
    const chunks: BlobPart[] = [];
    let receivedBytes = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) {
        chunks.push(value.buffer.slice(value.byteOffset, value.byteOffset + value.byteLength) as ArrayBuffer);
        receivedBytes += value.byteLength;
        onProgress?.({ receivedBytes });
      }
    }
    blob = new Blob(chunks, { type: "application/zip" });
  } else {
    blob = await response.blob();
    onProgress?.({ receivedBytes: blob.size });
  }

  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

async function descargarArchivoInformeIndividual(
  empleadoId: number | string,
  aplicacionId: number | string,
  instrumentCode: string,
  extension: "pdf" | "doc",
  filename: string,
) {
  const response = await fetch(
    `${API_URL}/psicosocial/empleados/${empleadoId}/aplicaciones/${aplicacionId}/informes/${encodeURIComponent(instrumentCode)}/${extension}`,
    { credentials: "include" },
  );
  if (!response.ok) {
    if (response.status === 401) emitSessionExpired();
    let message = `HTTP ${response.status}`;
    try {
      const body = await response.json();
      message = typeof body?.detail === "string" ? body.detail : message;
    } catch {}
    throw new Error(message);
  }
  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}
