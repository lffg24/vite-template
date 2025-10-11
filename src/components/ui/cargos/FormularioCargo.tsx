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
import {
  crearCargo,
  obtenerCargos,
  actualizarCargo,
} from "@/services/cargoService";

interface Cargo {
  id: number;
  nombre: string;
  nivel?: string;
  reporta_a_id: number | null;
}

interface Props {
  onCargoCreado: () => void;
  cargoAEditar?: Cargo;
  onCerrar?: () => void;
}

export default function FormularioCargo({
  onCargoCreado,
  cargoAEditar,
  onCerrar,
}: Props) {
  const [open, setOpen] = useState(false);
  const [nombre, setNombre] = useState("");
  const [nivel, setNivel] = useState("");
  const [reportaA, setReportaA] = useState<number | null>(null);
  const [cargos, setCargos] = useState<Cargo[]>([]);

  useEffect(() => {
    const cargarCargos = async () => {
      try {
        const cargosData = await obtenerCargos();
        setCargos(cargosData);
      } catch (error) {
        console.error("Error al cargar cargos:", error);
      }
    };

    if (open || cargoAEditar) cargarCargos();
  }, [open, cargoAEditar]);

  useEffect(() => {
    if (cargoAEditar) {
      setNombre(cargoAEditar.nombre);
      setNivel(cargoAEditar.nivel ?? "");
      setReportaA(cargoAEditar.reporta_a_id);
      setOpen(true);
    }
  }, [cargoAEditar]);

  const handleSubmit = async () => {
    try {
      const data = { nombre, nivel, reporta_a_id: reportaA };
      if (cargoAEditar) {
        await actualizarCargo(cargoAEditar.id, data);
      } else {
        await crearCargo(data);
      }

      onCargoCreado();
      setOpen(false);
      setNombre("");
      setNivel("");
      setReportaA(null);
      if (onCerrar) onCerrar();
    } catch (error) {
      console.error("Error al guardar cargo:", error);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(estado) => {
        setOpen(estado);
        if (!estado && onCerrar) onCerrar();
      }}
    >
      {!cargoAEditar && (
        <DialogTrigger asChild>
          <Button>Crear Cargo</Button>
        </DialogTrigger>
      )}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {cargoAEditar ? "Editar Cargo" : "Nuevo Cargo"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Input
            placeholder="Nombre del cargo"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
          />
          <Input
            placeholder="Nivel (opcional)"
            value={nivel}
            onChange={(e) => setNivel(e.target.value)}
          />
          <div>
            <label className="block text-sm font-medium mb-1">Reporta a</label>
            <select
              value={reportaA ?? ""}
              onChange={(e) =>
                setReportaA(
                  e.target.value === "" ? null : parseInt(e.target.value)
                )
              }
              className="border border-gray-300 rounded-lg p-2 w-full"
            >
              <option value="">-- Ninguno --</option>
              {cargos.map((cargo) => (
                <option key={cargo.id} value={cargo.id}>
                  {cargo.nombre}
                </option>
              ))}
            </select>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSubmit}>
            {cargoAEditar ? "Actualizar" : "Guardar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
