// src/features/capacitaciones/components/CursoDatosForm.tsx · A-03
//
// Datos del curso vivo. Solo envía lo que cambió: el backend usa PATCH
// justamente para que un formulario parcial no pise lo que otra pestaña acaba
// de guardar, y mandar el objeto entero anularía esa garantía desde el cliente.
//
// Los tres campos normativos van agrupados y rotulados como tales, porque no
// son «más detalles»: son lo que el validador de publicación exige y lo que
// después se imprime en la constancia.

import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SeccionPlegable } from "@/shared/ui/SeccionPlegable";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { editarCurso } from "@/services/capacitacionesService";
import type {
  CategoriaCurso,
  CursoCabecera,
  CursoEditar,
  ErrorApi,
} from "@/types/capacitaciones";
import { CATEGORIAS_CURSO, ETIQUETA_CATEGORIA } from "@/types/capacitaciones";

interface Borrador {
  titulo: string;
  categoria: CategoriaCurso;
  descripcion: string;
  objetivos: string;
  temario: string;
  intensidad_horaria_min: string;
  responsable_contenido: string;
  vigencia_meses: string;
}

function aBorrador(curso: CursoCabecera): Borrador {
  return {
    titulo: curso.titulo,
    categoria: curso.categoria,
    descripcion: curso.descripcion ?? "",
    objetivos: curso.objetivos ?? "",
    temario: curso.temario ?? "",
    intensidad_horaria_min:
      curso.intensidad_horaria_min == null ? "" : String(curso.intensidad_horaria_min),
    responsable_contenido: curso.responsable_contenido ?? "",
    vigencia_meses: curso.vigencia_meses == null ? "" : String(curso.vigencia_meses),
  };
}

function textoOnulo(v: string): string | null {
  const t = v.trim();
  return t === "" ? null : t;
}

function enteroOnulo(v: string): number | null {
  const t = v.trim();
  if (t === "") return null;
  const n = Number(t);
  return Number.isFinite(n) && n > 0 ? Math.trunc(n) : null;
}

export function CursoDatosForm({
  curso,
  alGuardar,
}: {
  curso: CursoCabecera;
  alGuardar: () => Promise<void> | void;
}) {
  const { toast } = useToast();
  const original = useMemo(() => aBorrador(curso), [curso]);
  const [valores, setValores] = useState<Borrador>(original);
  const [guardando, setGuardando] = useState(false);
  const [errores, setErrores] = useState<Partial<Record<keyof Borrador, string>>>({});

  // Si el curso se recarga (por ejemplo tras publicar), el formulario vuelve a
  // reflejarlo. Sin esto quedaría mostrando la versión anterior en silencio.
  useEffect(() => setValores(original), [original]);

  const sucio = useMemo(
    () => (Object.keys(original) as (keyof Borrador)[]).some((k) => original[k] !== valores[k]),
    [original, valores]
  );

  function set<K extends keyof Borrador>(campo: K, valor: Borrador[K]) {
    setValores((v) => ({ ...v, [campo]: valor }));
  }

  function validar(): boolean {
    const nuevos: Partial<Record<keyof Borrador, string>> = {};
    if (valores.titulo.trim() === "") {
      nuevos.titulo = "El título no puede quedar vacío.";
    }
    for (const campo of ["intensidad_horaria_min", "vigencia_meses"] as const) {
      const bruto = valores[campo].trim();
      if (bruto !== "" && enteroOnulo(bruto) === null) {
        nuevos[campo] = "Escribe un número entero mayor que cero.";
      }
    }
    setErrores(nuevos);
    return Object.keys(nuevos).length === 0;
  }

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    if (!validar()) return;

    // Solo lo que cambió. Lo ausente en el PATCH no se toca.
    const cambios: CursoEditar = {};
    if (valores.titulo !== original.titulo) cambios.titulo = valores.titulo.trim();
    if (valores.categoria !== original.categoria) cambios.categoria = valores.categoria;
    if (valores.descripcion !== original.descripcion)
      cambios.descripcion = textoOnulo(valores.descripcion);
    if (valores.objetivos !== original.objetivos)
      cambios.objetivos = textoOnulo(valores.objetivos);
    if (valores.temario !== original.temario) cambios.temario = textoOnulo(valores.temario);
    if (valores.responsable_contenido !== original.responsable_contenido)
      cambios.responsable_contenido = textoOnulo(valores.responsable_contenido);
    if (valores.intensidad_horaria_min !== original.intensidad_horaria_min)
      cambios.intensidad_horaria_min = enteroOnulo(valores.intensidad_horaria_min);
    if (valores.vigencia_meses !== original.vigencia_meses)
      cambios.vigencia_meses = enteroOnulo(valores.vigencia_meses);

    if (Object.keys(cambios).length === 0) return;

    setGuardando(true);
    try {
      await editarCurso(curso.id, cambios);
      toast({ title: "Cambios guardados" });
      await alGuardar();
    } catch (e) {
      const err = e as ErrorApi;
      toast({
        variant: "destructive",
        title: "No pudimos guardar",
        description: err.message,
      });
    } finally {
      setGuardando(false);
    }
  }

  return (
    <SeccionPlegable
      titulo="Datos del curso"
      claveMemoria="abril360.capacitaciones.curso.datos"
      descripcion="Categoría, intensidad y vigencia. Son los datos que el validador exige para publicar."
      // La insignia va en la cabecera y no dentro del formulario a propósito:
      // plegada la sección, es lo único que queda visible, y «sin guardar» es
      // justo lo que no se puede esconder.
      estado={
        sucio ? (
          <Badge variant="relWarning">Sin guardar</Badge>
        ) : (
          <Badge variant="relNeutral">Guardado</Badge>
        )
      }
    >
        <form onSubmit={enviar} className="space-y-6" noValidate>
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="d-titulo" className="text-rel-dark">
                Título <span className="text-rel-danger">*</span>
              </Label>
              <Input
                id="d-titulo"
                value={valores.titulo}
                maxLength={250}
                onChange={(e) => set("titulo", e.target.value)}
                aria-invalid={errores.titulo ? true : undefined}
                aria-describedby={errores.titulo ? "d-titulo-error" : undefined}
              />
              {errores.titulo ? (
                <p id="d-titulo-error" role="alert" className="text-sm text-rel-danger">
                  {errores.titulo}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="d-categoria" className="text-rel-dark">
                Categoría normativa
              </Label>
              <Select
                value={valores.categoria}
                onValueChange={(v) => set("categoria", v as CategoriaCurso)}
              >
                <SelectTrigger id="d-categoria">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIAS_CURSO.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c} · {ETIQUETA_CATEGORIA[c]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="d-vigencia" className="text-rel-dark">
                Vigencia de la constancia
              </Label>
              <Input
                id="d-vigencia"
                inputMode="numeric"
                value={valores.vigencia_meses}
                onChange={(e) => set("vigencia_meses", e.target.value)}
                placeholder="En meses. Vacío = sin vencimiento"
                aria-invalid={errores.vigencia_meses ? true : undefined}
                aria-describedby={
                  errores.vigencia_meses ? "d-vigencia-error" : "d-vigencia-ayuda"
                }
              />
              {errores.vigencia_meses ? (
                <p id="d-vigencia-error" role="alert" className="text-sm text-rel-danger">
                  {errores.vigencia_meses}
                </p>
              ) : (
                <p id="d-vigencia-ayuda" className="text-sm text-rel-muted">
                  Cuándo caduca lo aprendido, no cuándo caduca el enlace.
                </p>
              )}
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="d-descripcion" className="text-rel-dark">
                Descripción
              </Label>
              <Textarea
                id="d-descripcion"
                rows={3}
                value={valores.descripcion}
                onChange={(e) => set("descripcion", e.target.value)}
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="d-objetivos" className="text-rel-dark">
                Objetivos
              </Label>
              <Textarea
                id="d-objetivos"
                rows={3}
                value={valores.objetivos}
                onChange={(e) => set("objetivos", e.target.value)}
              />
            </div>
          </div>

          <fieldset className="rounded-rel-card border border-rel-border bg-rel-surface-subtle p-4">
            <legend className="px-1 font-rel-heading text-sm font-bold text-rel-dark">
              Datos normativos
            </legend>
            <p className="mb-4 font-rel-body text-sm text-rel-muted">
              Los exige el validador para publicar, y se imprimen en la constancia.
              Se pueden dejar en blanco mientras el curso siga en borrador.
            </p>
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="d-temario" className="text-rel-dark">
                  Temario
                </Label>
                <Textarea
                  id="d-temario"
                  rows={4}
                  value={valores.temario}
                  onChange={(e) => set("temario", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="d-intensidad" className="text-rel-dark">
                  Intensidad horaria (minutos)
                </Label>
                <Input
                  id="d-intensidad"
                  inputMode="numeric"
                  value={valores.intensidad_horaria_min}
                  onChange={(e) => set("intensidad_horaria_min", e.target.value)}
                  aria-invalid={errores.intensidad_horaria_min ? true : undefined}
                  aria-describedby={
                    errores.intensidad_horaria_min ? "d-intensidad-error" : undefined
                  }
                />
                {errores.intensidad_horaria_min ? (
                  <p id="d-intensidad-error" role="alert" className="text-sm text-rel-danger">
                    {errores.intensidad_horaria_min}
                  </p>
                ) : null}
              </div>
              <div className="space-y-2">
                <Label htmlFor="d-responsable" className="text-rel-dark">
                  Responsable del contenido
                </Label>
                <Input
                  id="d-responsable"
                  maxLength={200}
                  value={valores.responsable_contenido}
                  onChange={(e) => set("responsable_contenido", e.target.value)}
                />
              </div>
            </div>
          </fieldset>

          <div className="flex flex-wrap items-center justify-end gap-3">
            {sucio ? (
              <p className="mr-auto font-rel-body text-sm text-rel-warning" role="status">
                Hay cambios sin guardar.
              </p>
            ) : null}
            <Button
              type="button"
              variant="relGhost"
              disabled={!sucio || guardando}
              onClick={() => {
                setValores(original);
                setErrores({});
              }}
            >
              Descartar
            </Button>
            <Button type="submit" variant="rel" disabled={!sucio || guardando}>
              {guardando ? "Guardando…" : "Guardar cambios"}
            </Button>
          </div>
        </form>
    </SeccionPlegable>
  );
}
