import type { Pregunta } from "@/types/pregunta";
import { Button } from "@/components/ui/button";

interface Props {
  pregunta: Pregunta;
  valorSeleccionado?: string;
  onSeleccionar: (preguntaId: number, valor: string) => void;
}

function esFrecuenciaTemporal(p: Pregunta): p is Pregunta & {
  metadata: { opciones: string[]; competencia?: string };
} {
  return p.tipo_respuesta === "frecuencia_temporal";
}

export default function PreguntaFrecuenciaTemporal({
  pregunta,
  valorSeleccionado,
  onSeleccionar,
}: Props) {
  if (!esFrecuenciaTemporal(pregunta)) return null;

  const opciones = pregunta.metadata?.opciones ?? [
    "Diariamente",
    "Semanalmente",
    "Mensualmente",
    "Anualmente",
  ];
  const competencia = pregunta.metadata?.competencia;

  return (
    <div>
      <div className="bg-muted p-4 rounded-xl mb-6">
        {competencia && (
          <p className="text-sm text-muted-foreground font-medium">
            Competencia: {competencia}
          </p>
        )}
        <h2 className="text-lg font-semibold mt-1">Pregunta</h2>
        <p>{pregunta.texto}</p>
      </div>

      <div className="flex flex-col sm:flex-row flex-wrap gap-2">
        {opciones.map((opcion, i) => (
          <Button
            key={`${opcion}-${i}`}
            variant={valorSeleccionado === opcion ? "default" : "outline"}
            className="flex-1 min-w-[140px]"
            onClick={() => onSeleccionar(pregunta.id, opcion)}
          >
            {opcion}
          </Button>
        ))}
      </div>
    </div>
  );
}
