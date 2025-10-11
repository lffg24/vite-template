// src/components/ui/evaluaciones/ListaEvaluaciones.tsx
import { useEffect, useState } from "react";
import { List, Pencil, Trash, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";

import {
  obtenerEvaluaciones,
  eliminarEvaluacion,
} from "@/services/evaluacionService";
import type { Evaluacion } from "@/types/evaluacion";

import FormularioEvaluacion from "./FormularioEvaluacion";
import DrawerAsignarUsuarios from "./DrawerAsignarUsuarios";
import { Button } from "@/components/ui/button";
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

export default function ListaEvaluaciones() {
  const [evaluaciones, setEvaluaciones] = useState<Evaluacion[]>([]);
  const [evaluacionEdicion, setEvaluacionEdicion] = useState<Evaluacion | null>(
    null
  );
  const [evaluacionAEliminar, setEvaluacionAEliminar] =
    useState<Evaluacion | null>(null);
  const [drawerAbierto, setDrawerAbierto] = useState(false);
  const [evaluacionSeleccionada, setEvaluacionSeleccionada] = useState<
    number | null
  >(null);

  const navigate = useNavigate();

  const fetchData = async () => {
    try {
      const data = await obtenerEvaluaciones();
      setEvaluaciones(data);
    } catch {
      console.error("Error al obtener evaluaciones");
    }
  };

  const confirmarEliminarEvaluacion = async () => {
    if (evaluacionAEliminar) {
      await eliminarEvaluacion(evaluacionAEliminar.id);
      setEvaluacionAEliminar(null);
      fetchData();
    }
  };

  const handleEditar = (evaluacion: Evaluacion) =>
    setEvaluacionEdicion(evaluacion);
  const handleAbrirDrawer = (evaluacionId: number) => {
    setEvaluacionSeleccionada(evaluacionId);
    setDrawerAbierto(true);
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <>
      <Card className="p-4">
        <CardHeader className="flex flex-row justify-between items-center">
          <CardTitle>Evaluaciones</CardTitle>
          <FormularioEvaluacion
            onEvaluacionCreada={fetchData}
            evaluacionEdicion={evaluacionEdicion}
          />
        </CardHeader>

        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-center">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {evaluaciones.map((evaluacion) => (
                <TableRow key={evaluacion.id}>
                  <TableCell>{evaluacion.nombre}</TableCell>
                  <TableCell>{evaluacion.estado}</TableCell>
                  <TableCell className="text-center">
                    <div className="flex justify-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEditar(evaluacion)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setEvaluacionAEliminar(evaluacion)}
                          >
                            <Trash className="w-4 h-4 text-red-500" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Esta acción eliminará la evaluación{" "}
                              <strong>{evaluacionAEliminar?.nombre}</strong>.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel
                              onClick={() => setEvaluacionAEliminar(null)}
                            >
                              Cancelar
                            </AlertDialogCancel>
                            <AlertDialogAction
                              className="bg-red-600 hover:bg-red-700"
                              onClick={confirmarEliminarEvaluacion}
                            >
                              Eliminar
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          navigate(`/evaluaciones/${evaluacion.id}/preguntas`)
                        }
                      >
                        <List className="w-4 h-4 text-blue-500" />
                      </Button>

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleAbrirDrawer(evaluacion.id)}
                      >
                        <Users className="w-4 h-4 text-green-600" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {evaluacionSeleccionada !== null && (
        <DrawerAsignarUsuarios
          evaluacionId={evaluacionSeleccionada}
          abierto={drawerAbierto}
          cerrarDrawer={() => setDrawerAbierto(false)}
        />
      )}
    </>
  );
}
