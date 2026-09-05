// src/features/capacitaciones/components/PanelPublicacion.tsx · A-05
//
// El checklist se pinta con `faltantes`, que el detalle ya trae calculado por
// el servidor. Eso es lo que evita el patrón «pulsa Publicar y lee el error»:
// lo que impide publicar está a la vista desde que se abre el curso, y el botón
// solo se habilita cuando la lista está vacía.
//
// Aun así se maneja el 422: entre que la pantalla se cargó y alguien pulsa,
// otra pestaña pudo borrar la última lección. El servidor es quien decide.

import { useState } from "react";
import { CheckCircle2, CircleDashed, Lock } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { useToast } from "@/hooks/use-toast";
import { publicarCurso } from "@/services/capacitacionesService";
import type { CursoCabecera, ErrorApi } from "@/types/capacitaciones";

export function PanelPublicacion({
  curso,
  faltantes,
  puedePublicar,
  alPublicar,
}: {
  curso: CursoCabecera;
  faltantes: string[];
  /** Permiso del actor. Distinto de «el curso está completo». */
  puedePublicar: boolean;
  alPublicar: () => Promise<void> | void;
}) {
  const { toast } = useToast();
  const [confirmando, setConfirmando] = useState(false);
  const [publicando, setPublicando] = useState(false);
  const [faltantesServidor, setFaltantesServidor] = useState<string[] | null>(null);

  // La lista del servidor gana sobre la de la pantalla: si un 422 dijo que
  // falta algo, el boton tiene que quedar inhabilitado aunque el detalle que se
  // cargo hace un minuto dijera que estaba completo. Derivar `completo` de la
  // prop dejaria el boton activo para volver a fallar igual.
  const lista = faltantesServidor ?? faltantes;
  const completo = lista.length === 0;

  async function confirmar() {
    setPublicando(true);
    try {
      const version = await publicarCurso(curso.id);
      setFaltantesServidor(null);
      setConfirmando(false);
      toast({
        title: `Versión ${version.numero} publicada`,
        description:
          "Queda congelada e inmutable. Ya se puede asignar; editar el curso a partir de ahora no la modifica.",
      });
      await alPublicar();
    } catch (e) {
      const err = e as ErrorApi;
      if (err.status === 422 && err.faltantes) {
        // El estado cambió bajo los pies. Se muestra la lista del servidor, que
        // es la que manda, en vez de insistir con la que la pantalla tenía.
        setFaltantesServidor(err.faltantes);
        setConfirmando(false);
        toast({
          variant: "destructive",
          title: "El curso ya no está completo",
          description: "Alguien más lo modificó. Abajo está lo que falta ahora.",
        });
      } else {
        toast({
          variant: "destructive",
          title: "No pudimos publicar",
          description: err.message,
        });
      }
      await alPublicar();
    } finally {
      setPublicando(false);
    }
  }

  return (
    <Card className="rounded-rel-panel border-rel-border bg-rel-surface">
      <CardHeader>
        <CardTitle className="font-rel-heading text-lg text-rel-dark">
          Publicación
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {curso.estado === "PUBLICADO" ? (
          <p className="font-rel-body text-sm text-rel-muted">
            La versión vigente es la <strong className="text-rel-dark">v{curso.version_actual}</strong>.
            Publicar de nuevo congela una versión más; la anterior sigue existiendo
            para quien ya la estaba cursando.
          </p>
        ) : null}

        {completo ? (
          <div className="flex items-start gap-3 rounded-rel-card bg-rel-success-subtle p-4">
            <CheckCircle2
              className="mt-0.5 h-5 w-5 shrink-0 text-rel-success"
              aria-hidden="true"
            />
            <p className="font-rel-body text-sm text-rel-dark">
              El curso cumple todo lo que exige el validador normativo. Se puede
              publicar.
            </p>
          </div>
        ) : (
          <div>
            <h3 className="font-rel-heading text-sm font-bold text-rel-dark">
              Falta para poder publicar
            </h3>
            <ul className="mt-3 space-y-2">
              {lista.map((f) => (
                <li key={f} className="flex items-start gap-2.5 font-rel-body text-sm">
                  <CircleDashed
                    className="mt-0.5 h-4 w-4 shrink-0 text-rel-warning"
                    aria-hidden="true"
                  />
                  <span className="text-rel-dark">{f}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {!puedePublicar ? (
          <p className="flex items-start gap-2 rounded-rel-card bg-rel-surface-subtle p-3 font-rel-body text-sm text-rel-muted">
            <Lock className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            Tu rol permite redactar, pero no publicar. Publicar es un acto
            editorial separado a propósito.
          </p>
        ) : null}

        <div className="flex justify-end">
          <Button
            variant="rel"
            disabled={!completo || !puedePublicar || publicando}
            onClick={() => setConfirmando(true)}
          >
            Publicar versión {curso.version_actual + 1}
          </Button>
        </div>
      </CardContent>

      <AlertDialog open={confirmando} onOpenChange={(v) => !v && setConfirmando(false)}>
        <AlertDialogContent className="rel-scope font-rel-body">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-rel-heading text-rel-dark">
              ¿Publicar la versión {curso.version_actual + 1}?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-rel-muted">
              La versión queda congelada e inmutable: es lo que da valor probatorio
              a las constancias que se emitan con ella. No se puede editar ni
              borrar después, solo publicar una versión nueva.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={publicando}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-rel-primary text-rel-primary-foreground hover:bg-rel-primary/90"
              onClick={(e) => {
                e.preventDefault();
                void confirmar();
              }}
              disabled={publicando}
            >
              {publicando ? "Publicando…" : "Publicar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
