// src/features/capacitaciones/components/LeccionesEditor.tsx · A-04
//
// Constructor de lecciones.
//
// Dos cosas que esta pantalla deliberadamente NO hace:
//
// - **No reordena.** El orden lo calcula la base dentro del mismo bloqueo que
//   inserta la lección, y al eliminar lo compacta con `ROW_NUMBER()`. Un
//   arrastrar-y-soltar aquí necesitaría un endpoint de reordenamiento que no
//   existe, y fingirlo en el cliente dejaría la pantalla mostrando un orden que
//   el servidor no tiene.
// - **No deja elegir un tipo sin reproductor.** Están a la vista y
//   deshabilitados con su motivo, porque el backend rechaza publicar una
//   versión que los use. Ocultarlos haría que la limitación se descubriera al
//   pulsar «Publicar», con la lección ya redactada.

import { useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SeccionPlegable } from "@/shared/ui/SeccionPlegable";
import { FilaOrdenable, ListaOrdenable } from "@/shared/ui/ListaOrdenable";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
  agregarLeccion,
  editarLeccion,
  eliminarLeccion,
  reordenarLecciones,
} from "@/services/capacitacionesService";
import type {
  BloqueLeccion,
  ErrorApi,
  EvaluacionLeccion,
  Leccion,
  ProveedorRecurso,
  TipoLeccion,
} from "@/types/capacitaciones";
import {
  ConstructorEvaluacion,
  EVALUACION_VACIA,
} from "@/features/capacitaciones/components/ConstructorEvaluacion";
import {
  ETIQUETA_TIPO_LECCION,
  ETIQUETA_PROVEEDOR,
  PROVEEDORES_RECURSO,
  TIPOS_LECCION,
  TIPOS_LECCION_CON_RECURSO,
  TIPOS_LECCION_IMPLEMENTADOS,
  TIPOS_LECCION_NUNCA_OBLIGATORIOS,
} from "@/types/capacitaciones";
import { TipoLeccionBadge } from "./Insignias";
import { formatearIntensidad } from "../formato";
import { SinDatos } from "./EstadoPantalla";

function estaImplementado(tipo: TipoLeccion) {
  return TIPOS_LECCION_IMPLEMENTADOS.includes(tipo);
}

/**
 * Los bloques se editan como texto plano separado por líneas en blanco.
 *
 * No es una simplificación temporal disfrazada: un editor enriquecido produce
 * marcado que después hay que sanear antes de pintarlo en el navegador del
 * participante, y esa decisión no está tomada. Texto plano se puede escapar sin
 * ambigüedad y se puede migrar a algo más rico sin perder contenido.
 */
function bloquesATexto(bloques: BloqueLeccion[] | null | undefined): string {
  if (!bloques || bloques.length === 0) return "";
  return bloques.map((b) => b.contenido).join("\n\n");
}

function textoABloques(texto: string): BloqueLeccion[] {
  return texto
    .split(/\n\s*\n/)
    .map((t) => t.trim())
    .filter((t) => t !== "")
    .map((contenido) => ({ tipo: "texto" as const, contenido }));
}

interface FormLeccion {
  tipo: TipoLeccion;
  titulo: string;
  contenido: string;
  proveedor: ProveedorRecurso;
  url: string;
  tituloRecurso: string;
  evaluacion: EvaluacionLeccion;
  duracion: string;
  obligatoria: boolean;
}

const FORM_VACIO: FormLeccion = {
  tipo: "NATIVA",
  titulo: "",
  contenido: "",
  proveedor: "YOUTUBE",
  url: "",
  tituloRecurso: "",
  evaluacion: EVALUACION_VACIA,
  duracion: "",
  obligatoria: true,
};

/** Este tipo se reproduce desde una URL, asi que exige material. */
function usaRecurso(tipo: TipoLeccion) {
  return TIPOS_LECCION_CON_RECURSO.includes(tipo);
}

export function LeccionesEditor({
  cursoId,
  lecciones,
  editable,
  alCambiar,
}: {
  cursoId: string;
  lecciones: Leccion[];
  /** Un curso archivado se consulta pero no se toca. */
  editable: boolean;
  alCambiar: () => Promise<void> | void;
}) {
  const { toast } = useToast();
  const [abierto, setAbierto] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [form, setForm] = useState<FormLeccion>(FORM_VACIO);
  const [guardando, setGuardando] = useState(false);
  const [errorTitulo, setErrorTitulo] = useState<string | null>(null);
  const [errorUrl, setErrorUrl] = useState<string | null>(null);
  const [errorEvaluacion, setErrorEvaluacion] = useState<string | null>(null);
  const [aEliminar, setAEliminar] = useState<Leccion | null>(null);
  const [moviendo, setMoviendo] = useState(false);
  const [ordenOptimista, setOrdenOptimista] = useState<string[] | null>(null);
  const [eliminando, setEliminando] = useState(false);

  const obligatoriedadFijada = TIPOS_LECCION_NUNCA_OBLIGATORIOS.includes(form.tipo);

  function abrirNueva() {
    setEditandoId(null);
    setForm(FORM_VACIO);
    setErrorTitulo(null);
    setErrorUrl(null);
    setErrorEvaluacion(null);
    setAbierto(true);
  }

  function abrirEdicion(l: Leccion) {
    setEditandoId(l.id);
    setForm({
      tipo: l.tipo,
      titulo: l.titulo,
      contenido: bloquesATexto(l.bloques),
      proveedor: l.recurso?.proveedor ?? "YOUTUBE",
      url: l.recurso?.url ?? "",
      tituloRecurso: l.recurso?.titulo ?? "",
      evaluacion: l.evaluacion ?? EVALUACION_VACIA,
      duracion: l.duracion_estimada_min == null ? "" : String(l.duracion_estimada_min),
      obligatoria: l.obligatoria,
    });
    setErrorTitulo(null);
    setErrorUrl(null);
    setErrorEvaluacion(null);
    setAbierto(true);
  }

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    const titulo = form.titulo.trim();
    if (titulo === "") {
      setErrorTitulo("La lección necesita un título.");
      return;
    }
    setErrorTitulo(null);

    const duracionNum = form.duracion.trim() === "" ? null : Number(form.duracion);
    const duracion =
      duracionNum !== null && Number.isFinite(duracionNum) && duracionNum > 0
        ? Math.trunc(duracionNum)
        : null;
    const bloques = textoABloques(form.contenido);

    // El material solo viaja si la leccion es de las que lo usan Y hay URL. Sin
    // la segunda condicion, editar el titulo de una leccion de video volveria a
    // registrar el mismo recurso en cada guardado.
    const urlLimpia = form.url.trim();
    if (usaRecurso(form.tipo) && urlLimpia === "" && !editandoId) {
      setErrorUrl("Esta leccion se reproduce desde una direccion: hace falta.");
      return;
    }
    setErrorUrl(null);

    const recurso =
      usaRecurso(form.tipo) && urlLimpia !== ""
        ? {
            proveedor: form.proveedor,
            url: urlLimpia,
            titulo: form.tituloRecurso.trim() || titulo,
          }
        : null;

    // La evaluación viaja entera o no viaja. El servidor la valida y la
    // normaliza; aquí solo se comprueba lo que se puede decir sin duplicar sus
    // reglas —el detalle vive en `catalogo.validar_evaluacion`, y tenerlo en
    // dos sitios es la forma segura de que acaben diciendo cosas distintas.
    const esEvaluacion = form.tipo === "EVALUACION";
    if (esEvaluacion && form.evaluacion.preguntas.length === 0) {
      setErrorEvaluacion("Agrega al menos una pregunta.");
      return;
    }
    setErrorEvaluacion(null);
    const evaluacion = esEvaluacion ? form.evaluacion : null;

    setGuardando(true);
    try {
      if (editandoId) {
        await editarLeccion(cursoId, editandoId, {
          titulo,
          recurso,
          evaluacion,
          bloques: bloques.length > 0 ? bloques : null,
          duracion_estimada_min: duracion,
          obligatoria: obligatoriedadFijada ? false : form.obligatoria,
        });
        toast({ title: "Lección guardada" });
      } else {
        await agregarLeccion(cursoId, {
          tipo: form.tipo,
          titulo,
          recurso,
          evaluacion,
          bloques: bloques.length > 0 ? bloques : null,
          duracion_estimada_min: duracion,
          obligatoria: obligatoriedadFijada ? false : form.obligatoria,
        });
        toast({ title: "Lección agregada", description: "Se ubicó al final del curso." });
      }
      setAbierto(false);
      await alCambiar();
    } catch (e) {
      const err = e as ErrorApi;
      toast({
        variant: "destructive",
        title: editandoId ? "No pudimos guardar la lección" : "No pudimos agregar la lección",
        description: err.message,
      });
    } finally {
      setGuardando(false);
    }
  }

  async function reordenar(nuevos: string[]) {
    // Se pinta el orden nuevo ANTES de que responda el servidor. Esperar a la
    // respuesta para mover la fila hace que la lección salte de vuelta al sitio
    // de origen durante un instante, y arrastrar se siente roto aunque
    // funcione. Si falla, se recarga y vuelve al orden real.
    setOrdenOptimista(nuevos);
    setMoviendo(true);
    try {
      await reordenarLecciones(cursoId, nuevos);
      await alCambiar();
    } catch (e) {
      const err = e as ErrorApi;
      toast({
        variant: "destructive",
        title: "No pudimos guardar el orden",
        description: err.message,
      });
      await alCambiar();
    } finally {
      setOrdenOptimista(null);
      setMoviendo(false);
    }
  }

  async function confirmarEliminacion() {
    if (!aEliminar) return;
    setEliminando(true);
    try {
      await eliminarLeccion(cursoId, aEliminar.id);
      toast({
        title: "Lección eliminada",
        description: "Las siguientes se renumeraron para no dejar huecos.",
      });
      setAEliminar(null);
      await alCambiar();
    } catch (e) {
      const err = e as ErrorApi;
      toast({
        variant: "destructive",
        title: "No pudimos eliminar la lección",
        description: err.message,
      });
    } finally {
      setEliminando(false);
    }
  }

  // Mientras el servidor confirma, manda el orden local. `ordenOptimista`
  // lleva ids y no lecciones: así no hay dos copias de los datos que puedan
  // desincronizarse, solo dos opiniones sobre el orden.
  const visibles = ordenOptimista
    ? ordenOptimista
        .map((id) => lecciones.find((l) => l.id === id))
        .filter((l): l is Leccion => Boolean(l))
    : lecciones;

  const totalMinutos = lecciones.reduce((acc, l) => acc + (l.duracion_estimada_min ?? 0), 0);

  return (
    <SeccionPlegable
      titulo="Lecciones"
      claveMemoria="abril360.capacitaciones.curso.lecciones"
      descripcion={
        lecciones.length > 0
          ? `${lecciones.length} ${lecciones.length === 1 ? "lección" : "lecciones"}${
              totalMinutos > 0 ? ` · ${formatearIntensidad(totalMinutos)} estimados` : ""
            }`
          : "Un curso sin lecciones no se puede publicar."
      }
      estado={
        lecciones.length === 0 ? <Badge variant="relWarning">Vacío</Badge> : null
      }
      accion={
        editable ? (
          <Button variant="relOutline" size="sm" onClick={abrirNueva}>
            <Plus aria-hidden="true" />
            Agregar lección
          </Button>
        ) : null
      }
    >
        {lecciones.length === 0 ? (
          <SinDatos
            ilustracion="documento"
            titulo="El curso todavía no tiene lecciones"
            descripcion="Un curso sin lecciones no se puede publicar: produciría una asignación que nadie puede completar."
            accion={
              editable ? (
                <Button variant="rel" onClick={abrirNueva}>
                  <Plus aria-hidden="true" />
                  Agregar la primera
                </Button>
              ) : undefined
            }
          />
        ) : (
          <ListaOrdenable
            ids={visibles.map((l) => l.id)}
            alReordenar={(nuevos) => void reordenar(nuevos)}
            deshabilitada={!editable || moviendo}
          >
            {visibles.map((l, i) => (
              <FilaOrdenable
                key={l.id}
                id={l.id}
                etiqueta={l.titulo}
                deshabilitada={!editable || moviendo}
                className="bg-rel-surface-subtle"
              >
                <div className="flex flex-wrap items-start gap-3 sm:flex-nowrap">
                <span
                  className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-rel-canvas font-rel-heading text-sm font-bold tabular-nums text-rel-dark"
                  aria-hidden="true"
                >
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-rel-heading text-base font-semibold text-rel-dark">
                      <span className="sr-only">Lección {l.orden}: </span>
                      {l.titulo}
                    </h3>
                    <TipoLeccionBadge tipo={l.tipo} implementado={estaImplementado(l.tipo)} />
                    {l.obligatoria ? null : (
                      <span className="text-xs font-semibold text-rel-muted">
                        No obligatoria
                      </span>
                    )}
                  </div>
                  <p className="mt-1 font-rel-body text-sm text-rel-muted">
                    {l.recurso
                      ? `${ETIQUETA_PROVEEDOR[l.recurso.proveedor]} · ${l.recurso.titulo}`
                      : l.bloques?.length
                      ? `${l.bloques.length} ${l.bloques.length === 1 ? "bloque" : "bloques"}`
                      : "Sin contenido todavía"}
                    {l.duracion_estimada_min
                      ? ` · ${formatearIntensidad(l.duracion_estimada_min)}`
                      : null}
                  </p>
                </div>
                {editable ? (
                  <div className="flex shrink-0 gap-1">
                    <Button
                      variant="relGhost"
                      size="sm"
                      onClick={() => abrirEdicion(l)}
                      aria-label={`Editar la lección ${l.titulo}`}
                    >
                      <Pencil aria-hidden="true" />
                      <span className="hidden sm:inline">Editar</span>
                    </Button>
                    <Button
                      variant="relGhost"
                      size="sm"
                      className="text-rel-danger hover:bg-rel-danger-subtle"
                      onClick={() => setAEliminar(l)}
                      aria-label={`Eliminar la lección ${l.titulo}`}
                    >
                      <Trash2 aria-hidden="true" />
                      <span className="sr-only">Eliminar</span>
                    </Button>
                  </div>
                ) : null}
                </div>
              </FilaOrdenable>
            ))}
          </ListaOrdenable>
        )}


      {/* --- alta y edición --- */}
      <Sheet
        open={abierto}
        onOpenChange={(v) => {
          if (!v) setAbierto(false);
        }}
      >
        <SheetContent className="rel-scope w-full overflow-y-auto bg-rel-surface font-rel-body sm:max-w-xl">
          <SheetHeader>
            <SheetTitle className="font-rel-heading text-rel-dark">
              {editandoId ? "Editar lección" : "Nueva lección"}
            </SheetTitle>
            <SheetDescription className="text-rel-muted">
              {editandoId
                ? "El tipo no se puede cambiar: cambiaría la regla de completitud de una lección que quizá ya está publicada en otra versión."
                : "Se ubicará al final del curso."}
            </SheetDescription>
          </SheetHeader>

          <form onSubmit={enviar} className="mt-6 space-y-5" noValidate>
            <div className="space-y-2">
              <Label htmlFor="l-tipo" className="text-rel-dark">
                Tipo de lección
              </Label>
              <Select
                value={form.tipo}
                onValueChange={(v) => setForm((f) => ({ ...f, tipo: v as TipoLeccion }))}
                disabled={editandoId !== null}
              >
                <SelectTrigger id="l-tipo">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIPOS_LECCION.map((t) => (
                    <SelectItem key={t} value={t} disabled={!estaImplementado(t)}>
                      {ETIQUETA_TIPO_LECCION[t]}
                      {estaImplementado(t) ? "" : " · sin reproductor todavía"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-sm text-rel-muted">
                El contenido nativo se escribe aquí. El video y el documento se
                reproducen desde una dirección externa. El recurso externo sigue
                sin reproductor, y por eso no se puede publicar con él.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="l-titulo" className="text-rel-dark">
                Título <span className="text-rel-danger">*</span>
              </Label>
              <Input
                id="l-titulo"
                value={form.titulo}
                maxLength={250}
                onChange={(e) => setForm((f) => ({ ...f, titulo: e.target.value }))}
                aria-invalid={errorTitulo ? true : undefined}
                aria-describedby={errorTitulo ? "l-titulo-error" : undefined}
                autoFocus
              />
              {errorTitulo ? (
                <p id="l-titulo-error" role="alert" className="text-sm text-rel-danger">
                  {errorTitulo}
                </p>
              ) : null}
            </div>

            {usaRecurso(form.tipo) ? (
              <fieldset className="space-y-4 rounded-rel-card border border-rel-border p-4">
                <legend className="px-1 text-sm font-semibold text-rel-dark">
                  Material
                </legend>

                <div className="space-y-2">
                  <Label htmlFor="l-proveedor" className="text-rel-dark">
                    Dónde está
                  </Label>
                  <Select
                    value={form.proveedor}
                    onValueChange={(v) =>
                      setForm((f) => ({ ...f, proveedor: v as ProveedorRecurso }))
                    }
                  >
                    <SelectTrigger id="l-proveedor">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PROVEEDORES_RECURSO.map((prov) => (
                        <SelectItem key={prov} value={prov}>
                          {ETIQUETA_PROVEEDOR[prov]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="l-url" className="text-rel-dark">
                    Dirección <span className="text-rel-danger">*</span>
                  </Label>
                  <Input
                    id="l-url"
                    type="url"
                    inputMode="url"
                    placeholder="https://…"
                    value={form.url}
                    maxLength={2000}
                    onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
                    aria-invalid={errorUrl ? true : undefined}
                    aria-describedby={errorUrl ? "l-url-error" : "l-url-ayuda"}
                  />
                  {errorUrl ? (
                    <p id="l-url-error" role="alert" className="text-sm text-rel-danger">
                      {errorUrl}
                    </p>
                  ) : (
                    <p id="l-url-ayuda" className="text-sm text-rel-muted">
                      Tiene que empezar por https:// y el dominio debe
                      corresponder al proveedor elegido; el servidor comprueba
                      las dos cosas. El material tiene que quedar visible para
                      cualquiera con el enlace: el participante entra sin cuenta.
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="l-titulo-recurso" className="text-rel-dark">
                    Nombre del material
                  </Label>
                  <Input
                    id="l-titulo-recurso"
                    value={form.tituloRecurso}
                    maxLength={250}
                    placeholder="Si lo dejas vacío, se usa el título de la lección"
                    onChange={(e) =>
                      setForm((f) => ({ ...f, tituloRecurso: e.target.value }))
                    }
                  />
                </div>

                <p className="text-sm text-rel-muted">
                  Se dará por vista cuando el participante lo confirme. De un
                  video incrustado no se puede medir cuánto se reprodujo sin la
                  API del proveedor, y mostrar un porcentaje calculado en el
                  navegador sería inventarlo.
                </p>
              </fieldset>
            ) : null}

            {form.tipo === "EVALUACION" ? (
              <fieldset className="space-y-4 rounded-rel-card border border-rel-border p-4">
                <legend className="px-1 text-sm font-semibold text-rel-dark">
                  Cuestionario
                </legend>
                <ConstructorEvaluacion
                  valor={form.evaluacion}
                  alCambiar={(v) => setForm((f) => ({ ...f, evaluacion: v }))}
                />
                {errorEvaluacion ? (
                  <p role="alert" className="text-sm text-rel-danger">
                    {errorEvaluacion}
                  </p>
                ) : null}
                <p className="text-sm text-rel-muted">
                  Una evaluación tiene que ser obligatoria para publicarse: si se
                  puede saltar, la constancia no prueba que se aprobara.
                </p>
              </fieldset>
            ) : null}

            {form.tipo === "NATIVA" ? (
            <div className="space-y-2">
              <Label htmlFor="l-contenido" className="text-rel-dark">
                Contenido
              </Label>
              <Textarea
                id="l-contenido"
                rows={10}
                value={form.contenido}
                onChange={(e) => setForm((f) => ({ ...f, contenido: e.target.value }))}
                aria-describedby="l-contenido-ayuda"
              />
              <p id="l-contenido-ayuda" className="text-sm text-rel-muted">
                Separa los bloques con una línea en blanco. Cada bloque es una
                pantalla para el participante.
              </p>
            </div>
            ) : null}

            <div className="space-y-2">
              <Label htmlFor="l-duracion" className="text-rel-dark">
                Duración estimada (minutos)
              </Label>
              <Input
                id="l-duracion"
                inputMode="numeric"
                value={form.duracion}
                onChange={(e) => setForm((f) => ({ ...f, duracion: e.target.value }))}
              />
            </div>

            <div className="flex items-start gap-3">
              <Checkbox
                id="l-obligatoria"
                checked={obligatoriedadFijada ? false : form.obligatoria}
                disabled={obligatoriedadFijada}
                onCheckedChange={(v) => setForm((f) => ({ ...f, obligatoria: v === true }))}
                className="mt-0.5"
              />
              <div>
                <Label htmlFor="l-obligatoria" className="text-rel-dark">
                  Obligatoria para completar el curso
                </Label>
                {obligatoriedadFijada ? (
                  <p className="mt-1 text-sm text-rel-muted">
                    Un recurso externo nunca cuenta para la finalización: no se
                    puede comprobar que alguien lo consumió.
                  </p>
                ) : null}
              </div>
            </div>

            <SheetFooter className="gap-2 sm:gap-2">
              <Button
                type="button"
                variant="relGhost"
                onClick={() => setAbierto(false)}
                disabled={guardando}
              >
                Cancelar
              </Button>
              <Button type="submit" variant="rel" disabled={guardando}>
                {guardando ? "Guardando…" : editandoId ? "Guardar lección" : "Agregar lección"}
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>

      {/* --- confirmación destructiva --- */}
      <AlertDialog open={aEliminar !== null} onOpenChange={(v) => !v && setAEliminar(null)}>
        <AlertDialogContent className="rel-scope font-rel-body">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-rel-heading text-rel-dark">
              ¿Eliminar «{aEliminar?.titulo}»?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-rel-muted">
              Se elimina del curso vivo y las lecciones siguientes se renumeran.
              Las versiones ya publicadas conservan su copia congelada: quien esté
              cursando una de ellas no se ve afectado.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={eliminando}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-rel-danger text-rel-danger-foreground hover:bg-rel-danger/90"
              onClick={(e) => {
                e.preventDefault();
                void confirmarEliminacion();
              }}
              disabled={eliminando}
            >
              {eliminando ? "Eliminando…" : "Eliminar lección"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SeccionPlegable>
  );
}
