export const SESSION_EXPIRED_EVENT = "abril360:session-expired";

let emittedAt = 0;

export function emitSessionExpired() {
  if (typeof window === "undefined") return;

  const now = Date.now();
  if (now - emittedAt < 1000) return;
  emittedAt = now;

  window.dispatchEvent(new CustomEvent(SESSION_EXPIRED_EVENT));
}

export function loginPathForCurrentLocation() {
  if (typeof window === "undefined") return "/login";
  const next = `${window.location.pathname}${window.location.search}`;
  return `/login?next=${encodeURIComponent(next)}`;
}
