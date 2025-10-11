// src/components/ui/evaluaciones/EvaluacionesCompletadas.tsx
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Eye } from "lucide-react";
import type { EvaluacionConProgreso } from "@/types/evaluacion";

/* ===================== Helpers tolerantes ===================== */
type AnyEval = any;

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

function pickFecha(ev: any): string | Date | undefined {
  return (
    ev?.fecha_finalizacion ??
    ev?.fecha_cierre ??
    ev?.finalizada_en ??
    ev?.completed_at ??
    ev?.updated_at ??
    ev?.fecha ??
    ev?.evaluacion?.fecha_finalizacion ??
    ev?.evaluacion?.fecha_cierre
  );
}

function formatFecha(v?: string | Date) {
  try {
    if (!v) return "";
    const d = new Date(v);
    if (isNaN(d.getTime())) return "";
    return d.toLocaleDateString(undefined, {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "";
  }
}
/* =============================================================== */

type Props = {
  evaluaciones: EvaluacionConProgreso[] | AnyEval[];
};

export default function EvaluacionesCompletadas({ evaluaciones }: Props) {
  if (!evaluaciones || evaluaciones.length === 0) return null;

  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold">Evaluaciones completadas</h2>

      <Table>
        <TableCaption className="text-xs">
          Listado de evaluaciones que ya finalizaste
        </TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Título</TableHead>
            <TableHead>Fecha</TableHead>
            <TableHead className="text-right">Estado</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {(evaluaciones as AnyEval[]).map((ev) => {
            const key = String(getEvalId(ev));
            const nombre = getNombre(ev);
            const fecha = formatFecha(pickFecha(ev));
            return (
              <TableRow key={key}>
                <TableCell className="font-medium">{nombre}</TableCell>
                <TableCell>{fecha}</TableCell>
                <TableCell className="text-right">Completada</TableCell>
                <TableCell className="text-right">
                  <button
                    className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
                    title="Ver detalle"
                  >
                    <Eye className="h-4 w-4" />
                    Ver
                  </button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </section>
  );
}
