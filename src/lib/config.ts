// src/lib/config.ts
const LOOPBACK_HOSTS = new Set(["localhost", "127.0.0.1"]);

function normalizeApiUrl(value: string) {
  try {
    const url = new URL(value);
    const frontendHost = typeof window !== "undefined" ? window.location.hostname : "";
    if (LOOPBACK_HOSTS.has(url.hostname) && LOOPBACK_HOSTS.has(frontendHost)) {
      url.hostname = frontendHost;
    }
    return url.toString().replace(/\/$/, "");
  } catch {
    return value.replace(/\/$/, "");
  }
}

export const API_URL = normalizeApiUrl(
  import.meta.env.VITE_API_URL ??
    import.meta.env.VITE_API_BASE_URL ??
    "http://localhost:8000"
);
