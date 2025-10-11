import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import BienvenidaUsuario from "@/components/ui/evaluaciones/BienvenidaUsuario";
import EvaluacionesPendientes from "@/components/ui/evaluaciones/EvaluacionesPendientes";
import EvaluacionesCompletadas from "@/components/ui/evaluaciones/EvaluacionesCompletadas";
import { obtenerEvaluacionesConProgreso } from "@/services/evaluacionService";
import { obtenerUsuario as obtenerUsuarioPorId } from "@/services/usuarioService";
import type { EvaluacionConProgreso } from "@/types/evaluacion";
import { useAuth } from "@/context/AuthContext";
import { toast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Filter, Search } from "lucide-react";

type Tab = "todas" | "pendientes" | "en_progreso" | "completadas";

/* ===================== Helpers tolerantes ===================== */
function normStr(v: unknown) {
  return String(v ?? "").trim();
}
function normLower(v: unknown) {
  return normStr(v).toLowerCase();
}

/** Normaliza a: pendiente | en_progreso | completada (el resto queda tal cual en minúscula) */
function normEstado(
  v: unknown
): "pendiente" | "en_progreso" | "completada" | string {
  const t = normLower(v);
  if (t.includes("pend")) return "pendiente";
  if (t.includes("progre")) return "en_progreso";
  if (t.includes("final") || t.includes("complet")) return "completada";
  return t;
}

/** Intenta diferentes nombres de id que podrían venir del backend */
function getEvalId(ev: any): string {
  // id preferido, luego variantes frecuentes; por último un hash simple opcional
  return (
    ev?.id ??
    ev?.evaluacion_id ??
    ev?.evaluacionId ??
    ev?.["evaluacion.id"] ??
    `${normStr(ev?.nombre)}-${normStr(ev?.descripcion)}`
  );
}

/** Lee nombre/descripcion desde varias formas posibles */
function getNombre(ev: any): string {
  return ev?.nombre ?? ev?.evaluacion_nombre ?? ev?.title ?? "Evaluación";
}
function getDescripcion(ev: any): string {
  return (
    ev?.descripcion ??
    ev?.evaluacion_descripcion ??
    ev?.description ??
    "Sin descripción"
  );
}
/* =============================================================== */

export default function EvaluacionesAsignadas() {
  const { userId } = useAuth(); // id (sub) del JWT
  const [evaluaciones, setEvaluaciones] = useState<EvaluacionConProgreso[]>([]);
  const [nombre, setNombre] = useState<string>("");
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<Tab>("todas");
  const location = useLocation();

  useEffect(() => {
    if (location.state?.finalizo) {
      toast({
        title: "¡Gracias por tu participación!",
        description: "Tu evaluación fue completada con éxito.",
        duration: 4000,
      });
    }
  }, [location.state]);

  // Nombre del usuario autenticado
  useEffect(() => {
    let mounted = true;
    (async () => {
      const uid = Number(userId);
      if (!Number.isFinite(uid)) return;
      try {
        const u = await obtenerUsuarioPorId(uid);
        if (mounted) setNombre(u?.nombre ?? "");
      } catch {
        if (mounted) setNombre("");
      }
    })();
    return () => {
      mounted = false;
    };
  }, [userId]);

  // Evaluaciones del usuario autenticado
  useEffect(() => {
    let mounted = true;
    (async () => {
      const uid = Number(userId);
      if (!Number.isFinite(uid)) {
        if (mounted) setEvaluaciones([]);
        return;
      }
      try {
        const data = await obtenerEvaluacionesConProgreso(uid);
        if (mounted) setEvaluaciones(Array.isArray(data) ? data : []);
      } catch {
        if (mounted) setEvaluaciones([]);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [userId]);

  const { pendientes, enProgreso, completadas } = useMemo(() => {
    const q = query.trim().toLowerCase();

    const matches = (ev: any) => {
      const txt = `${getNombre(ev)} ${getDescripcion(ev)}`.toLowerCase();
      return q === "" || txt.includes(q);
    };

    const p = (evaluaciones as any[]).filter(
      (ev) => normEstado(ev?.estado) === "pendiente" && matches(ev)
    );
    const e = (evaluaciones as any[]).filter(
      (ev) => normEstado(ev?.estado) === "en_progreso" && matches(ev)
    );
    const c = (evaluaciones as any[]).filter(
      (ev) => normEstado(ev?.estado) === "completada" && matches(ev)
    );

    return { pendientes: p, enProgreso: e, completadas: c };
  }, [evaluaciones, query]);

  const listaVisible = useMemo(() => {
    if (tab === "pendientes") return pendientes;
    if (tab === "en_progreso") return enProgreso;
    if (tab === "completadas") return completadas;
    // "todas": pendientes + en_progreso
    return [...pendientes, ...enProgreso];
  }, [tab, pendientes, enProgreso, completadas]);

  const totalPendientes = pendientes.length + enProgreso.length;

  return (
    <div className="p-6 space-y-6">
      <BienvenidaUsuario nombre={nombre} cantidadPendientes={totalPendientes} />

      {/* Buscador + filtro (placeholder) */}
      <div className="flex gap-2 items-center">
        <div className="relative w-full max-w-xl">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar evaluación"
            className="pl-8"
          />
        </div>
        <Button variant="outline">
          <Filter className="h-4 w-4 mr-2" />
          Filtrar
        </Button>
      </div>

      {/* Tabs mínimas sin librería extra */}
      <div className="flex gap-2 text-sm">
        {(
          [
            ["todas", "Todas"],
            ["pendientes", "Pendientes"],
            ["en_progreso", "En progreso"],
            ["completadas", "Completadas"],
          ] as [Tab, string][]
        ).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={[
              "px-3 py-1 rounded-full border",
              tab === key
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background text-foreground border-muted-foreground/30",
            ].join(" ")}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Pendientes / En progreso */}
      <EvaluacionesPendientes evaluaciones={listaVisible as any[]} />

      {/* Completadas */}
      <EvaluacionesCompletadas evaluaciones={completadas as any[]} />
    </div>
  );
}
