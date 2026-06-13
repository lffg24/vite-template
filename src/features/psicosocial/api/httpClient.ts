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

async function parseError(res: Response): Promise<string> {
  try {
    const body = await res.json();
    if (typeof body?.detail === "string") return body.detail;
    if (typeof body?.detail?.error === "string") return body.detail.error;
    if (typeof body?.message === "string") return body.message;
    if (Array.isArray(body?.detail)) return body.detail[0]?.msg || `HTTP ${res.status}`;
    return JSON.stringify(body);
  } catch {
    const text = await res.text().catch(() => "");
    return text || `HTTP ${res.status}`;
  }
}

export async function requestJson<T>(path: string, init: RequestInit = {}): Promise<T> {
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
    const message = await parseError(res);
    if (res.status === 401) emitSessionExpired();
    throw new AbrilApiError(message, res.status, message);
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}
