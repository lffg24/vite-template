import { Card } from "@/components/ui/card";
import { Hand } from "lucide-react";

interface BienvenidaUsuarioProps {
  nombre: string;
  cantidadPendientes: number;
}

export default function BienvenidaUsuario({
  nombre,
  cantidadPendientes,
}: BienvenidaUsuarioProps) {
  return (
    <Card className="bg-emerald-50 p-6 rounded-xl shadow-sm flex items-start space-x-4">
      <div className="bg-emerald-100 rounded-full p-2">
        <Hand className="h-6 w-6 text-emerald-600" />
      </div>
      <div>
        <p className="text-sm text-muted-foreground">Bienvenida</p>
        <h1 className="text-2xl font-bold">¡Hola, {nombre}!</h1>
        <p className="text-muted-foreground mt-1">
          Tienes {cantidadPendientes} evaluación
          {cantidadPendientes !== 1 && "es"} pendiente
          {cantidadPendientes !== 1 && "s"} por completar. Tu participación es
          importante para el desarrollo del equipo.
        </p>
      </div>
    </Card>
  );
}
