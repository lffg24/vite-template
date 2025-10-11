import type { Pregunta } from "@/types/pregunta";
import { Slider } from "@/components/ui/slider";
import { useEffect, useState } from "react";

interface Props {
  pregunta: Pregunta;
  valorSeleccionado?: string;
  onSeleccionar: (preguntaId: number, valor: string) => void;
}

function esEscalaVisual(p: Pregunta): p is Pregunta & {
  metadata: {
    min?: number;
    max?: number;
    paso?: number;
    etiquetas?: string[];
    competencia?: string;
  };
} {
  return p.tipo_respuesta === "escala_visual";
}

export default function PreguntaSlider({
  pregunta,
  valorSeleccionado,
  onSeleccionar,
}: Props) {
  if (!esEscalaVisual(pregunta)) return null;

  const min = pregunta.metadata?.min ?? 0;
  const max = pregunta.metadata?.max ?? 10;
  const paso = pregunta.metadata?.paso ?? 1;
  const competencia = pregunta.metadata?.competencia;

  const ticks = Array.from({ length: max - min + 1 }, (_, i) => min + i);
  const valorInicial = valorSeleccionado
    ? parseInt(valorSeleccionado, 10)
    : Math.floor((min + max) / 2);
  const [valor, setValor] = useState<number>(valorInicial);

  useEffect(() => {
    setValor(valorInicial);
  }, [valorInicial]);

  const handleChange = (nuevo: number[]) => {
    const v = nuevo[0];
    setValor(v);
    onSeleccionar(pregunta.id, String(v));
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

      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>{min}</span>
          <span className="font-bold text-primary">{valor}</span>
          <span>{max}</span>
        </div>

        <Slider
          min={min}
          max={max}
          step={paso}
          value={[valor]}
          onValueChange={handleChange}
          className="w-full"
        />

        <div className="mt-3 flex justify-between text-xs text-muted-foreground">
          {ticks.map((t) => (
            <span key={t} className="text-center w-4">
              {t}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
