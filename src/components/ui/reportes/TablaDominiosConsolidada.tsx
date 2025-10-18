// src/components/ui/reportes/TablaDominiosConsolidada.tsx
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { BloqueEvaluacion, NivelClave } from "@/types/psico";

const NIVEL_HEADERS: { key: NivelClave; label: string }[] = [
  { key: "sin_riesgo", label: "Sin riesgo" },
  { key: "bajo", label: "Bajo" },
  { key: "medio", label: "Medio" },
  { key: "alto", label: "Alto" },
  { key: "muy_alto", label: "Muy alto" },
];

interface Props {
  data: BloqueEvaluacion;
  title?: string;
}

export default function TablaDominiosConsolidada({ data, title }: Props) {
  return (
    <div className="border rounded-2xl p-5 bg-white shadow-sm">
      <h3 className="text-base font-semibold text-gray-800 mb-2">
        {title ?? "Consolidado general de Factores Intralaborales"}
      </h3>

      {data.dominios.map((dom) => (
        <div key={dom.codigo} className="mb-6">
          <div className="font-semibold text-gray-800 mb-2">
            {dom.nombre} · Puntaje (T): {dom.promedioT}
          </div>

          <Table className="text-xs">
            <TableHeader>
              <TableRow>
                <TableHead>Dimensión</TableHead>
                <TableHead className="text-center">Puntaje (T)</TableHead>
                {NIVEL_HEADERS.map((h) => (
                  <TableHead key={h.key} className="text-center">
                    {h.label}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>

            <TableBody>
              {dom.dimensiones.map((dim) => (
                <TableRow key={dim.codigo}>
                  <TableCell className="whitespace-pre-wrap">
                    {dim.nombre}
                  </TableCell>
                  <TableCell className="text-center">{dim.puntajeT}</TableCell>
                  {NIVEL_HEADERS.map((h) => (
                    <TableCell key={h.key} className="text-center">
                      {dim.conteos[h.key]}
                    </TableCell>
                  ))}
                </TableRow>
              ))}

              <TableRow className="font-semibold bg-gray-50">
                <TableCell>Total {dom.nombre}</TableCell>
                <TableCell className="text-center">{dom.promedioT}</TableCell>
                {NIVEL_HEADERS.map((h) => (
                  <TableCell key={h.key} className="text-center">
                    {dom.totales[h.key]}
                  </TableCell>
                ))}
              </TableRow>
            </TableBody>
          </Table>
        </div>
      ))}
    </div>
  );
}
