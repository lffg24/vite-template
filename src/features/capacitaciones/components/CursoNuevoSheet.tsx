// src/features/capacitaciones/components/CursoNuevoSheet.tsx
//
// Creación de curso. Sheet y no modal (constitución §18: «evitar formularios
// enormes en un modal»), y solo con lo mínimo para abrir el borrador.
//
// Los tres datos normativos —temario, intensidad horaria y responsable del
// contenido— NO se piden aquí aunque el backend los acepte. Un borrador se
// redacta por partes, y exigirlos en la creación obligaría a tener escrito el
// temario antes de poder nombrar el curso. El validador de publicación es quien
// los exige, y A-05 los muestra como checklist.

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
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
import { crearCurso } from "@/services/capacitacionesService";
import type { CategoriaCurso, ErrorApi } from "@/types/capacitaciones";
import { CATEGORIAS_CURSO, ETIQUETA_CATEGORIA } from "@/types/capacitaciones";

export function CursoNuevoSheet({
  abierto,
  alCerrar,
  alCrear,
}: {
  abierto: boolean;
  alCerrar: () => void;
  alCrear: (cursoId: string) => void;
}) {
  const { toast } = useToast();
  const [titulo, setTitulo] = useState("");
  const [categoria, setCategoria] = useState<CategoriaCurso>("SST");
  const [descripcion, setDescripcion] = useState("");
  const [restringida, setRestringida] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [errorTitulo, setErrorTitulo] = useState<string | null>(null);

  function reiniciar() {
    setTitulo("");
    setCategoria("SST");
    setDescripcion("");
    setRestringida(false);
    setErrorTitulo(null);
  }

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    const limpio = titulo.trim();
    if (!limpio) {
      // Error inline y junto al campo (§18), no un toast que desaparece.
      setErrorTitulo("El curso necesita un título para poder abrirlo.");
      return;
    }
    setErrorTitulo(null);
    setGuardando(true);
    try {
      const { curso_id } = await crearCurso({
        titulo: limpio,
        categoria,
        descripcion: descripcion.trim() || null,
        categoria_restringida: restringida,
      });
      toast({
        title: "Curso creado",
        description: "Está en borrador. Agrega las lecciones y los datos normativos para publicarlo.",
      });
      reiniciar();
      alCrear(curso_id);
    } catch (e) {
      const err = e as ErrorApi;
      // Los valores se conservan (§18): el formulario sigue lleno tras el error.
      toast({
        variant: "destructive",
        title: "No pudimos crear el curso",
        description: err.message,
      });
    } finally {
      setGuardando(false);
    }
  }

  return (
    <Sheet
      open={abierto}
      onOpenChange={(v) => {
        if (!v) alCerrar();
      }}
    >
      <SheetContent className="rel-scope w-full overflow-y-auto bg-rel-surface font-rel-body sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="font-rel-heading text-rel-dark">Nuevo curso</SheetTitle>
          <SheetDescription className="text-rel-muted">
            Se crea en borrador. Los datos normativos y las lecciones se agregan
            después; nada se publica hasta que estén completos.
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={enviar} className="mt-6 space-y-5" noValidate>
          <div className="space-y-2">
            <Label htmlFor="curso-titulo" className="text-rel-dark">
              Título <span className="text-rel-danger">*</span>
            </Label>
            <Input
              id="curso-titulo"
              value={titulo}
              maxLength={250}
              onChange={(e) => setTitulo(e.target.value)}
              aria-invalid={errorTitulo ? true : undefined}
              aria-describedby={errorTitulo ? "curso-titulo-error" : undefined}
              autoFocus
            />
            {errorTitulo ? (
              <p id="curso-titulo-error" role="alert" className="text-sm text-rel-danger">
                {errorTitulo}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="curso-categoria" className="text-rel-dark">
              Categoría normativa
            </Label>
            <Select value={categoria} onValueChange={(v) => setCategoria(v as CategoriaCurso)}>
              <SelectTrigger id="curso-categoria">
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
            <Label htmlFor="curso-descripcion" className="text-rel-dark">
              Descripción
            </Label>
            <Textarea
              id="curso-descripcion"
              rows={3}
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
            />
          </div>

          <div className="rounded-rel-card border border-rel-border bg-rel-surface-subtle p-4">
            <div className="flex items-start gap-3">
              <Checkbox
                id="curso-restringida"
                checked={restringida}
                onCheckedChange={(v) => setRestringida(v === true)}
                className="mt-0.5"
              />
              <div className="min-w-0">
                <Label htmlFor="curso-restringida" className="text-rel-dark">
                  Categoría restringida
                </Label>
                <p className="mt-1 text-sm text-rel-muted">
                  Solo puede dictarlo un proveedor autorizado. La marca viaja
                  congelada dentro de cada versión publicada, así que{" "}
                  <strong className="font-semibold text-rel-dark">
                    no se puede cambiar después de publicar
                  </strong>
                  : las constancias ya emitidas seguirían diciendo lo que decía la
                  versión con la que se dictaron.
                </p>
              </div>
            </div>
          </div>

          <SheetFooter className="gap-2 sm:gap-2">
            <Button type="button" variant="relGhost" onClick={alCerrar} disabled={guardando}>
              Cancelar
            </Button>
            <Button type="submit" variant="rel" disabled={guardando}>
              {guardando ? "Creando…" : "Crear borrador"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
