// src/components/preguntas/FormularioPregunta.tsx
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { useEffect, useState } from "react";
import { crearPregunta, actualizarPregunta } from "@/services/preguntaService";
import CamposParametros from "./CamposParametros";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import CompetenciaSelect from "./CompetenciaSelect";
import type { Pregunta, TipoRespuesta } from "@/types/pregunta";

type OrigenEvaluacion = "auto" | "jefe" | "par" | "subordinado";

interface Props {
  evaluacionId: number;
  onPreguntaCreada: () => void;
  preguntaEdicion?: Pregunta | null;
}

type PreguntaPayload = {
  texto: string;
  tipo_respuesta: TipoRespuesta;
  metadata: any;
  evaluacion_id: number;
  es_obligatoria: boolean;
  competencia_id?: number | null;
  origen?: OrigenEvaluacion | null;
};

export default function FormularioPregunta({
  evaluacionId,
  onPreguntaCreada,
  preguntaEdicion,
}: Props) {
  const [open, setOpen] = useState(false);
  const [texto, setTexto] = useState("");
  const [tipo, setTipo] = useState<TipoRespuesta>("likert");
  const [parametros, setParametros] = useState<any>({});
  const [esObligatoria, setEsObligatoria] = useState(true);

  const [competenciaId, setCompetenciaId] = useState<number | null>(null);
  const [origen, setOrigen] = useState<OrigenEvaluacion | "">("");

  useEffect(() => {
    if (preguntaEdicion) {
      setTexto((preguntaEdicion as any).texto ?? "");
      setTipo((preguntaEdicion as any).tipo_respuesta ?? "likert");
      setParametros((preguntaEdicion as any).metadata ?? {});
      setEsObligatoria(Boolean((preguntaEdicion as any).es_obligatoria));
      setCompetenciaId((preguntaEdicion as any).competencia_id ?? null);
      setOrigen(((preguntaEdicion as any).origen as OrigenEvaluacion) ?? "");
      setOpen(true);
    }
  }, [preguntaEdicion]);

  const reset = () => {
    setTexto("");
    setTipo("likert");
    setParametros({});
    setEsObligatoria(true);
    setCompetenciaId(null);
    setOrigen("");
  };

  const handleSubmit = async () => {
    const payload: PreguntaPayload = {
      texto,
      tipo_respuesta: tipo,
      metadata: parametros,
      evaluacion_id: evaluacionId,
      es_obligatoria: esObligatoria,
      competencia_id: competenciaId ?? undefined,
      origen: origen === "" ? null : origen,
    };

    if (preguntaEdicion) {
      // @ts-ignore
      await actualizarPregunta((preguntaEdicion as any).id, payload);
    } else {
      // @ts-ignore
      await crearPregunta(payload);
    }

    setOpen(false);
    reset();
    onPreguntaCreada();
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(estado) => {
        setOpen(estado);
        if (!estado) onPreguntaCreada();
      }}
    >
      {!preguntaEdicion && (
        <DialogTrigger asChild>
          <Button>Agregar Pregunta</Button>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-[640px]">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">
            {preguntaEdicion ? "Editar Pregunta" : "Nueva Pregunta"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="texto">Texto de la pregunta</Label>
            <Input
              id="texto"
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              placeholder="Escribe la pregunta aquí..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tipo">Tipo de respuesta</Label>
              <Select
                value={tipo}
                onValueChange={(v) => setTipo(v as TipoRespuesta)}
              >
                <SelectTrigger id="tipo">
                  <SelectValue placeholder="Selecciona un tipo de respuesta" />
                </SelectTrigger>
                <SelectContent>
                  {[
                    { value: "likert", label: "Escala Likert" },
                    { value: "dicotomica", label: "Sí / No" },
                    { value: "semaforo", label: "Semáforo" },
                    {
                      value: "seleccion_multiple",
                      label: "Selección múltiple",
                    },
                    { value: "abierta", label: "Pregunta abierta" },
                    { value: "escala_visual", label: "Escala visual" },
                    {
                      value: "frecuencia_temporal",
                      label: "Frecuencia temporal",
                    },
                    { value: "situacional", label: "Situacional" },
                    { value: "ranking", label: "Ranking" },
                  ].map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="origen">Origen de la evaluación (opcional)</Label>
              <Select
                value={origen ?? ""}
                onValueChange={(v) => setOrigen(v as OrigenEvaluacion)}
              >
                <SelectTrigger id="origen">
                  <SelectValue placeholder="Selecciona origen (si aplica)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">Autoevaluación</SelectItem>
                  <SelectItem value="jefe">Jefe</SelectItem>
                  <SelectItem value="par">Par</SelectItem>
                  <SelectItem value="subordinado">Subordinado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Parámetros dinámicos por tipo */}
          <CamposParametros
            tipo={tipo}
            onChange={setParametros}
            parametrosIniciales={(preguntaEdicion as any)?.metadata}
          />

          {/* Competencia (lista desplegable buscable) */}
          <div className="space-y-2">
            <Label>Competencia (opcional)</Label>
            <CompetenciaSelect
              evaluacionId={evaluacionId}
              value={competenciaId}
              onChange={setCompetenciaId}
            />
            <p className="text-xs text-muted-foreground">
              Solo se muestran competencias asociadas a la evaluación.
            </p>
          </div>

          <div className="flex items-center space-x-2 pt-2">
            <Checkbox
              id="obligatoria"
              checked={esObligatoria}
              onCheckedChange={(checked) => setEsObligatoria(Boolean(checked))}
            />
            <Label htmlFor="obligatoria">¿Es obligatoria?</Label>
          </div>
        </div>

        <DialogFooter className="pt-4">
          <Button onClick={handleSubmit}>
            {preguntaEdicion ? "Guardar Cambios" : "Crear Pregunta"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
