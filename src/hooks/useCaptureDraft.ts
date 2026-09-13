import { useCallback, useEffect, useRef, useState } from "react";
import { readCaptureDraft, writeCaptureDraft } from "@/lib/captureDraft";

export function useCaptureDraft<T>(key: string, value: T) {
  const [storageAvailable, setStorageAvailable] = useState(true);
  const loaded = useRef<{ key: string; baseline: T; locked: boolean } | null>(null);
  const current = useRef({ key, value });
  current.current = { key, value };
  const restore = useCallback((scope: string, baseline: T, locked = false) => {
    loaded.current = { key: scope, baseline, locked };
    if (locked) {
      writeCaptureDraft(scope, baseline, baseline);
      return baseline;
    }
    return readCaptureDraft(scope, baseline) ?? baseline;
  }, []);
  const flush = useCallback(() => {
    const snapshot = loaded.current;
    const latest = current.current;
    if (!snapshot || snapshot.locked || snapshot.key !== latest.key) return true;
    const stored = writeCaptureDraft(snapshot.key, snapshot.baseline, latest.value);
    setStorageAvailable(stored);
    return stored;
  }, []);
  const acknowledge = useCallback((scope: string, saved: T) => {
    if (loaded.current?.key === scope) loaded.current.baseline = saved;
    writeCaptureDraft(scope, saved, saved);
  }, []);
  useEffect(() => {
    const timer = window.setTimeout(flush, 450);
    return () => window.clearTimeout(timer);
  }, [key, value, flush]);
  useEffect(() => {
    const save = () => { flush(); };
    const discard = () => { if (loaded.current) loaded.current.locked = true; };
    window.addEventListener("abril360:explicit-logout", discard);
    window.addEventListener("pagehide", save);
    window.addEventListener("abril360:before-session-exit", save);
    document.addEventListener("visibilitychange", save);
    return () => {
      save();
      window.removeEventListener("abril360:explicit-logout", discard);
      window.removeEventListener("pagehide", save);
      window.removeEventListener("abril360:before-session-exit", save);
      document.removeEventListener("visibilitychange", save);
    };
  }, [flush]);
  return { restore, flush, acknowledge, storageAvailable };
}
