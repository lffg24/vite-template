export const DRAFT_PREFIX = "abril360:capture-v2:";
const TTL = 24 * 60 * 60 * 1000;
const MAX_DRAFTS = 12;
type Envelope<T> = { baseline: string; value: T; expiresAt: number; updatedAt: number };

export function clearCaptureDrafts() {
  try {
    Object.keys(sessionStorage).filter((key) => key.startsWith(DRAFT_PREFIX) || key.startsWith("abril360:capture-draft:")).forEach((key) => sessionStorage.removeItem(key));
  } catch { /* Storage can be disabled by the browser. */ }
}

export function pruneCaptureDrafts(now = Date.now()) {
  const valid: { key: string; updatedAt: number }[] = [];
  for (const key of Object.keys(sessionStorage).filter((key) => key.startsWith(DRAFT_PREFIX))) {
    try {
      const entry = JSON.parse(sessionStorage.getItem(key) || "null");
      if (!entry || !Number.isFinite(entry.expiresAt) || entry.expiresAt <= now) sessionStorage.removeItem(key);
      else valid.push({ key, updatedAt: entry.updatedAt });
    } catch { sessionStorage.removeItem(key); }
  }
  valid.sort((a, b) => b.updatedAt - a.updatedAt).slice(MAX_DRAFTS).forEach(({ key }) => sessionStorage.removeItem(key));
}

export function readCaptureDraft<T>(key: string, baseline: T): T | null {
  try {
    pruneCaptureDrafts();
    const entry: Envelope<T> | null = JSON.parse(sessionStorage.getItem(key) || "null");
    // Never overwrite changes already saved in another tab/device.
    if (!entry || entry.baseline !== JSON.stringify(baseline) || !entry.value || typeof entry.value !== "object" ||
        Object.keys(baseline as object).some((field) => typeof (entry.value as Record<string, unknown>)[field] !== typeof (baseline as Record<string, unknown>)[field])) {
      sessionStorage.removeItem(key);
      return null;
    }
    return entry.value;
  } catch { return null; }
}

export function writeCaptureDraft<T>(key: string, baseline: T, value: T): boolean {
  try {
    if (JSON.stringify(value) === JSON.stringify(baseline)) sessionStorage.removeItem(key);
    else {
      const now = Date.now();
      const encoded = JSON.stringify({ baseline: JSON.stringify(baseline), value, updatedAt: now, expiresAt: now + TTL });
      if (encoded.length > 128 * 1024) return false;
      sessionStorage.setItem(key, encoded);
    }
    pruneCaptureDrafts();
    return true;
  } catch { return false; }
}
