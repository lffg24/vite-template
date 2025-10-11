import type { Pregunta } from "@/types/pregunta";
import { Checkbox } from "@/components/ui/checkbox";
import {
  BookOpen,
  Briefcase,
  Star,
  User,
  Target,
  Shield,
  Heart,
  Lightbulb,
  Globe,
  Layers,
} from "lucide-react";

const iconos = [
  BookOpen,
  Briefcase,
  Star,
  User,
  Target,
  Shield,
  Heart,
  Lightbulb,
  Globe,
  Layers,
];

interface Props {
  pregunta: Pregunta;
  valoresSeleccionados?: string[];
  onCambiar: (preguntaId: number, valores: string[]) => void;
}

function esSeleccionMultiple(p: Pregunta): p is Pregunta & {
  metadata: { opciones: string[]; competencia?: string };
} {
  const t = (p.tipo_respuesta ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[\s/-]+/g, "_");
  return t === "seleccion_multiple" || t === "multiple";
}

export default function PreguntaSeleccionMultiple({
  pregunta,
  valoresSeleccionados = [],
  onCambiar,
}: Props) {
  if (!esSeleccionMultiple(pregunta)) return null;

  const opciones = pregunta.metadata?.opciones ?? [];
  const competencia = pregunta.metadata?.competencia;

  const toggle = (opcion: string) => {
    if (valoresSeleccionados.includes(opcion)) {
      onCambiar(
        pregunta.id,
        valoresSeleccionados.filter((v) => v !== opcion)
      );
    } else {
      onCambiar(pregunta.id, [...valoresSeleccionados, opcion]);
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

      <div className="space-y-4">
        {opciones.map((opcion, index) => {
          const Icono = iconos[index % iconos.length];
          const activo = valoresSeleccionados.includes(opcion);
          return (
            <div
              key={opcion}
              className="flex items-center gap-3 p-3 rounded-xl bg-muted hover:bg-accent transition cursor-pointer"
              onClick={() => toggle(opcion)}
            >
              <Checkbox
                checked={activo}
                className="border-primary data-[state=checked]:bg-primary"
              />
              <Icono className="h-5 w-5 text-primary" />
              <span className="font-medium">{opcion}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
