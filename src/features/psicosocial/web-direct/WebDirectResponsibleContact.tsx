import { Mail, Phone, UserRound } from "lucide-react";

import type { WebDirectResponsible } from "./types";

export function WebDirectResponsibleContact({ responsible }: { responsible?: WebDirectResponsible | null }) {
  if (!responsible) return null;

  return (
    <section aria-labelledby="responsable-title" className="rounded-2xl border border-border bg-surface-subtle p-4 sm:p-5">
      <p id="responsable-title" className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">
        Psicólogo responsable
      </p>
      <p className="mt-2 flex items-center gap-2 font-heading text-sm font-bold text-foreground sm:text-base">
        <UserRound className="h-4 w-4 text-primary" aria-hidden="true" /> {responsible.name}
      </p>
      <div className="mt-2 flex flex-col gap-1.5 text-sm text-muted-foreground">
        {responsible.email ? (
          <a className="inline-flex w-fit items-center gap-2 rounded-sm hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" href={`mailto:${responsible.email}`}>
            <Mail className="h-4 w-4" aria-hidden="true" /> {responsible.email}
          </a>
        ) : null}
        {responsible.phone ? (
          <a className="inline-flex w-fit items-center gap-2 rounded-sm hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" href={`tel:${responsible.phone}`}>
            <Phone className="h-4 w-4" aria-hidden="true" /> {responsible.phone}
          </a>
        ) : null}
      </div>
    </section>
  );
}
