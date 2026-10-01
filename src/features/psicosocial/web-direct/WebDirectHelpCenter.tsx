import { Building2, HelpCircle, Mail, Phone, UserRound } from "lucide-react";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

import { useWebDirectSupport } from "./WebDirectSupportContext";

function ContactLink({
  href,
  children,
  icon,
}: {
  href: string;
  children: string;
  icon: "email" | "phone";
}) {
  const Icon = icon === "email" ? Mail : Phone;
  return (
    <a
      href={href}
      className="inline-flex min-h-9 w-fit max-w-full items-center gap-2 break-all rounded-lg px-2 py-1 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
      <span>{children}</span>
    </a>
  );
}

export function WebDirectHelpCenter() {
  const { responsible, company } = useWebDirectSupport();
  const hasResponsibleContact = Boolean(responsible?.email || responsible?.phone);
  const hasCompanyContact = Boolean(company?.email || company?.phone);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="inline-flex min-h-10 items-center gap-2 rounded-full border border-sidebar-active/30 bg-sidebar-active px-3 text-sm font-bold text-sidebar transition-colors hover:bg-sidebar-active/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring sm:px-4"
          aria-label="Abrir centro de ayuda"
        >
          <HelpCircle className="h-[1.125rem] w-[1.125rem]" aria-hidden="true" />
          <span className="hidden sm:inline">¿Necesitas ayuda?</span>
          <span className="sm:hidden">Ayuda</span>
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={10}
        className="w-[min(22rem,calc(100vw-2rem))] rounded-2xl border-border bg-surface p-4 shadow-floating"
      >
        <div>
          <p className="font-heading text-base font-black text-foreground">Centro de ayuda</p>
          <p className="mt-1 text-sm leading-5 text-muted-foreground">
            Comunícate con el profesional o con la empresa responsable de la aplicación.
          </p>
        </div>

        <div className="mt-4 space-y-3">
          {responsible ? (
            <section aria-labelledby="help-professional" className="rounded-xl border border-border bg-surface-subtle p-3">
              <p id="help-professional" className="flex items-center gap-2 text-sm font-bold text-foreground">
                <UserRound className="h-4 w-4 text-primary" aria-hidden="true" />
                {responsible.name || "Profesional responsable"}
              </p>
              <div className="mt-2 flex flex-col gap-1">
                {responsible.email ? <ContactLink href={`mailto:${responsible.email}`} icon="email">{responsible.email}</ContactLink> : null}
                {responsible.phone ? <ContactLink href={`tel:${responsible.phone}`} icon="phone">{responsible.phone}</ContactLink> : null}
                {!hasResponsibleContact ? <p className="px-2 text-xs leading-5 text-muted-foreground">No tiene canales de contacto registrados.</p> : null}
              </div>
            </section>
          ) : null}

          {company ? (
            <section aria-labelledby="help-company" className="rounded-xl border border-border bg-surface-subtle p-3">
              <p id="help-company" className="flex items-center gap-2 text-sm font-bold text-foreground">
                <Building2 className="h-4 w-4 text-info" aria-hidden="true" />
                {company.name || "Empresa"}
              </p>
              <div className="mt-2 flex flex-col gap-1">
                {company.email ? <ContactLink href={`mailto:${company.email}`} icon="email">{company.email}</ContactLink> : null}
                {company.phone ? <ContactLink href={`tel:${company.phone}`} icon="phone">{company.phone}</ContactLink> : null}
                {!hasCompanyContact ? <p className="px-2 text-xs leading-5 text-muted-foreground">No tiene canales de contacto registrados.</p> : null}
              </div>
            </section>
          ) : null}

          {!responsible && !company ? (
            <p className="rounded-xl border border-border bg-surface-subtle p-3 text-sm leading-5 text-muted-foreground">
              No hay información de contacto registrada para esta aplicación.
            </p>
          ) : null}
        </div>
      </PopoverContent>
    </Popover>
  );
}
