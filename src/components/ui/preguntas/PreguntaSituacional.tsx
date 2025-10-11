import type { Pregunta } from "@/types/pregunta";
import { Button } from "@/components/ui/button";

interface Props {
  pregunta: Pregunta;
  valorSeleccionado?: string;
  onSeleccionar: (preguntaId: number, valor: string) => void;
}

function esSituacional(p: Pregunta): p is Pregunta & {
  metadata: {
    escenario?: string;
    alternativas: string[];
    competencia?: string;
  };
} {
  const t = (p.tipo_respuesta ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[\s/]+/g, "_");
  return t === "situacional" || t === "situacional_comportamental";
}

export default function PreguntaSituacional({
  pregunta,
  valorSeleccionado,
  onSeleccionar,
}: Props) {
  if (!esSituacional(pregunta)) return null;

  const escenario = pregunta.metadata?.escenario ?? pregunta.texto;
  const alternativas = pregunta.metadata?.alternativas ?? [];
  const competencia = pregunta.metadata?.competencia;

  return (
    <div>
      <div className="bg-muted p-4 rounded-xl mb-6 space-y-2">
        {competencia && (
          <p className="text-sm text-muted-foreground font-medium">
            Competencia: {competencia}
          </p>
        )}
        <h2 className="text-lg font-semibold">Escenario</h2>
        <blockquote className="text-sm italic text-muted-foreground border-l-4 pl-4 border-muted-foreground">
          {escenario}
        </blockquote>
      </div>

      <div className="flex flex-col sm:flex-row flex-wrap gap-2">
        {alternativas.map((opcion, i) => (
          <Button
            key={`${opcion}-${i}`}
            variant={valorSeleccionado === opcion ? "default" : "outline"}
            className="flex-1 min-w-[200px]"
            onClick={() => onSeleccionar(pregunta.id, opcion)}
          >
            {opcion}
          </Button>
        ))}
      </div>
    </div>
  );
}
