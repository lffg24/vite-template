import type { Pregunta } from "@/types/pregunta";
import { Circle } from "lucide-react";

interface Props {
  pregunta: Pregunta;
  valorSeleccionado?: string;
  onSeleccionar: (preguntaId: number, valor: string) => void;
}

function esSemaforo(p: Pregunta): p is Pregunta & {
  metadata: { colores?: string[]; competencia?: string };
} {
  return p.tipo_respuesta === "semaforo";
}

export default function PreguntaSemaforo({
  pregunta,
  valorSeleccionado,
  onSeleccionar,
}: Props) {
  if (!esSemaforo(pregunta)) return null;

  const colores = pregunta.metadata?.colores ?? ["Verde", "Amarillo", "Rojo"];
  const competencia = pregunta.metadata?.competencia;

  const colorClase = (c: string) => {
    switch (c.toLowerCase()) {
      case "verde":
        return "text-green-600";
      case "amarillo":
        return "text-yellow-500";
      case "rojo":
        return "text-red-600";
      default:
        return "text-gray-500";
    }
  };

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

      <div className="flex flex-wrap gap-4 justify-start">
        {colores.map((color) => {
          const activo = valorSeleccionado === color;
          return (
            <button
              key={color}
              onClick={() => onSeleccionar(pregunta.id, color)}
              className={`flex items-center px-5 py-3 rounded-xl border transition font-semibold ${
                activo
                  ? "bg-primary text-white border-primary"
                  : "bg-muted hover:bg-accent"
              }`}
            >
              <Circle className={`mr-2 h-5 w-5 ${colorClase(color)}`} />
              {color}
            </button>
          );
        })}
      </div>
    </div>
  );
}
