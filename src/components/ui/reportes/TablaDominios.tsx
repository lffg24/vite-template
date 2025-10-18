import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { getTablaDominios } from "@/services/reportes";
import type { DominioTabla, DimDeDominio } from "@/services/reportes";

/** Props: recibe los ids de evaluación seleccionados */
interface TablaDominiosProps {
  evaluacionIds: number[];
}

/** Utilidad para ordenar niveles si el backend trae keys desordenadas */
const ORDEN_NIVELES = ["Sin riesgo", "Bajo", "Medio", "Alto", "Muy alto"];

export default function TablaDominios({ evaluacionIds }: TablaDominiosProps) {
  const [dominios, setDominios] = useState<DominioTabla[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function fetchData() {
      if (!evaluacionIds.length) {
        setDominios([]);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const data = await getTablaDominios(evaluacionIds);
        if (!mounted) return;
        setDominios(data.dominios || []);
      } catch (e: any) {
        console.error(e);
        if (!mounted) return;
        setError("No se pudo obtener la información de dominios.");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    fetchData();
    return () => {
      mounted = false;
    };
  }, [evaluacionIds]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-10 text-muted-foreground">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Cargando dominios...
      </div>
    );
  }

  if (error) {
    return <p className="text-red-600 text-sm">{error}</p>;
  }

  if (!dominios.length) {
    return (
      <p className="text-sm text-muted-foreground">
        {evaluacionIds.length
          ? "Sin datos disponibles para las evaluaciones seleccionadas."
          : "Seleccione evaluación(es) para consultar."}
      </p>
    );
  }

  return (
    <div className="space-y-8">
      {dominios.map((dom) => (
        <section
          key={dom.dominio}
          className="border rounded-xl overflow-hidden"
        >
          <header className="bg-muted/40 px-4 py-3">
            <h4 className="font-semibold">
              Dominio: {dom.dominio}
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                · Puntaje (T): {red(dom.puntaje_t)} · n={dom.n_personas}
              </span>
            </h4>
          </header>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/20">
                  <th className="text-left px-4 py-2">Dimensión</th>
                  <th className="text-center px-2 py-2">Puntaje (T)</th>
                  <th className="text-center px-2 py-2">n</th>
                  {ORDEN_NIVELES.map((niv) => (
                    <th key={niv} className="text-center px-2 py-2">
                      {niv}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {dom.dimensiones.map((dim: DimDeDominio, i: number) => (
                  <tr
                    key={dim.dimension + i}
                    className="border-b last:border-0 hover:bg-muted/10"
                  >
                    <td className="px-4 py-2">{dim.dimension}</td>
                    <td className="text-center px-2 py-2">
                      {red(dim.puntaje_t)}
                    </td>
                    <td className="text-center px-2 py-2">{dim.n}</td>
                    {ORDEN_NIVELES.map((niv) => (
                      <td key={niv} className="text-center px-2 py-2">
                        {dim.niveles?.[niv] ?? 0}
                      </td>
                    ))}
                  </tr>
                ))}

                {/* Totales del dominio */}
                <tr className="bg-muted/10 font-medium">
                  <td className="px-4 py-2">Total dominio</td>
                  <td className="text-center px-2 py-2">
                    {red(dom.puntaje_t)}
                  </td>
                  <td className="text-center px-2 py-2">{dom.n_personas}</td>
                  {ORDEN_NIVELES.map((niv) => (
                    <td key={niv} className="text-center px-2 py-2">
                      {dom.niveles?.[niv] ?? 0}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      ))}
    </div>
  );
}

/** Redondeo helper */
function red(n: number | null | undefined, d = 2) {
  if (n === null || n === undefined) return "-";
  return Number(n).toFixed(d);
}
