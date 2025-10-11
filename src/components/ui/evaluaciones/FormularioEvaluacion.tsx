// src/components/ui/evaluaciones/FormularioEvaluacion.tsx
import { useEffect, useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import {
  crearEvaluacion,
  actualizarEvaluacion,
  obtenerTiposEvaluacion,
} from "@/services/evaluacionService";
import type { TipoEvaluacion, Evaluacion } from "@/types/evaluacion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type NuevaEvaluacionPayload = {
  nombre: string;
  descripcion?: string;
  tipo_id: number;
  estado?: "Borrador" | "Activa" | "Finalizada";
};

export default function FormularioEvaluacion({
  onEvaluacionCreada,
  evaluacionEdicion = null,
}: {
  onEvaluacionCreada: () => void;
  evaluacionEdicion?: Evaluacion | null;
}) {
  const [open, setOpen] = useState(false);
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [tipoId, setTipoId] = useState<string>("");
  const [tipos, setTipos] = useState<TipoEvaluacion[]>([]);

  useEffect(() => {
    obtenerTiposEvaluacion()
      .then(setTipos)
      .catch(() => setTipos([]));
  }, []);

  useEffect(() => {
    if (evaluacionEdicion) {
      setNombre(evaluacionEdicion.nombre);
      setDescripcion(evaluacionEdicion.descripcion || "");
      setTipoId(String(evaluacionEdicion.tipo_id));
      setOpen(true);
    }
  }, [evaluacionEdicion]);

  const handleSubmit = async () => {
    if (!nombre || !tipoId) return;

    const datos: NuevaEvaluacionPayload = {
      nombre,
      descripcion: descripcion || undefined,
      tipo_id: parseInt(tipoId, 10),
      estado: "Borrador", // si el backend lo asume por defecto puedes quitarlo
    };

    try {
      if (evaluacionEdicion) {
        await actualizarEvaluacion(evaluacionEdicion.id, datos);
      } else {
        await crearEvaluacion(datos as any); // el service acepta EvaluacionCreate; este payload cumple la forma
      }
      onEvaluacionCreada();
      setOpen(false);
      setNombre("");
      setDescripcion("");
      setTipoId("");
    } catch {
      // no exponemos errores internos
      console.error("Error al guardar evaluación");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>{evaluacionEdicion ? "Editar" : "Crear Evaluación"}</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {evaluacionEdicion ? "Editar Evaluación" : "Nueva Evaluación"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Input
            placeholder="Nombre de la evaluación"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
          />

          <Textarea
            placeholder="Descripción (opcional)"
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
          />

          <Select value={tipoId} onValueChange={setTipoId}>
            <SelectTrigger>
              <SelectValue placeholder="Selecciona un tipo" />
            </SelectTrigger>
            <SelectContent>
              {tipos.map((tipo) => (
                <SelectItem key={tipo.id} value={String(tipo.id)}>
                  {tipo.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <DialogFooter>
          <Button onClick={handleSubmit}>Guardar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
