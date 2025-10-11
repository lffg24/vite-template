import { useParams } from "react-router-dom";
import ListaPreguntas from "@/components/ui/preguntas/ListaPreguntas";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

export default function GestionPreguntas() {
  const { id } = useParams<{ id: string }>();
  const evaluacionId = parseInt(id || "0");

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Gestión de Preguntas</CardTitle>
          <CardDescription>
            Administra las preguntas asociadas a esta evaluación
          </CardDescription>
        </CardHeader>
      </Card>

      <ListaPreguntas evaluacionId={evaluacionId} />
    </div>
  );
}
