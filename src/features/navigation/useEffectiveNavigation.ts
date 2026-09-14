import { useEffect, useState } from "react";
import { API_URL } from "@/lib/config";
import { emitSessionExpired } from "@/lib/sessionEvents";
import { useAuth } from "@/context/AuthContext";
import { projectNavigation, type NavigationEntry } from "./navigationTree";

type Result = { items: NavigationEntry[]; loading: boolean; error: string | null; retry: () => void };

export function useEffectiveNavigation(): Result {
  const { userId, tenantId, roles, permissions } = useAuth();
  const accessSignature = `${userId}:${tenantId}:${roles.join(",")}:${permissions.join(",")}`;
  const [revision, setRevision] = useState(0);
  const [items, setItems] = useState<NavigationEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    fetch(`${API_URL}/acceso/navegacion`, { credentials: "include", signal: controller.signal })
      .then(async (response) => {
        if (response.status === 401) emitSessionExpired();
        if (!response.ok) throw new Error("No pudimos cargar tu navegación.");
        return response.json() as Promise<{ destinos: string[] }>;
      })
      .then(({ destinos }) => { if (!controller.signal.aborted) setItems(projectNavigation(destinos)); })
      .catch(() => { if (!controller.signal.aborted) { setItems([]); setError("No pudimos cargar tu navegación."); } })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [revision, accessSignature]);
  useEffect(() => {
    const refresh = () => setRevision(value => value + 1);
    window.addEventListener("focus", refresh);
    return () => window.removeEventListener("focus", refresh);
  }, []);
  return { items, loading, error, retry: () => setRevision((value) => value + 1) };
}
