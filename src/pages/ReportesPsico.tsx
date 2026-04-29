import { useEffect, useMemo, useState } from "react";
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
import {
  getTablaDominios,
  downloadNivelesDimensionesCSV,
} from "@/services/reportes";
import { obtenerEvaluacion } from "@/services/evaluacionService";

// ===== Tipos (alineados al backend) =====
type NivelesDist = { [k: string]: number };
type Dimension = {
  dimension_code: string;
  dimension: string;
  puntaje_t: number;
  n: number;
  niveles: NivelesDist;
  constructo?: "intralaboral" | "extralaboral";
};
type Dominio = {
  dominio_code: string;
  dominio: string;
  puntaje_t: number;
  n: number;
  niveles: NivelesDist;
  dimensiones: Dimension[];
  constructo?: "intralaboral" | "extralaboral";
};
type TablaDominiosResponse = { dominios: Dominio[] };

// ===== UI helpers =====
// Orden real de dominios intralaborales
const ORDER_INTRA = [
  "control_sobre_el_trabajo",
  "demandas_del_trabajo",
  "liderazgo_y_relaciones",
  "recompensas",
];

const DOMINIO_STYLES: Record<
  string,
  { bg: string; border: string; text: string }
> = {
  control_sobre_el_trabajo: {
    bg: "bg-indigo-50",
    border: "border-indigo-200",
    text: "text-indigo-700",
  },
  demandas_del_trabajo: {
    bg: "bg-amber-50",
    border: "border-amber-200",
    text: "text-amber-700",
  },
  liderazgo_y_relaciones: {
    bg: "bg-sky-50",
    border: "border-sky-200",
    text: "text-sky-700",
  },
  recompensas: {
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    text: "text-emerald-700",
  },
  extralaboral: {
    bg: "bg-fuchsia-50",
    border: "border-fuchsia-200",
    text: "text-fuchsia-700",
  },
  default: {
    bg: "bg-muted/30",
    border: "border-muted",
    text: "text-foreground",
  },
};

function sortIntra(doms: Dominio[]) {
  const order = new Map(ORDER_INTRA.map((c, i) => [c, i]));
  return [...doms].sort((a, b) => {
    const ai = order.get(a.dominio_code) ?? 999;
    const bi = order.get(b.dominio_code) ?? 999;
    return ai - bi || a.dominio.localeCompare(b.dominio);
  });
}

// ===== Tabla simple para UN dominio =====
function TablaDominioSimple({ dominio }: { dominio: Dominio }) {
  const nivelCols = [
    "Sin riesgo",
    "Bajo",
    "Medio",
    "Alto",
    "Muy alto",
  ] as const;

  return (
    <div className="space-y-2">
      <div className="text-sm text-muted-foreground">
        Puntaje (T): <b>{dominio.puntaje_t.toFixed(2)}</b> · n=
        <b>{dominio.n}</b>
      </div>

      <div className="overflow-x-auto rounded-md border bg-background">
        <table className="w-full text-sm">
          <thead className="bg-muted/40">
            <tr>
              <th className="text-left p-3 font-medium">Dimensión</th>
              <th className="text-right p-3 font-medium">Puntaje (T)</th>
              <th className="text-right p-3 font-medium">n</th>
              {nivelCols.map((nc) => (
                <th key={nc} className="text-right p-3 font-medium">
                  {nc}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {dominio.dimensiones.map((d) => (
              <tr key={d.dimension_code} className="border-t">
                <td className="p-3">{d.dimension}</td>
                <td className="p-3 text-right">{d.puntaje_t.toFixed(2)}</td>
                <td className="p-3 text-right">{d.n}</td>
                {nivelCols.map((nc) => (
                  <td key={nc} className="p-3 text-right">
                    {d.niveles?.[nc] ?? 0}
                  </td>
                ))}
              </tr>
            ))}
            <tr className="border-t bg-muted/20">
              <td className="p-3 font-medium">Total dominio</td>
              <td className="p-3 text-right font-medium">
                {dominio.puntaje_t.toFixed(2)}
              </td>
              <td className="p-3 text-right font-medium">{dominio.n}</td>
              {nivelCols.map((nc) => (
                <td key={nc} className="p-3 text-right font-medium">
                  {dominio.niveles?.[nc] ?? 0}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function ReportesPsico() {
  const [evalIds, setEvalIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Tablas por evaluación y tabla consolidada
  const [tablaPorEval, setTablaPorEval] = useState<
    Record<number, TablaDominiosResponse>
  >({});
  const [tablaAll, setTablaAll] = useState<TablaDominiosResponse | null>(null);

  // Nombres visibles de cada evaluación seleccionada (id -> nombre)
  const [evalNames, setEvalNames] = useState<Record<number, string>>({});
  const canQuery = evalIds.length > 0;

  async function loadEvalNames(ids: number[]) {
    try {
      const pairs = await Promise.all(
        ids.map(async (id) => {
          const det = await obtenerEvaluacion(Number(id));
          const nombre =
            det?.nombre ??
            det?.titulo ??
            det?.descripcion ??
            `Evaluación ${id}`;
          return [Number(id), String(nombre)] as const;
        })
      );
      const map: Record<number, string> = {};
      pairs.forEach(([id, name]) => (map[id] = name));
      setEvalNames(map);
    } catch {
      const map: Record<number, string> = {};
      ids.forEach((id) => (map[id] = `Evaluación ${id}`));
      setEvalNames(map);
    }
  }

  function nombreEval(id: number) {
    return evalNames[id] || `Evaluación ${id}`;
  }
  const nombresSeleccion = useMemo(
    () => evalIds.map(nombreEval).join(" + "),
    [evalIds, evalNames]
  );

  async function refresh() {
    if (!canQuery) return;
    setLoading(true);
    setError(null);
    setTablaPorEval({});
    setTablaAll(null);

    try {
      await loadEvalNames(evalIds);

      // 1) Por evaluación
      const perEval = await Promise.all(
        evalIds.map(async (id) => {
          const r = (await getTablaDominios([id])) as TablaDominiosResponse;
          return [id, r] as const;
        })
      );
      const map: Record<number, TablaDominiosResponse> = {};
      perEval.forEach(([id, r]) => (map[id] = r));
      setTablaPorEval(map);

      // 2) Consolidado
      const rAll = (await getTablaDominios(evalIds)) as TablaDominiosResponse;
      setTablaAll(rAll);
    } catch (e) {
      console.error(e);
      setError("No se pudo obtener la información del reporte.");
    } finally {
      setLoading(false);
    }
  }

  // Agrupar por constructo desde el consolidado (si no hay consolidado aún, usa la 1ª evaluación con datos)
  const { intraDominios, extraDominios } = useMemo(() => {
    const base = tablaAll?.dominios?.length
      ? tablaAll.dominios
      : (() => {
          const first = evalIds.find(
            (id) => tablaPorEval[id]?.dominios?.length
          );
          return first ? tablaPorEval[first].dominios : [];
        })();

    const intra = base.filter(
      (d) =>
        (d.constructo ??
          (d.dominio_code === "extralaboral"
            ? "extralaboral"
            : "intralaboral")) === "intralaboral"
    );
    const extra = base.filter(
      (d) =>
        (d.constructo ??
          (d.dominio_code === "extralaboral"
            ? "extralaboral"
            : "intralaboral")) === "extralaboral"
    );

    return {
      intraDominios: sortIntra(intra),
      extraDominios: extra.sort((a, b) => a.dominio.localeCompare(b.dominio)),
    };
  }, [tablaAll, tablaPorEval, evalIds]);

  // Pre-carga de nombres cuando cambie la selección (no bloquea UI)
  useEffect(() => {
    if (evalIds.length) loadEvalNames(evalIds);
    else setEvalNames({});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [evalIds.join(",")]);

  return (
    <div className="container mx-auto p-4 space-y-4">
      {/* ===== Encabezado general con estilo shadcn ===== */}
      <div className="space-y-1">
        <h1 className="scroll-m-20 text-2xl font-semibold tracking-tight">
          RESULTADOS PARA LA IDENTIFICACIÓN DE LOS FACTORES PSICOSOCIALES
        </h1>
        <p className="text-sm text-muted-foreground">
          Para cada <b>dominio</b> verás primero las tablas por evaluación (2×N)
          y luego el <b>consolidado</b>, agrupado por <b>constructo</b>{" "}
          (intralaboral / extralaboral).
        </p>
      </div>

      <Card className="border shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-medium">
            Controles del reporte
          </CardTitle>
          <CardDescription>
            Exporta el CSV del consolidado de las evaluaciones seleccionadas.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Filtros y acciones */}
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
                disabled={!canQuery || loading}
              >
                <Download className="mr-2 h-4 w-4" />
                CSV
              </Button>
            </div>
          </div>

          {/* Estado de carga / error / vacío */}
          {error && <p className="text-red-600 text-sm">{error}</p>}
          {!canQuery ? (
            <div className="text-sm text-muted-foreground">
              Selecciona al menos una evaluación y pulsa <b>Consultar</b>.
            </div>
          ) : loading ? (
            <div className="space-y-4">
              <Skeleton className="h-6 w-72" />
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Skeleton className="h-[420px] w-full" />
                <Skeleton className="h-[420px] w-full" />
              </div>
              <Skeleton className="h-[420px] w-full" />
            </div>
          ) : (
            <>
              {/* ===== Bloque: Condiciones Intralaborales ===== */}
              {intraDominios.length > 0 && (
                <div className="space-y-4">
                  <h2 className="scroll-m-20 text-xl font-semibold tracking-tight">
                    Condiciones Intralaborales
                  </h2>

                  {intraDominios.map((domBase) => {
                    const domCode = domBase.dominio_code;
                    const styles =
                      DOMINIO_STYLES[domCode] ?? DOMINIO_STYLES.default;
                    const domAll = tablaAll?.dominios.find(
                      (d) => d.dominio_code === domCode
                    );

                    return (
                      <div
                        key={domCode}
                        className={`rounded-xl border ${styles.border} ${styles.bg} p-4`}
                      >
                        <div className="mb-3">
                          <h3
                            className={`scroll-m-20 text-lg font-semibold tracking-tight ${styles.text}`}
                          >
                            {domBase.dominio}
                          </h3>
                          <p className="text-xs text-muted-foreground">
                            Resultados por evaluación (arriba) y consolidado del
                            dominio (abajo).
                          </p>
                        </div>

                        <div className="space-y-4">
                          {/* Grid 2×N: tarjetas por evaluación */}
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            {evalIds.map((id) => {
                              const tabla = tablaPorEval[id];
                              const dom = tabla?.dominios.find(
                                (d) => d.dominio_code === domCode
                              );

                              return (
                                <Card
                                  key={`${domCode}-${id}`}
                                  className="border shadow-sm"
                                >
                                  <CardHeader className="pb-2">
                                    <CardTitle className="text-sm">
                                      {nombreEval(id)}
                                    </CardTitle>
                                    {dom ? (
                                      <CardDescription className="text-xs">
                                        Puntaje (T):{" "}
                                        <b>{dom.puntaje_t.toFixed(2)}</b> · n=
                                        <b>{dom.n}</b>
                                      </CardDescription>
                                    ) : (
                                      <CardDescription className="text-xs text-muted-foreground">
                                        Sin datos para este dominio.
                                      </CardDescription>
                                    )}
                                  </CardHeader>
                                  <CardContent>
                                    {dom ? (
                                      <TablaDominioSimple dominio={dom} />
                                    ) : (
                                      <div className="text-sm text-muted-foreground">
                                        No hay registros para {nombreEval(id)}{" "}
                                        en este dominio.
                                      </div>
                                    )}
                                  </CardContent>
                                </Card>
                              );
                            })}
                          </div>

                          {/* Consolidado del dominio: ancho completo */}
                          <Card className="border shadow-sm">
                            <CardHeader className="pb-2">
                              <CardTitle className="text-sm">
                                Consolidado ({nombresSeleccion})
                              </CardTitle>
                              {domAll ? (
                                <CardDescription className="text-xs">
                                  Puntaje (T):{" "}
                                  <b>{domAll.puntaje_t.toFixed(2)}</b> · n=
                                  <b>{domAll.n}</b>
                                </CardDescription>
                              ) : (
                                <CardDescription className="text-xs text-muted-foreground">
                                  Sin datos consolidados para este dominio.
                                </CardDescription>
                              )}
                            </CardHeader>
                            <CardContent>
                              {domAll ? (
                                <TablaDominioSimple dominio={domAll} />
                              ) : (
                                <div className="text-sm text-muted-foreground">
                                  No hay registros consolidados en este dominio.
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* ===== Bloque: Condiciones Extralaborales ===== */}
              {extraDominios.length > 0 && (
                <div className="space-y-4">
                  <h2 className="scroll-m-20 text-xl font-semibold tracking-tight">
                    Condiciones Extralaborales
                  </h2>

                  {extraDominios.map((domBase) => {
                    const domCode = domBase.dominio_code; // normalmente "extralaboral"
                    const styles =
                      DOMINIO_STYLES[domCode] ?? DOMINIO_STYLES.extralaboral;
                    const domAll = tablaAll?.dominios.find(
                      (d) => d.dominio_code === domCode
                    );

                    return (
                      <div
                        key={domCode}
                        className={`rounded-xl border ${styles.border} ${styles.bg} p-4`}
                      >
                        <div className="mb-3">
                          <h3
                            className={`scroll-m-20 text-lg font-semibold tracking-tight ${styles.text}`}
                          >
                            {domBase.dominio}
                          </h3>
                          <p className="text-xs text-muted-foreground">
                            Dimensiones extralaborales por evaluación (arriba) y
                            consolidado (abajo).
                          </p>
                        </div>

                        <div className="space-y-4">
                          {/* Grid 2×N: tarjetas por evaluación */}
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            {evalIds.map((id) => {
                              const tabla = tablaPorEval[id];
                              const dom = tabla?.dominios.find(
                                (d) => d.dominio_code === domCode
                              );

                              return (
                                <Card
                                  key={`${domCode}-${id}`}
                                  className="border shadow-sm"
                                >
                                  <CardHeader className="pb-2">
                                    <CardTitle className="text-sm">
                                      {nombreEval(id)}
                                    </CardTitle>
                                    {dom ? (
                                      <CardDescription className="text-xs">
                                        Puntaje (T):{" "}
                                        <b>{dom.puntaje_t.toFixed(2)}</b> · n=
                                        <b>{dom.n}</b>
                                      </CardDescription>
                                    ) : (
                                      <CardDescription className="text-xs text-muted-foreground">
                                        Sin datos para este dominio.
                                      </CardDescription>
                                    )}
                                  </CardHeader>
                                  <CardContent>
                                    {dom ? (
                                      <TablaDominioSimple dominio={dom} />
                                    ) : (
                                      <div className="text-sm text-muted-foreground">
                                        No hay registros para {nombreEval(id)}{" "}
                                        en este dominio.
                                      </div>
                                    )}
                                  </CardContent>
                                </Card>
                              );
                            })}
                          </div>

                          {/* Consolidado extralaboral */}
                          <Card className="border shadow-sm">
                            <CardHeader className="pb-2">
                              <CardTitle className="text-sm">
                                Consolidado ({nombresSeleccion})
                              </CardTitle>
                              {domAll ? (
                                <CardDescription className="text-xs">
                                  Puntaje (T):{" "}
                                  <b>{domAll.puntaje_t.toFixed(2)}</b> · n=
                                  <b>{domAll.n}</b>
                                </CardDescription>
                              ) : (
                                <CardDescription className="text-xs text-muted-foreground">
                                  Sin datos consolidados para este dominio.
                                </CardDescription>
                              )}
                            </CardHeader>
                            <CardContent>
                              {domAll ? (
                                <TablaDominioSimple dominio={domAll} />
                              ) : (
                                <div className="text-sm text-muted-foreground">
                                  No hay registros consolidados en este dominio.
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
