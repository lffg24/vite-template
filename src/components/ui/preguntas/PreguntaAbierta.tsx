// src/components/ui/preguntas/PreguntaAbierta.tsx
import type { Pregunta } from "@/types/pregunta";
import { Textarea } from "@/components/ui/textarea";

interface Props {
  pregunta: Pregunta;
  valorActual?: string;
  onCambiar: (preguntaId: number, valor: string) => void;
}

function esAbierta(p: Pregunta): p is Pregunta & {
  metadata?: { placeholder?: string; competencia?: string };
} {
  return p.tipo_respuesta === "abierta";
}

export default function PreguntaAbierta({
  pregunta,
  valorActual,
  onCambiar,
}: Props) {
  if (!esAbierta(pregunta)) return null;

  const competencia = pregunta.metadata?.competencia;
  const placeholder =
    pregunta.metadata?.placeholder ?? "Escribe tu respuesta aquí...";

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

      <Textarea
        placeholder={placeholder}
        value={valorActual ?? ""}
        onChange={(e) => onCambiar(pregunta.id, e.target.value)}
        className="min-h-[120px] rounded-xl"
      />
    </div>
  );
}
