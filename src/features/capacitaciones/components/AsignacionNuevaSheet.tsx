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
import { EtiquetaConAyuda } from "@/shared/ui/Ayuda";
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
import type { ErrorApi, ModoIdentidad, VersionAsignable } from "@/types/capacitaciones";
import { OpcionesExcluyentes, type OpcionExcluyente } from "@/shared/ui/OpcionesExcluyentes";
import { useConsulta } from "../useConsulta";
import { CargandoPanel, ErrorConsulta, SinDatos } from "./EstadoPantalla";
import { formatearIntensidad, formatearVigenciaMeses } from "../formato";
import { DatePicker, isoLocal } from "@/shared/ui/DatePicker";

/**
 * Los dos modos, explicados por su CONSECUENCIA y no por su nombre.
 *
 * «Invitación individual» y «autodeclarada» no le dicen nada a quien organiza
 * una capacitación. Lo que necesita saber es qué va a tener que repartir y si
 * hace falta cargar la nómina antes, así que eso es lo que se lee.
 */
const MODOS: OpcionExcluyente<ModoIdentidad>[] = [
  {
    valor: "INVITACION_INDIVIDUAL",
    titulo: "Solo quien esté en la nómina, con invitación personal",
    descripcion:
      "Cargas la lista de participantes y cada persona recibe un enlace propio. Nadie más puede entrar.",
    nota: "El enlace de grupo seguirá existiendo, pero solo para mirar de qué va el curso: por ahí no se puede inscribir nadie.",
  },
  {
    valor: "AUTODECLARADA",
    titulo: "Cualquiera con el enlace, escribiendo sus datos",
    descripcion:
      "Un solo enlace que circula. Quien entra escribe su documento y su nombre, sin cuenta ni contraseña.",
    nota: "Nadie verifica esos datos. La constancia deja constancia de ello, porque no es lo mismo como evidencia.",
  },
];

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
  const [modo, setModo] = useState<ModoIdentidad>("INVITACION_INDIVIDUAL");
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
        modo_identidad: modo,
      });
      toast({
        title: "Curso asignado",
        description:
          modo === "INVITACION_INDIVIDUAL"
            ? "Carga la nómina y emite las invitaciones: es lo que se reparte."
            : "Genera el enlace de grupo: con este modo sirve para inscribirse.",
      });
      setSeleccion("");
      setFechaObjetivo("");
      setVigencia("");
      setModo("INVITACION_INDIVIDUAL");
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
              escena="capacitaciones"
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
              <EtiquetaConAyuda
                htmlFor="a-fecha"
                ayuda="Cuándo debería estar hecha. No bloquea nada: es seguimiento."
                etiquetaAyuda="Qué es la fecha objetivo"
              >
                Fecha objetivo
              </EtiquetaConAyuda>
              <DatePicker
                id="a-fecha"
                value={fechaObjetivo}
                onChange={setFechaObjetivo}
                min={isoLocal(new Date())}
                hideLabel
              />

            </div>

            <OpcionesExcluyentes<ModoIdentidad>
              nombre="a-modo"
              leyenda="Quién dice quién es cada participante"
              ayuda="Decide qué se reparte, y no se puede cambiar después de crear la asignación."
              valor={modo}
              alCambiar={setModo}
              opciones={MODOS}
            />

            <div className="space-y-2">
              <EtiquetaConAyuda
                htmlFor="a-vigencia"
                ayuda="Se resuelve y se guarda ahora. Cambiar la vigencia del curso después no altera esta asignación."
                etiquetaAyuda="Cómo funciona la vigencia"
              >
                Vigencia de la constancia
              </EtiquetaConAyuda>
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
              />

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
