import { useEffect, useState } from "react";
import type { Pregunta } from "@/types/pregunta";
import { obtenerPreguntas, eliminarPregunta } from "@/services/preguntaService";
import FormularioPregunta from "./FormularioPregunta";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

const etiquetasTipo: Record<string, string> = {
  likert: "Escala Likert",
  dicotomica: "Sí / No",
  semaforo: "Semáforo",
  seleccion_multiple: "Selección múltiple",
  abierta: "Abierta",
  escala_visual: "Escala visual",
  frecuencia_temporal: "Frecuencia temporal",
  situacional: "Situacional",
  ranking: "Ranking",
};

const estilosTipo: Record<string, string> = {
  likert: "bg-indigo-100 text-indigo-700",
  dicotomica: "bg-green-100 text-green-700",
  semaforo: "bg-red-100 text-red-700",
  seleccion_multiple: "bg-yellow-100 text-yellow-800",
  abierta: "bg-gray-100 text-gray-800",
  escala_visual: "bg-blue-100 text-blue-800",
  frecuencia_temporal: "bg-orange-100 text-orange-800",
  situacional: "bg-purple-100 text-purple-700",
  ranking: "bg-teal-100 text-teal-700",
};

export default function ListaPreguntas({
  evaluacionId,
}: {
  evaluacionId: number;
}) {
  const [preguntas, setPreguntas] = useState<Pregunta[]>([]);
  const [preguntaEdicion, setPreguntaEdicion] = useState<Pregunta | null>(null);
  const [preguntaAEliminar, setPreguntaAEliminar] = useState<Pregunta | null>(
    null
  );

  const fetchData = async () => {
    try {
      const data = await obtenerPreguntas(evaluacionId);
      setPreguntas(data);
    } catch (error) {
      console.error("Error al listar preguntas:", error);
    }
  };

  const handleEliminar = async () => {
    if (preguntaAEliminar) {
      await eliminarPregunta(preguntaAEliminar.id);
      setPreguntaAEliminar(null);
      fetchData();
    }
  };

  useEffect(() => {
    fetchData();
  }, [evaluacionId]);

  return (
    <Card className="p-4">
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <CardTitle className="text-xl">Preguntas</CardTitle>
        <FormularioPregunta
          evaluacionId={evaluacionId}
          onPreguntaCreada={() => {
            fetchData();
            setPreguntaEdicion(null);
          }}
          preguntaEdicion={preguntaEdicion}
        />
      </CardHeader>

      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Pregunta</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Obligatoria</TableHead>
              <TableHead className="text-center">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {preguntas.map((pregunta) => (
              <TableRow key={pregunta.id} className="hover:bg-muted/40">
                <TableCell>{pregunta.texto}</TableCell>
                <TableCell>
                  <span
                    className={`inline-block px-2 py-1 text-xs font-medium rounded ${
                      estilosTipo[pregunta.tipo_respuesta] ??
                      "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {etiquetasTipo[pregunta.tipo_respuesta] ??
                      pregunta.tipo_respuesta}
                  </span>
                </TableCell>
                <TableCell>{pregunta.es_obligatoria ? "Sí" : "No"}</TableCell>
                <TableCell className="text-center">
                  <div className="flex justify-center gap-2">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => setPreguntaEdicion(pregunta)}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => setPreguntaAEliminar(pregunta)}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>
                            ¿Eliminar esta pregunta?
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            Esta acción no se puede deshacer. Se eliminará la
                            pregunta:{" "}
                            <strong>{preguntaAEliminar?.texto}</strong>
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel
                            onClick={() => setPreguntaAEliminar(null)}
                          >
                            Cancelar
                          </AlertDialogCancel>
                          <AlertDialogAction onClick={handleEliminar}>
                            Eliminar
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
