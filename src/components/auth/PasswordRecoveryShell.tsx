import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, CheckCircle2, LockKeyhole, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import evaLogoColor from "@/assets/eva-logo-color.png";

type PasswordRecoveryShellProps = {
  title: string;
  description: string;
  children: ReactNode;
  successIllustration?: string;
};

export function PasswordRecoveryShell({ title, description, children, successIllustration }: PasswordRecoveryShellProps) {
  const illustrated = Boolean(successIllustration);

  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden bg-background px-4 py-8 text-foreground sm:py-12">
      <div className="pointer-events-none absolute -right-24 -top-36 h-[360px] w-[360px] rounded-full bg-brand-primary/10 blur-3xl" aria-hidden="true" />
      <div className="pointer-events-none absolute bottom-0 left-1/4 h-64 w-64 rounded-full bg-brand-turquoise/15 blur-3xl" aria-hidden="true" />
      <Card className={`relative w-full border-border/70 bg-card p-6 shadow-card sm:p-9 ${illustrated ? "max-w-3xl rounded-2xl" : "max-w-lg rounded-[2rem]"}`}>
        {illustrated ? (
          <>
            <div className="flex items-center justify-between gap-4 border-b border-border/70 pb-5">
              <div className="flex items-center gap-3">
                <img src={evaLogoColor} alt="" className="h-9 w-9 object-contain" />
                <span className="font-heading text-sm font-bold tracking-wide text-brand-dark">ABRIL360</span>
              </div>
              <span className="inline-flex items-center gap-2 text-xs font-semibold text-success">
                <ShieldCheck className="h-4 w-4" aria-hidden="true" /> Acceso seguro
              </span>
            </div>
            <div role="status" aria-live="polite" className="grid items-center gap-4 py-6 text-center md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] md:gap-8 md:py-8 md:text-left">
              <img src={successIllustration} alt="" aria-hidden="true" className="mx-auto w-full max-w-56 object-contain sm:max-w-64 md:max-w-none" />
              <div>
                <p className="inline-flex items-center gap-2 rounded-full bg-accent px-3 py-1.5 text-xs font-bold text-accent-foreground">
                  <CheckCircle2 className="h-4 w-4" aria-hidden="true" /> Solicitud recibida
                </p>
                <h1 className="mt-4 font-heading text-3xl font-bold tracking-tight text-foreground sm:text-4xl">{title}</h1>
                <p className="mt-3 text-sm leading-6 text-muted-foreground sm:text-base">{description}</p>
                {children}
              </div>
            </div>
          </>
        ) : (
          <div className="mb-7 text-center">
            <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-accent">
              <img src={evaLogoColor} alt="EVA 360" className="h-12 w-12 object-contain" />
            </div>
            <h1 className="text-3xl font-black tracking-tight"><span className="marker-highlight">{title.split(" ").slice(0, 1).join(" ")}</span>{title.includes(" ") ? ` ${title.split(" ").slice(1).join(" ")}` : ""}</h1>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
          </div>
        )}
        {!illustrated ? children : null}
        <div className={`flex gap-4 border-t border-border/70 pt-5 ${illustrated ? "flex-col-reverse sm:flex-row sm:items-center sm:justify-between" : "mt-6 items-center justify-between"}`}>
          {illustrated ? (
            <Button asChild className="w-full sm:w-auto">
              <Link to="/login"><ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" /> Volver al inicio de sesión</Link>
            </Button>
          ) : (
            <Link to="/login" className="inline-flex items-center gap-2 rounded-sm text-sm font-bold text-brand-primary hover:text-brand-sky focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
              <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Volver al login
            </Link>
          )}
          {illustrated ? null : (
            <span className="inline-flex items-center gap-2 text-xs font-semibold text-success">
              <ShieldCheck className="h-4 w-4" aria-hidden="true" /> Enlace seguro
            </span>
          )}
          <div className={`flex items-center gap-2 text-xs leading-5 text-muted-foreground ${illustrated ? "" : "hidden"}`}>
            <LockKeyhole className="h-4 w-4 shrink-0" aria-hidden="true" /> ABRIL360 nunca te solicitará tu contraseña por correo.
          </div>
        </div>
        {!illustrated ? (
          <div className="mt-4 flex items-center gap-2 rounded-2xl bg-surface-subtle px-4 py-3 text-xs leading-5 text-muted-foreground">
            <LockKeyhole className="h-4 w-4 shrink-0" aria-hidden="true" /> ABRIL360 nunca te solicitará tu contraseña por correo.
          </div>
        ) : null}
      </Card>
    </main>
  );
}
