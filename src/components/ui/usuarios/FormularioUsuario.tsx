// src/components/usuarios/FormularioUsuario.tsx
import { useCallback, useState } from "react";
import { crearUsuario } from "@/services/usuarioService";

interface UsuarioCreate {
  nombre: string;
  correo: string;
}

type Props = {
  /** Opcional: permite refrescar la lista en el padre después de crear */
  onCreated?: () => void;
};

export default function FormularioUsuario({ onCreated }: Props) {
  const [nombre, setNombre] = useState("");
  const [correo, setCorreo] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const canSubmit = nombre.trim().length > 1 && /\S+@\S+\.\S+/.test(correo);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!canSubmit || loading) return;

      setLoading(true);
      setErrorMsg(null);
      try {
        const payload: UsuarioCreate = {
          nombre: nombre.trim(),
          correo: correo.trim(),
        };
        await crearUsuario(payload as any);
        setNombre("");
        setCorreo("");
        onCreated?.();
      } catch (err: any) {
        setErrorMsg(
          err?.message ?? "Ocurrió un error al registrar el usuario."
        );
        // Mantener inputs para que el usuario pueda corregir
      } finally {
        setLoading(false);
      }
    },
    [canSubmit, loading, nombre, correo, onCreated]
  );

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 p-4 border rounded-lg shadow-sm bg-white"
      noValidate
    >
      <div>
        <label htmlFor="nombre" className="block text-sm font-medium">
          Nombre
        </label>
        <input
          id="nombre"
          type="text"
          placeholder="Nombre completo"
          className="w-full border rounded-md px-3 py-2 mt-1 outline-none focus:ring-2 focus:ring-primary"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          autoComplete="name"
          required
        />
      </div>

      <div>
        <label htmlFor="correo" className="block text-sm font-medium">
          Correo
        </label>
        <input
          id="correo"
          type="email"
          placeholder="ejemplo@correo.com"
          className="w-full border rounded-md px-3 py-2 mt-1 outline-none focus:ring-2 focus:ring-primary"
          value={correo}
          onChange={(e) => setCorreo(e.target.value)}
          autoComplete="email"
          required
        />
        {!/\S+@\S+\.\S+/.test(correo) && correo.length > 0 && (
          <p className="mt-1 text-xs text-red-600">
            Ingresa un correo electrónico válido.
          </p>
        )}
      </div>

      {errorMsg && (
        <div className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded">
          {errorMsg}
        </div>
      )}

      <button
        type="submit"
        disabled={!canSubmit || loading}
        className="bg-blue-600 disabled:opacity-60 disabled:cursor-not-allowed text-white px-4 py-2 rounded hover:bg-blue-700 transition"
      >
        {loading ? "Registrando..." : "Registrar Usuario"}
      </button>
    </form>
  );
}
