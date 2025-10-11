// src/components/ui/evaluaciones/DrawerasignarUsuariosAEvaluacion.tsx
import { useEffect, useMemo, useState } from "react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { obtenerUsuarios } from "@/services/usuarioService";
import {
  asignarUsuariosAEvaluacion,
  obtenerUsuariosAsignados,
} from "@/services/evaluacionService";
import type { Usuario } from "@/types/usuario";
import type { UsuarioAsignado } from "@/types/evaluacion";
import { toast } from "@/hooks/use-toast";

export default function DrawerasignarUsuariosAEvaluacion({
  evaluacionId,
  abierto,
  cerrarDrawer,
}: {
  evaluacionId: number;
  abierto: boolean;
  cerrarDrawer: () => void;
}) {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [seleccion, setSeleccion] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (!abierto) return;
    (async () => {
      try {
        const [listado, asignados] = await Promise.all([
          obtenerUsuarios(),
          obtenerUsuariosAsignados(evaluacionId),
        ]);
        setUsuarios(listado);
        setSeleccion(new Set(asignados.map((u) => u.id)));
      } catch {
        toast({
          title: "No pudimos cargar usuarios",
          description: "Inténtalo nuevamente.",
          variant: "destructive",
        });
      }
    })();
  }, [abierto, evaluacionId]);

  const usuariosSeleccionados: UsuarioAsignado[] = useMemo(() => {
    const map = new Map(usuarios.map((u) => [u.id, u]));
    return [...seleccion].map((id) => {
      const u = map.get(id)!;
      return { id: u.id, nombre: u.nombre, email: u.email };
    });
  }, [seleccion, usuarios]);

  const toggle = (id: number) => {
    setSeleccion((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleGuardar = async () => {
    try {
      await asignarUsuariosAEvaluacion(evaluacionId, usuariosSeleccionados);
      toast({ title: "Asignación guardada" });
      cerrarDrawer();
    } catch {
      toast({
        title: "No pudimos guardar la asignación",
        description: "Revisa e inténtalo nuevamente.",
        variant: "destructive",
      });
    }
  };

  return (
    <Drawer open={abierto} onOpenChange={(o) => !o && cerrarDrawer()}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Asignar usuarios</DrawerTitle>
        </DrawerHeader>

        <div className="p-4 space-y-2 max-h-[60vh] overflow-auto">
          {usuarios.map((u) => (
            <label key={u.id} className="flex items-center gap-3 py-1">
              <Checkbox
                checked={seleccion.has(u.id)}
                onCheckedChange={() => toggle(u.id)}
              />
              <span className="text-sm">
                {u.nombre} · {u.email}
              </span>
            </label>
          ))}
        </div>

        <DrawerFooter className="flex gap-2">
          <Button onClick={handleGuardar}>Guardar Asignación</Button>
          <Button variant="outline" onClick={cerrarDrawer}>
            Cancelar
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
