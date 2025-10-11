import type { Pregunta } from "@/types/pregunta";

interface Props {
  pregunta: Pregunta;
  valorSeleccionado?: string;
  onSeleccionar: (preguntaId: number, valor: string) => void;
}

function esLikert(p: Pregunta): p is Pregunta & {
  metadata: { opciones?: string[]; etiquetas?: string[]; competencia?: string };
} {
  return p.tipo_respuesta === "likert";
}

export default function PreguntaLikert({
  pregunta,
  valorSeleccionado,
  onSeleccionar,
}: Props) {
  if (!esLikert(pregunta)) return null;

  const opciones = pregunta.metadata?.opciones ??
    pregunta.metadata?.etiquetas ?? [
      "Nunca",
      "Casi nunca",
      "A veces",
      "Casi siempre",
      "Siempre",
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

      <div className="space-y-3">
        {opciones.map((opcion) => (
          <div
            key={opcion}
            className={`cursor-pointer px-4 py-3 rounded-xl border transition ${
              valorSeleccionado === opcion
                ? "bg-primary text-white border-primary"
                : "bg-muted hover:bg-accent"
            }`}
            onClick={() => onSeleccionar(pregunta.id, opcion)}
          >
            {opcion}
          </div>
        ))}
      </div>
    </div>
  );
}
