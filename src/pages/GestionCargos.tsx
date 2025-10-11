import ListaCargos from "@/components/ui/cargos/ListaCargos";
import ListaEvaluaciones from "@/components/ui/evaluaciones/ListaEvaluaciones";

export default function GestionCargos() {
  return (
    <div className="p-4 space-y-6">
      <h2 className="text-2xl font-bold">Gestión de Cargos</h2>
      <ListaCargos />
    </div>
  );
}
