// src/components/ui/reportes/EvaluacionCard.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  bloque: BloqueEvaluacion;
}

export default function EvaluacionCard({ bloque }: Props) {
  return (
    <Card className="shadow-md border border-gray-200">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">
          {bloque?.nombre_evaluacion ?? `Evaluación #${bloque.evaluacion_id}`}
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Resultados generales de factores intralaborales
        </p>
      </CardHeader>

      <CardContent className="space-y-5">
        {bloque.dominios.map((dom) => (
          <div key={dom.codigo} className="border rounded-xl p-3 bg-gray-50">
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
                    <TableCell className="text-center">
                      {dim.puntajeT}
                    </TableCell>
                    {NIVEL_HEADERS.map((h) => (
                      <TableCell key={h.key} className="text-center">
                        {dim.conteos[h.key]}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}

                <TableRow className="font-semibold bg-white">
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
      </CardContent>
    </Card>
  );
}
