import { API_URL } from "@/lib/config";
import { emitSessionExpired } from "@/lib/sessionEvents";

export class AbrilApiError extends Error {
  status: number;
  detail: unknown;

  constructor(message: string, status: number, detail?: unknown) {
    super(message);
    this.name = "AbrilApiError";
    this.status = status;
    this.detail = detail;
  }
}

export function apiBase() {
  return API_URL;
}

async function parseError(res: Response): Promise<{ message: string; detail?: unknown }> {
  try {
    const body = await res.json();
    if (typeof body?.detail === "string") return { message: body.detail, detail: body.detail };
    if (typeof body?.detail?.message === "string") return { message: body.detail.message, detail: body.detail };
    if (typeof body?.detail?.error === "string") return { message: body.detail.error, detail: body.detail };
    if (typeof body?.message === "string") return { message: body.message, detail: body };
    if (Array.isArray(body?.detail)) return { message: body.detail[0]?.msg || `HTTP ${res.status}`, detail: body.detail };
    return { message: JSON.stringify(body), detail: body };
  } catch {
    const text = await res.text().catch(() => "");
    return { message: text || `HTTP ${res.status}`, detail: text };
  }
}

async function requestJsonWithPolicy<T>(
  path: string,
  init: RequestInit,
  emitUnauthorized: boolean,
): Promise<T> {
  const isFormData = typeof FormData !== "undefined" && init.body instanceof FormData;
  const headers: HeadersInit = {
    Accept: "application/json",
    ...(init.body && !isFormData ? { "Content-Type": "application/json" } : {}),
    ...(init.headers || {}),
  };

  const res = await fetch(`${apiBase()}${path}`, {
    ...init,
    credentials: "include",
    headers,
  });

  if (!res.ok) {
    const { message, detail } = await parseError(res);
    if (res.status === 401 && emitUnauthorized) emitSessionExpired();
    throw new AbrilApiError(message, res.status, detail);
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export async function requestJson<T>(path: string, init: RequestInit = {}): Promise<T> {
  return requestJsonWithPolicy<T>(path, init, true);
}

/** Solicitudes de enlaces públicos que no dependen de la sesión del panel. */
export async function requestPublicJson<T>(path: string, init: RequestInit = {}): Promise<T> {
  return requestJsonWithPolicy<T>(path, init, false);
}
