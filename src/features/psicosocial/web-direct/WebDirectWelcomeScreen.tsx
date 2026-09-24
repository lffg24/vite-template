import { ArrowRight, Clock3, LockKeyhole, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Illustration } from "@/shared/ui/illustration";

import type { WebDirectApplicationContext } from "./types";
import { WebDirectParticipantShell } from "./WebDirectParticipantShell";
import { WebDirectResponsibleContact } from "./WebDirectResponsibleContact";

type WebDirectWelcomeScreenProps = {
  context: WebDirectApplicationContext;
  onStart: () => void;
};

export function WebDirectWelcomeScreen({ context, onStart }: WebDirectWelcomeScreenProps) {
  return (
    <WebDirectParticipantShell stepLabel="Inicio del proceso">
      <Card className="overflow-hidden rounded-[1.5rem] border-border bg-surface shadow-soft sm:rounded-[2rem]">
        <div className="grid lg:grid-cols-[minmax(0,1.05fr)_minmax(22rem,0.95fr)]">
          <div className="flex flex-col p-6 sm:p-9 lg:p-12">
            <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-primary">Batería de riesgo psicosocial</p>
            <h1 className="mt-3 text-balance font-heading text-3xl font-black leading-tight text-foreground sm:text-4xl lg:text-5xl">
              Bienvenido a tu proceso de evaluación
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
              {context.companyName} te invita a diligenciar los instrumentos de la batería desde un espacio seguro y confidencial.
            </p>
            {context.applicationName ? (
              <p className="mt-2 text-sm font-semibold text-foreground-soft">Aplicación: {context.applicationName}</p>
            ) : null}

            <Illustration
              name="psicoWebBienvenida"
              variant="hero"
              size="full"
              priority
              className="mx-auto mt-5 max-h-52 max-w-sm lg:hidden"
            />

            <div className="mt-7 grid gap-3 sm:grid-cols-2">
              <div className="flex gap-3 rounded-2xl bg-accent p-4 text-sm leading-6 text-accent-foreground">
                <LockKeyhole className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
                <p><strong className="block font-heading">Información confidencial</strong> Tus respuestas solo estarán disponibles para el profesional autorizado.</p>
              </div>
              <div className="flex gap-3 rounded-2xl bg-surface-subtle p-4 text-sm leading-6 text-foreground-soft">
                <Clock3 className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
                <p><strong className="block font-heading text-foreground">Prepárate con calma</strong> Reserva un espacio tranquilo y tiempo suficiente para completar el proceso.</p>
              </div>
            </div>

            <div className="mt-7 flex flex-col gap-4 sm:flex-row sm:items-center">
              <Button type="button" size="lg" onClick={onStart} className="min-h-12 w-full px-6 text-foreground sm:w-auto">
                Comenzar <ArrowRight aria-hidden="true" />
              </Button>
              <span className="inline-flex items-center justify-center gap-2 text-xs font-semibold text-success sm:justify-start">
                <ShieldCheck className="h-4 w-4" aria-hidden="true" /> Acceso protegido por aplicación
              </span>
            </div>
          </div>

          <aside className="flex flex-col justify-between border-t border-border bg-surface-subtle/70 p-6 sm:p-8 lg:border-l lg:border-t-0 lg:p-10">
            <Illustration
              name="psicoWebBienvenida"
              variant="hero"
              size="full"
              priority
              className="mx-auto hidden max-h-[22rem] max-w-lg lg:block"
            />
            <div className="mt-5">
              <WebDirectResponsibleContact responsible={context.responsible} />
            </div>
          </aside>
        </div>
      </Card>
    </WebDirectParticipantShell>
  );
}
