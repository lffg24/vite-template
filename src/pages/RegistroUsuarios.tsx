import FormularioUsuario from "@/components/ui/usuarios/FormularioUsuario";
import ListaUsuarios from "@/components/ui/usuarios/ListaUsuarios";

export default function RegistroUsuarios() {
  return (
    <div className="p-4 space-y-6">
      <h2 className="text-2xl font-bold">Registro de Usuario</h2>
      <FormularioUsuario />
      <hr />
      <h3 className="text-xl font-semibold">Lista de Usuarios</h3>
      <ListaUsuarios />
    </div>
  );
}
