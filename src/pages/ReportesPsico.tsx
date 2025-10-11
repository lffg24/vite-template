import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Download, Loader2 } from "lucide-react";

import MultiSelectEvaluaciones from "@/components/ui/reportes/MultiSelectEvaluaciones";
import DimensionesBar from "@/components/ui/reportes/DimensionesBar";
import TablaDominios from "@/components/ui/reportes/TablaDominios";

import {
  getNivelesDimensiones,
  downloadNivelesDimensionesCSV,
  NivelDimItem,
} from "@/services/reportes";

export default function ReportesPsico() {
  const [evalIds, setEvalIds] = useState<number[]>([]);
  const [data, setData] = useState<NivelDimItem[]>([]);
  const [total, setTotal] = useState<{
    avg: number;
    n: number;
    nivel: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);

  const canQuery = evalIds.length > 0;

  async function refresh() {
    if (!canQuery) return;
    setLoading(true);
    try {
      const res = await getNivelesDimensiones(evalIds);
      setData(res.items || []);
      setTotal({
        avg: res.total_avg_0_100,
        n: res.total_n,
        nivel: res.total_nivel,
      });
    } catch (e) {
      console.error(e);
      setData([]);
      setTotal(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // Si quieres auto-refrescar al cambiar selección:
    // refresh();
  }, [evalIds]);

  return (
    <div className="container mx-auto p-4 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Reporte Psicosocial – Dimensiones</CardTitle>
          <CardDescription>
            Selecciona evaluaciones y visualiza el promedio 0–100 y nivel por
            dimensión.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-3 gap-3">
            <div className="md:col-span-2">
              <MultiSelectEvaluaciones value={evalIds} onChange={setEvalIds} />
            </div>
            <div className="flex items-center gap-2 justify-end">
              <Button onClick={refresh} disabled={!canQuery || loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Consultar
              </Button>
              <Button
                variant="outline"
                onClick={() => downloadNivelesDimensionesCSV(evalIds)}
                disabled={!canQuery || loading || data.length === 0}
              >
                <Download className="mr-2 h-4 w-4" />
                CSV
              </Button>
            </div>
          </div>

          {loading ? (
            <div className="space-y-3">
              <Skeleton className="h-6 w-56" />
              <Skeleton className="h-[560px] w-full" />
            </div>
          ) : data.length === 0 ? (
            <div className="text-sm text-muted-foreground">
              {canQuery
                ? "Sin datos para la selección."
                : "Selecciona al menos una evaluación y pulsa Consultar."}
            </div>
          ) : (
            <>
              {total && (
                <div className="text-sm">
                  <b>Total:</b> {total.avg} (nivel <b>{total.nivel}</b>) · n=
                  {total.n}
                </div>
              )}
              <DimensionesBar data={data} />
            </>
          )}

          {!loading && data.length > 0 && (
            <>
              {total && (
                <div className="text-sm mb-2">
                  <b>Total:</b> {total.avg} (nivel <b>{total.nivel}</b>) · n=
                  {total.n}
                </div>
              )}
              <DimensionesBar data={data} />

              <div className="mt-8">
                <h3 className="font-medium mb-2">
                  Tabla por dominio y dimensiones
                </h3>
                <TablaDominios evaluacionIds={evalIds} />
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
