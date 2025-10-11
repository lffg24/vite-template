import type { Pregunta } from "@/types/pregunta";

interface Props {
  pregunta: Pregunta;
  valorSeleccionado?: string;
  onSeleccionar: (preguntaId: number, valor: string) => void;
}

function esDicotomica(p: Pregunta): p is Pregunta & {
  metadata: { opciones: string[]; competencia?: string };
} {
  return p.tipo_respuesta === "dicotomica";
}

export default function PreguntaDicotomica({
  pregunta,
  valorSeleccionado,
  onSeleccionar,
}: Props) {
  if (!esDicotomica(pregunta)) return null;

  const opciones = pregunta.metadata?.opciones ?? ["Sí", "No"];
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

      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        {opciones.map((opcion, index) => {
          const activo = valorSeleccionado === opcion;
          const base =
            "flex-1 min-w-[140px] text-sm px-6 py-3 rounded-lg transition-all duration-150 font-medium";
          const seleccionado =
            "ring-2 ring-offset-1 shadow-md font-semibold scale-[1.03] ring-primary";
          const color = index === 0 ? "bg-muted" : "bg-destructive text-white";
          return (
            <button
              key={opcion}
              onClick={() => onSeleccionar(pregunta.id, opcion)}
              className={`${base} ${color} ${
                activo ? seleccionado : "opacity-80 hover:opacity-100"
              }`}
            >
              {opcion}
            </button>
          );
        })}
      </div>
    </div>
  );
}
