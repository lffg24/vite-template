// src/components/usuarios/ListaUsuarios.tsx
import { useEffect, useState, useCallback } from "react";
import { obtenerUsuarios } from "@/services/usuarioService";

interface Usuario {
  id: string; // UUID en backend
  nombre: string;
  correo: string;
}

export default function ListaUsuarios() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const data = await obtenerUsuarios();
      setUsuarios(data as Usuario[]);
    } catch (error: any) {
      setErrorMsg(error?.message ?? "Error al obtener usuarios.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Lista de Usuarios</h2>
        <button
          onClick={cargar}
          className="text-sm border px-3 py-1 rounded hover:bg-gray-50"
          disabled={loading}
          title="Refrescar"
        >
          {loading ? "Actualizando..." : "Refrescar"}
        </button>
      </div>

      {errorMsg && (
        <div className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded">
          {errorMsg}
        </div>
      )}

      {loading ? (
        <div className="text-sm text-gray-500">Cargando usuarios…</div>
      ) : usuarios.length === 0 ? (
        <div className="text-sm text-gray-500">
          No hay usuarios registrados todavía.
        </div>
      ) : (
        <ul className="divide-y border rounded-md">
          {usuarios.map((u) => (
            <li key={u.id} className="p-3">
              <div className="font-medium">{u.nombre}</div>
              <a
                href={`mailto:${u.correo}`}
                className="text-sm text-blue-700 hover:underline break-all"
              >
                {u.correo}
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
