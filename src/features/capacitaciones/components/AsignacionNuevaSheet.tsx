// src/features/capacitaciones/components/AsignacionNuevaSheet.tsx
//
// Se asigna una VERSIÓN, no un curso. Es lo que hace que corregir la redacción
// en 2027 no cambie qué se le enseñó a quien la tomó en 2025.
//
// Las versiones ya asignadas se muestran deshabilitadas con su motivo, en vez
// de dejarlas elegibles y devolver un 409: el servidor ya sabe cuáles son, y
// hacérselo descubrir al usuario con un error es trasladarle un trabajo que la
// pantalla podía ahorrarle.

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useToast } from "@/hooks/use-toast";
import {
  crearAsignacion,
  listarVersionesAsignables,
} from "@/services/capacitacionesService";
import type { ErrorApi, VersionAsignable } from "@/types/capacitaciones";
import { useConsulta } from "../useConsulta";
import { CargandoPanel, ErrorConsulta, SinDatos } from "./EstadoPantalla";
import { formatearIntensidad, formatearVigenciaMeses } from "../formato";

export function AsignacionNuevaSheet({
  abierto,
  alCerrar,
  alCrear,
}: {
  abierto: boolean;
  alCerrar: () => void;
  alCrear: () => Promise<void> | void;
}) {
  const { toast } = useToast();
  // Se consulta con el sheet cerrado también: es una lista corta y tenerla
  // lista evita el parpadeo de abrir y esperar.
  const versiones = useConsulta<VersionAsignable[]>(() => listarVersionesAsignables(), []);
  const [seleccion, setSeleccion] = useState<string>("");
  const [fechaObjetivo, setFechaObjetivo] = useState("");
  const [vigencia, setVigencia] = useState("");
  const [guardando, setGuardando] = useState(false);

  const disponibles = (versiones.datos ?? []).filter((v) => !v.ya_asignada);
  const elegida = (versiones.datos ?? []).find((v) => v.curso_version_id === seleccion);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    if (!seleccion) return;
    setGuardando(true);
    try {
      const vigenciaNum = vigencia.trim() === "" ? null : Number(vigencia);
      await crearAsignacion({
        curso_version_id: seleccion,
        fecha_objetivo: fechaObjetivo || null,
        vigencia_meses:
          vigenciaNum !== null && Number.isFinite(vigenciaNum) && vigenciaNum > 0
            ? Math.trunc(vigenciaNum)
            : null,
      });
      toast({
        title: "Curso asignado",
        description: "Ya se le pueden generar enlaces de acceso.",
      });
      setSeleccion("");
      setFechaObjetivo("");
      setVigencia("");
      await versiones.refrescar();
      await alCrear();
    } catch (e) {
      const err = e as ErrorApi;
      toast({
        variant: "destructive",
        title:
          err.status === 409
            ? "Esa versión ya está asignada"
            : "No pudimos crear la asignación",
        description: err.message,
      });
      // Si fue un 409 la lista estaba desactualizada: se refresca para que la
      // opción quede marcada como ya asignada.
      if (err.status === 409) await versiones.refrescar();
    } finally {
      setGuardando(false);
    }
  }

  return (
    <Sheet open={abierto} onOpenChange={(v) => !v && alCerrar()}>
      <SheetContent className="rel-scope w-full overflow-y-auto bg-rel-surface font-rel-body sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="font-rel-heading text-rel-dark">Asignar un curso</SheetTitle>
          <SheetDescription className="text-rel-muted">
            Se asigna una versión concreta. Lo que se publique después no cambia
            lo que verá quien entre por esta asignación.
          </SheetDescription>
        </SheetHeader>

        {versiones.fase === "cargando" ? (
          <div className="mt-6">
            <CargandoPanel etiqueta="Buscando versiones publicadas…" />
          </div>
        ) : null}

        {versiones.fase === "error" && versiones.error ? (
          <div className="mt-6">
            <ErrorConsulta error={versiones.error} reintentar={versiones.refrescar} />
          </div>
        ) : null}

        {versiones.fase === "listo" && (versiones.datos ?? []).length === 0 ? (
          <div className="mt-6">
            <SinDatos
              titulo="No hay versiones publicadas"
              descripcion="Solo se puede asignar una versión congelada. Publica un curso del catálogo y vuelve aquí."
            />
          </div>
        ) : null}

        {versiones.fase === "listo" && (versiones.datos ?? []).length > 0 ? (
          <form onSubmit={enviar} className="mt-6 space-y-5" noValidate>
            <div className="space-y-2">
              <Label htmlFor="a-version" className="text-rel-dark">
                Curso y versión <span className="text-rel-danger">*</span>
              </Label>
              <Select value={seleccion} onValueChange={setSeleccion}>
                <SelectTrigger id="a-version">
                  <SelectValue placeholder="Elige una versión publicada" />
                </SelectTrigger>
                <SelectContent>
                  {(versiones.datos ?? []).map((v) => (
                    <SelectItem
                      key={v.curso_version_id}
                      value={v.curso_version_id}
                      disabled={v.ya_asignada}
                    >
                      {v.curso_titulo} · v{v.numero_version}
                      {v.ya_asignada ? " · ya asignada" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {disponibles.length === 0 ? (
                <p role="status" className="text-sm text-rel-warning">
                  Todas las versiones publicadas ya están asignadas a esta empresa.
                  Publica una versión nueva para volver a asignar el mismo curso.
                </p>
              ) : null}
            </div>

            {elegida ? (
              <dl className="grid grid-cols-2 gap-x-4 gap-y-1 rounded-rel-card bg-rel-surface-subtle p-4 text-sm">
                <dt className="text-rel-muted">Categoría</dt>
                <dd className="text-right text-rel-dark">
                  {elegida.categoria}
                  {elegida.categoria_restringida ? " · restringida" : ""}
                </dd>
                <dt className="text-rel-muted">Intensidad</dt>
                <dd className="text-right tabular-nums text-rel-dark">
                  {formatearIntensidad(elegida.intensidad_horaria_min)}
                </dd>
                <dt className="text-rel-muted">Vigencia del curso</dt>
                <dd className="text-right text-rel-dark">
                  {formatearVigenciaMeses(elegida.vigencia_meses)}
                </dd>
              </dl>
            ) : null}

            <div className="space-y-2">
              <Label htmlFor="a-fecha" className="text-rel-dark">
                Fecha objetivo
              </Label>
              <Input
                id="a-fecha"
                type="date"
                value={fechaObjetivo}
                onChange={(e) => setFechaObjetivo(e.target.value)}
                aria-describedby="a-fecha-ayuda"
              />
              <p id="a-fecha-ayuda" className="text-sm text-rel-muted">
                Cuándo debería estar hecha. No bloquea nada: es seguimiento.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="a-vigencia" className="text-rel-dark">
                Vigencia de la constancia
              </Label>
              <Input
                id="a-vigencia"
                inputMode="numeric"
                value={vigencia}
                onChange={(e) => setVigencia(e.target.value)}
                placeholder={
                  elegida?.vigencia_meses != null
                    ? `Hereda ${elegida.vigencia_meses} meses del curso`
                    : "En meses. Vacío = la del curso"
                }
                aria-describedby="a-vigencia-ayuda"
              />
              <p id="a-vigencia-ayuda" className="text-sm text-rel-muted">
                Se resuelve y se guarda ahora. Cambiar la vigencia del curso
                después no altera esta asignación.
              </p>
            </div>

            <SheetFooter className="gap-2 sm:gap-2">
              <Button type="button" variant="relGhost" onClick={alCerrar} disabled={guardando}>
                Cancelar
              </Button>
              <Button type="submit" variant="rel" disabled={!seleccion || guardando}>
                {guardando ? "Asignando…" : "Asignar curso"}
              </Button>
            </SheetFooter>
          </form>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
