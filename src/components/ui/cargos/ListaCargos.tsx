import { useEffect, useState } from "react";
import {
  obtenerCargos,
  eliminarCargo as eliminarCargoService,
} from "../../../services/cargoService";
import { Cargo } from "../../../types/cargo";
import FormularioCargo from "./FormularioCargo";
import { Button } from "@/components/ui/button";
import { Pencil, Trash } from "lucide-react";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
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

export default function ListaCargos() {
  const [cargos, setCargos] = useState<Cargo[]>([]);
  const [cargoAEliminar, setCargoAEliminar] = useState<Cargo | null>(null);
  const [cargoAEditar, setCargoAEditar] = useState<Cargo | null>(null);

  const fetchData = async () => {
    try {
      const data = await obtenerCargos();
      setCargos(
        data.map((cargo) => ({
          ...cargo,
          reporta_a_id: cargo.reporta_a_id ?? null,
        }))
      );
    } catch (error) {
      console.error("Error al obtener cargos:", error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const obtenerNombreJefe = (reportaId: number | null) => {
    if (!reportaId) return "-";
    const jefe = cargos.find((c) => c.id === reportaId);
    return jefe?.nombre ?? "-";
  };

  const handleEditar = (cargo: Cargo) => {
    setCargoAEditar(cargo);
  };

  const confirmarEliminarCargo = async () => {
    if (!cargoAEliminar) return;
    try {
      await eliminarCargoService(cargoAEliminar.id);
      setCargoAEliminar(null);
      await fetchData();
    } catch (error) {
      console.error("Error al eliminar cargo:", error);
    }
  };

  return (
    <Card className="p-4">
      <CardHeader className="flex justify-between items-center">
        <CardTitle>Cargos</CardTitle>
        <FormularioCargo onCargoCreado={fetchData} />
      </CardHeader>

      {cargoAEditar && (
        <FormularioCargo
          onCargoCreado={fetchData}
          cargoAEditar={cargoAEditar}
          onCerrar={() => setCargoAEditar(null)}
        />
      )}

      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Nivel</TableHead>
              <TableHead>Reporta a</TableHead>
              <TableHead className="text-center">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {cargos.map((cargo) => (
              <TableRow key={cargo.id}>
                <TableCell>{cargo.nombre}</TableCell>
                <TableCell>{cargo.nivel ?? "-"}</TableCell>
                <TableCell>
                  {obtenerNombreJefe(cargo.reporta_a_id ?? null)}
                </TableCell>
                <TableCell className="text-center">
                  <div className="flex justify-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEditar(cargo)}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setCargoAEliminar(cargo)}
                        >
                          <Trash className="w-4 h-4 text-red-500" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Esta acción eliminará el cargo{" "}
                            <strong>{cargoAEliminar?.nombre}</strong>.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel
                            onClick={() => setCargoAEliminar(null)}
                          >
                            Cancelar
                          </AlertDialogCancel>
                          <AlertDialogAction
                            className="bg-red-600 hover:bg-red-700"
                            onClick={confirmarEliminarCargo}
                          >
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
