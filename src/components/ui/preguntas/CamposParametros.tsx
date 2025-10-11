import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import type { TipoRespuesta } from "@/types/pregunta";

interface Props {
  tipo: TipoRespuesta;
  onChange: (parametros: any) => void;
  parametrosIniciales?: any;
}

const PREDETERMINADOS: Record<TipoRespuesta, any> = {
  likert: {
    opciones: [
      "Siempre",
      "Casi siempre",
      "Algunas veces",
      "Casi nunca",
      "Nunca",
    ],
  },
  dicotomica: { opciones: ["Sí", "No"] },
  semaforo: { opciones: ["Verde", "Amarillo", "Rojo"] },
  seleccion_multiple: { opciones: ["Opción A", "Opción B", "Opción C"] },
  ranking: { opciones: ["Ítem 1", "Ítem 2", "Ítem 3"] },
  escala_visual: { min: 0, max: 10 },
  frecuencia_temporal: {
    opciones: ["Diariamente", "Semanalmente", "Mensualmente", "Anualmente"],
  },
  situacional: {},
  abierta: {},
};

export default function CamposParametros({
  tipo,
  onChange,
  parametrosIniciales,
}: Props) {
  const [opciones, setOpciones] = useState<string[]>([]);
  const [min, setMin] = useState<number>(0);
  const [max, setMax] = useState<number>(10);

  useEffect(() => {
    if (parametrosIniciales) {
      if (parametrosIniciales.opciones) {
        setOpciones(parametrosIniciales.opciones);
        onChange({ opciones: parametrosIniciales.opciones });
      } else if (tipo === "escala_visual") {
        setMin(parametrosIniciales.min ?? 0);
        setMax(parametrosIniciales.max ?? 10);
        onChange({
          min: parametrosIniciales.min ?? 0,
          max: parametrosIniciales.max ?? 10,
        });
      } else {
        setOpciones([]);
        onChange(parametrosIniciales);
      }
      return;
    }

    const pred = PREDETERMINADOS[tipo];
    if (pred?.opciones) {
      setOpciones(pred.opciones);
      onChange({ opciones: pred.opciones });
    } else if (tipo === "escala_visual") {
      setMin(pred.min ?? 0);
      setMax(pred.max ?? 10);
      onChange({ min: pred.min ?? 0, max: pred.max ?? 10 });
    } else {
      setOpciones([]);
      onChange({});
    }
  }, [tipo]);

  useEffect(() => {
    if (
      tipo === "likert" ||
      tipo === "seleccion_multiple" ||
      tipo === "ranking" ||
      tipo === "dicotomica" ||
      tipo === "semaforo" ||
      tipo === "frecuencia_temporal"
    ) {
      onChange({ opciones });
    }
  }, [opciones]);

  useEffect(() => {
    if (tipo === "escala_visual") onChange({ min, max });
  }, [min, max]);

  if (
    tipo === "likert" ||
    tipo === "seleccion_multiple" ||
    tipo === "ranking" ||
    tipo === "dicotomica" ||
    tipo === "semaforo" ||
    tipo === "frecuencia_temporal"
  ) {
    return (
      <div className="space-y-2">
        <Label className="font-semibold">Opciones</Label>
        <div className="rounded-md border bg-muted/50 px-4 py-3 space-y-2">
          {opciones.map((op, idx) => (
            <Input
              key={idx}
              value={op}
              onChange={(e) => {
                const nuevas = [...opciones];
                nuevas[idx] = e.target.value;
                setOpciones(nuevas);
              }}
              placeholder={`Opción ${idx + 1}`}
            />
          ))}
          <Button
            type="button"
            variant="link"
            className="px-0"
            onClick={() => setOpciones([...opciones, ""])}
          >
            + Agregar opción
          </Button>
        </div>
      </div>
    );
  }

  if (tipo === "escala_visual") {
    return (
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label htmlFor="min">Mínimo</Label>
          <Input
            id="min"
            type="number"
            value={min}
            onChange={(e) => setMin(+e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="max">Máximo</Label>
          <Input
            id="max"
            type="number"
            value={max}
            onChange={(e) => setMax(+e.target.value)}
          />
        </div>
      </div>
    );
  }

  return null;
}
