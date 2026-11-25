import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { projectNavigation, type NavigationEntry } from "./navigationTree";
import { fetchEffectiveDestinations } from "./effectiveNavigationService";

type Result = {
  items: NavigationEntry[];
  destinations: string[];
  loading: boolean;
  error: string | null;
  retry: () => void;
};

export function useEffectiveNavigation(): Result {
  const { userId, tenantId, roles, permissions } = useAuth();
  const accessSignature = `${userId}:${tenantId}:${roles.join(",")}:${permissions.join(",")}`;
  const [revision, setRevision] = useState(0);
  const [items, setItems] = useState<NavigationEntry[]>([]);
  const [destinations, setDestinations] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    fetchEffectiveDestinations(controller.signal)
      .then((destinos) => {
        if (!controller.signal.aborted) {
          setDestinations(destinos);
          setItems(projectNavigation(destinos));
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setDestinations([]);
          setItems([]);
          setError("No pudimos cargar tu navegación.");
        }
      })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [revision, accessSignature]);
  useEffect(() => {
    const refresh = () => setRevision(value => value + 1);
    window.addEventListener("focus", refresh);
    return () => window.removeEventListener("focus", refresh);
  }, []);
  return { items, destinations, loading, error, retry: () => setRevision((value) => value + 1) };
}
