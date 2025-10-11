import ListaEvaluaciones from "@/components/ui/evaluaciones/ListaEvaluaciones";

export default function GestionEvaluaciones() {
  return (
    <div className="p-4 space-y-6">
      <h2 className="text-2xl font-bold">Gestión de Evaluaciones</h2>
      <ListaEvaluaciones />
    </div>
  );
}
