import { useEffect, useState } from "react";
import { getTablaDominios, TablaDomResp } from "@/services/reportes";
import { Loader2 } from "lucide-react";

export default function TablaDominios({
  evaluacionIds,
}: {
  evaluacionIds: number[];
}) {
  const [data, setData] = useState<TablaDomResp["dominios"]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      if (evaluacionIds.length === 0) return;
      setLoading(true);
      try {
        const r = await getTablaDominios(evaluacionIds);
        setData(r.dominios || []);
      } finally {
        setLoading(false);
      }
    })();
  }, [evaluacionIds]);

  if (evaluacionIds.length === 0) return null;

  if (loading)
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Cargando tabla…
      </div>
    );

  if (!data.length)
    return <div className="text-sm text-muted-foreground">Sin datos.</div>;

  const NIVS = ["Muy bajo", "Bajo", "Medio", "Alto", "Muy alto"];

  return (
    <div className="space-y-8">
      {data.map((dom) => (
        <div key={dom.dominio} className="border rounded-lg">
          <div className="px-4 py-3 border-b bg-muted/40 font-medium">
            Dominio: {dom.dominio} · Puntaje (T): {dom.puntaje_t} · n=
            {dom.n_personas}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/30">
                  <th className="text-left px-3 py-2 w-[28%]">Dimensión</th>
                  <th className="text-left px-3 py-2">Puntaje (T)</th>
                  {NIVS.map((nv) => (
                    <th key={nv} className="text-center px-3 py-2">
                      {nv}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {/* Fila resumen de dominio */}
                <tr className="bg-muted/10 font-semibold">
                  <td className="px-3 py-2">⟵ {dom.dominio}</td>
                  <td className="px-3 py-2">{dom.puntaje_t}</td>
                  {NIVS.map((nv) => (
                    <td key={nv} className="text-center px-3 py-2">
                      {dom.niveles[nv] ?? 0}
                    </td>
                  ))}
                </tr>
                {/* Detalle por dimensiones */}
                {dom.dimensiones.map((d) => (
                  <tr key={d.dimension} className="border-t">
                    <td className="px-3 py-2">{d.dimension}</td>
                    <td className="px-3 py-2">{d.puntaje_t}</td>
                    {NIVS.map((nv) => (
                      <td key={nv} className="text-center px-3 py-2">
                        {d.niveles[nv] ?? 0}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}
