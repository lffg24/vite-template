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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
            <label htmlFor="cargo-reporta-a" className="mb-1 block text-sm font-medium">Reporta a</label>
            <Select
              value={reportaA === null ? "ninguno" : String(reportaA)}
              onValueChange={(value) => setReportaA(value === "ninguno" ? null : Number(value))}
            >
              <SelectTrigger id="cargo-reporta-a" className="w-full"><SelectValue placeholder="Ninguno" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ninguno">Ninguno</SelectItem>
                {cargos.map((cargo) => (
                  <SelectItem key={cargo.id} value={String(cargo.id)}>
                    {cargo.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
