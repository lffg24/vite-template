import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  BadgeCheck,
  Brain,
  ClipboardList,
  Gauge,
  LineChart,
  Target,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

/** El componente recibe cualquier shape de evaluación y lo normaliza aquí */
type AnyEval = any;

/* ===================== Helpers ===================== */
function getEvalId(ev: AnyEval): string {
  return (
    ev?.id ??
    ev?.evaluacion_id ??
    ev?.evaluacionId ??
    ev?.["evaluacion.id"] ??
    `${ev?.nombre ?? ""}-${ev?.descripcion ?? ""}`
  );
}
function getNombre(ev: any): string {
  return (
    ev?.nombre ??
    ev?.titulo ??
    ev?.evaluacion_nombre ??
    ev?.nombre_evaluacion ??
    ev?.evaluacion?.nombre ??
    ev?.evaluacion?.titulo ??
    "Evaluación"
  );
}
function getDescripcion(ev: any): string {
  return (
    ev?.descripcion ??
    ev?.resumen ??
    ev?.evaluacion_descripcion ??
    ev?.descripcion_evaluacion ??
    ev?.evaluacion?.descripcion ??
    ev?.evaluacion?.resumen ??
    ev?.description ??
    "Sin descripción"
  );
}
function isEnProgreso(ev: AnyEval): boolean {
  const t = String(ev?.estado ?? "").toLowerCase();
  return t.includes("progre");
}
function iconFor(ev: AnyEval) {
  const icons = [Target, Brain, LineChart, ClipboardList, Gauge, BadgeCheck];
  const raw = getEvalId(ev);
  let sum = 0;
  for (let i = 0; i < String(raw).length; i++)
    sum = (sum + String(raw).charCodeAt(i)) % 997;
  const idx = sum % icons.length;
  return icons[idx];
}
/* =================================================== */

type Props = { evaluaciones: AnyEval[] };

export default function EvaluacionesPendientes({ evaluaciones }: Props) {
  const navigate = useNavigate(); // +++
  if (!evaluaciones || evaluaciones.length === 0) {
    return (
      <div className="text-sm text-muted-foreground">
        No tienes evaluaciones pendientes por ahora.
      </div>
    );
  }

  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold">Evaluaciones pendientes</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {evaluaciones.map((ev) => {
          const Icon = iconFor(ev);
          const titulo = getNombre(ev);
          const descripcion = getDescripcion(ev);
          const enProgreso = isEnProgreso(ev);
          const key = String(getEvalId(ev));

          return (
            <Card key={key} className="bg-emerald-50/40 border-emerald-100">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2 text-emerald-700">
                  <Icon className="h-4 w-4" />
                  <span className="text-xs font-medium">
                    {enProgreso ? "En progreso" : "Pendiente"}
                  </span>
                </div>
                <h3 className="text-base font-semibold mt-1">{titulo}</h3>
              </CardHeader>
              <CardContent className="pt-0 space-y-3">
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {descripcion}
                </p>
                <div>
                  {/* Cableamos navegación en el siguiente paso, para mantener diff chico */}
                  <Button
                    size="sm"
                    className="bg-emerald-600 hover:bg-emerald-700"
                    onClick={() => {
                      const id =
                        ev?.evaluacion_id ?? ev?.id ?? ev?.evaluacionId;
                      if (id == null) return; // evitamos rutas inválidas
                      navigate(`/evaluacion/${id}/responder`);
                    }}
                  >
                    {enProgreso ? "Continuar" : "Iniciar"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
