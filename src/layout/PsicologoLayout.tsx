// src/layout/PsicologoLayout.tsx
import { Link, Outlet } from "react-router-dom";
import PsicologoSidebar from "@/features/psicosocial/components/PsicologoSidebar";
import { PsicoEmpresaActivaProvider } from "@/features/psicosocial/context/PsicoEmpresaActivaContext";

const resourceLinks = [
  { label: "Manual de uso", to: "/recursos/manual-uso" },
  { label: "Ficha técnica", to: "/recursos/ficha-tecnica" },
  { label: "Seguridad", to: "/recursos/seguridad-cumplimiento" },
  { label: "Alcance y norma", to: "/recursos/certificacion" },
];

export default function PsicologoLayout() {
  return (
    <PsicoEmpresaActivaProvider>
      <div className="flex min-h-screen bg-background">
        <PsicologoSidebar />
        <main className="flex min-w-0 flex-1 flex-col p-6">
          <div className="min-w-0 flex-1">
            <Outlet />
          </div>
          <footer className="mt-8 flex flex-col gap-3 border-t border-border/70 pt-5 text-sm text-muted-foreground lg:flex-row lg:items-center lg:justify-between">
            <span className="font-semibold text-foreground-soft">ABRIL360 · Recursos profesionales y referencias de uso</span>
            <nav className="flex flex-wrap gap-3" aria-label="Recursos profesionales ABRIL360">
              {resourceLinks.map((link) => (
                <Link key={link.to} to={link.to} className="font-bold text-brand-primary hover:text-brand-sky">
                  {link.label}
                </Link>
              ))}
            </nav>
          </footer>
        </main>
      </div>
    </PsicoEmpresaActivaProvider>
  );
}
