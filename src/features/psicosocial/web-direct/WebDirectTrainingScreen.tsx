import type { ReactNode } from "react";
import { ArrowLeft, ArrowRight, Captions, CheckCircle2, PlayCircle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import { WebDirectContentFrame } from "./WebDirectContentFrame";

type WebDirectTrainingScreenProps = {
  formLabel: "Forma A" | "Forma B";
  topics: string[];
  transcript: ReactNode;
  videoSrc?: string | null;
  captionsSrc?: string | null;
  completed: boolean;
  onComplete: () => void;
  onBack: () => void;
  onContinue: () => void;
};

export function WebDirectTrainingScreen({
  formLabel,
  topics,
  transcript,
  videoSrc,
  captionsSrc,
  completed,
  onComplete,
  onBack,
  onContinue,
}: WebDirectTrainingScreenProps) {
  return (
    <WebDirectContentFrame
      stepLabel="Preparación del proceso"
      progress={{ current: 3, total: 6 }}
      eyebrow="Capacitación previa"
      title="Conoce el proceso antes de comenzar"
      description="Revisa este contenido para comprender el propósito de la batería, la forma de respuesta y las condiciones de confidencialidad."
      illustration="psicoWebCapacitacion"
      aside={
        <div className="rounded-2xl border border-border bg-surface p-5">
          <Badge variant="accent" className="normal-case tracking-normal">{formLabel}</Badge>
          <h2 className="mt-3 font-heading text-lg font-bold">En esta capacitación conocerás</h2>
          <ol className="mt-4 space-y-3">
            {topics.map((topic, index) => (
              <li key={topic} className="flex items-center gap-3 text-sm font-semibold">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-accent text-primary">{index + 1}</span>
                {topic}
              </li>
            ))}
          </ol>
        </div>
      }
      actions={
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Button type="button" variant="outline" size="lg" onClick={onBack} className="min-h-12 w-full sm:w-auto">
            <ArrowLeft aria-hidden="true" /> Volver
          </Button>
          <Button type="button" size="lg" onClick={onContinue} disabled={!completed} className="min-h-12 w-full px-6 text-foreground sm:w-auto">
            Continuar al instructivo <ArrowRight aria-hidden="true" />
          </Button>
        </div>
      }
    >
      <div className="overflow-hidden rounded-2xl border border-border bg-sidebar">
        {videoSrc ? (
          <video controls preload="metadata" onEnded={onComplete} className="aspect-video w-full" aria-label={`Capacitación para ${formLabel}`}>
            <source src={videoSrc} />
            {captionsSrc ? <track kind="captions" src={captionsSrc} srcLang="es" label="Español" default /> : null}
            Tu navegador no permite reproducir este video.
          </video>
        ) : (
          <div role="status" className="grid aspect-video place-items-center px-6 text-center text-sidebar-foreground">
            <div>
              <PlayCircle className="mx-auto h-12 w-12 text-sidebar-active" aria-hidden="true" />
              <p className="mt-3 font-heading font-bold">Contenido audiovisual pendiente de configuración</p>
              <p className="mt-1 text-sm text-sidebar-muted">Puedes consultar ahora la alternativa textual accesible.</p>
            </div>
          </div>
        )}
      </div>

      <details className="mt-4 rounded-2xl border border-info/20 bg-info/10 p-4 text-sm leading-6 text-foreground-soft" open={!videoSrc}>
        <summary className="flex cursor-pointer list-none items-center gap-2 font-heading font-bold text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <Captions className="h-5 w-5 text-info" aria-hidden="true" /> Alternativa textual accesible
        </summary>
        <div className="mt-3 border-t border-info/20 pt-3">{transcript}</div>
      </details>

      {!completed ? (
        <Button type="button" variant="tertiary" onClick={onComplete} className="mt-4 min-h-11 w-full sm:w-auto">
          <CheckCircle2 aria-hidden="true" /> Marcar capacitación como revisada
        </Button>
      ) : null}

      <p className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-success" role="status" aria-live="polite">
        <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
        {completed ? "Capacitación registrada como revisada." : "Completa la capacitación para continuar."}
      </p>
    </WebDirectContentFrame>
  );
}
