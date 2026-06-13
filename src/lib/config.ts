// src/lib/config.ts
const LOOPBACK_HOSTS = new Set(["localhost", "127.0.0.1"]);
const RAILWAY_HOST_SUFFIX = ".railway.app";

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

function isLoopback(hostname: string) {
  return LOOPBACK_HOSTS.has(hostname);
}

function isRailwayApi(value: string) {
  try {
    return new URL(value).hostname.endsWith(RAILWAY_HOST_SUFFIX);
  } catch {
    return false;
  }
}

export function resolveApiUrl(configuredValue: string, frontendHost: string) {
  const configured = configuredValue || "http://localhost:8000";
  const isHostedFrontend = frontendHost !== "" && !isLoopback(frontendHost);
  const configuredIsLoopback = (() => {
    try {
      return isLoopback(new URL(configured).hostname);
    } catch {
      return false;
    }
  })();

  if (isHostedFrontend && (configuredIsLoopback || isRailwayApi(configured))) {
    return "/api";
  }

  return normalizeApiUrl(configured);
}

export const API_URL = resolveApiUrl(
  import.meta.env.VITE_API_URL ?? import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000",
  typeof window !== "undefined" ? window.location.hostname : ""
);
