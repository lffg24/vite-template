// src/features/evaluaciones/CuestionarioNuevoSheet.tsx
//
// Alta de un cuestionario: solo la cabecera.
//
// Las preguntas NO se piden aquí. Un cuestionario se redacta por partes, y
// exigirlas al crear impediría guardar el trabajo a medias — que es justo lo que
// pasa cuando alguien abre el formulario con una idea y lo cierra sin nada. Lo
// que no se puede es publicarlo vacío, y de eso se encarga el checklist.

import { useState } from "react";

import { Button } from "@/components/ui/button";
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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useToast } from "@/hooks/use-toast";
import { crearCuestionario } from "@/services/evaluacionesService";
import { AMBITOS, ETIQUETA_AMBITO, type Ambito } from "@/types/evaluaciones";
import type { ErrorApi } from "@/types/capacitaciones";

export function CuestionarioNuevoSheet({
  abierto,
  alCerrar,
  alCrear,
}: {
  abierto: boolean;
  alCerrar: () => void;
  alCrear: (cuestionarioId: string) => void;
}) {
  const { toast } = useToast();
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [ambito, setAmbito] = useState<Ambito>("SST");
  const [guardando, setGuardando] = useState(false);
  const [errorTitulo, setErrorTitulo] = useState<string | null>(null);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    const limpio = titulo.trim();
    if (limpio === "") {
      setErrorTitulo("La evaluación necesita un título.");
      return;
    }
    setErrorTitulo(null);
    setGuardando(true);
    try {
      const creado = await crearCuestionario({
        titulo: limpio,
        ambito,
        descripcion: descripcion.trim() || null,
      });
      toast({
        title: `Evaluación ${creado.codigo} creada`,
        description: "Ahora escríbele las preguntas.",
      });
      setTitulo("");
      setDescripcion("");
      alCrear(creado.cuestionario_id);
    } catch (e) {
      const err = e as ErrorApi;
      toast({
        variant: "destructive",
        title: "No pudimos crear la evaluación",
        description: err.message,
      });
    } finally {
      setGuardando(false);
    }
  }

  return (
    <Sheet open={abierto} onOpenChange={(v) => !v && alCerrar()}>
      <SheetContent className="rel-scope w-full overflow-y-auto bg-rel-surface font-rel-body sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="font-rel-heading text-rel-dark">
            Nueva evaluación
          </SheetTitle>
          <SheetDescription className="text-rel-muted">
            Vive en el banco y la pueden usar varios cursos. Las preguntas se
            escriben después.
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={enviar} className="mt-6 space-y-5" noValidate>
          <div className="space-y-2">
            <Label htmlFor="c-titulo" className="text-rel-dark">
              Título <span className="text-rel-danger">*</span>
            </Label>
            <Input
              id="c-titulo"
              value={titulo}
              maxLength={250}
              onChange={(e) => setTitulo(e.target.value)}
              aria-invalid={errorTitulo ? true : undefined}
              aria-describedby={errorTitulo ? "c-titulo-error" : undefined}
              autoFocus
            />
            {errorTitulo ? (
              <p id="c-titulo-error" role="alert" className="text-sm text-rel-danger">
                {errorTitulo}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="c-ambito" className="text-rel-dark">
              Ámbito
            </Label>
            <Select value={ambito} onValueChange={(v) => setAmbito(v as Ambito)}>
              <SelectTrigger id="c-ambito">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {AMBITOS.map((a) => (
                  <SelectItem key={a} value={a}>
                    {ETIQUETA_AMBITO[a]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm text-rel-muted">
              Para qué sirve, no de quién es. Es lo que permite encontrarla en un
              banco de dieciocho sin leerlas todas.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="c-descripcion" className="text-rel-dark">
              Descripción
            </Label>
            <Textarea
              id="c-descripcion"
              rows={3}
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
            />
          </div>

          <SheetFooter className="gap-2 sm:gap-2">
            <Button type="button" variant="relGhost" onClick={alCerrar} disabled={guardando}>
              Cancelar
            </Button>
            <Button type="submit" variant="rel" disabled={guardando}>
              {guardando ? "Creando…" : "Crear evaluación"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
