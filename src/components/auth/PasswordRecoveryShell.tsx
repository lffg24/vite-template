import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, LockKeyhole, ShieldCheck } from "lucide-react";

import { Card } from "@/components/ui/card";
import evaLogoColor from "@/assets/eva-logo-color.png";

export function PasswordRecoveryShell({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden bg-[#f4f6ff] px-4 py-10 text-slate-950">
      <div className="pointer-events-none absolute -right-24 -top-36 h-[360px] w-[360px] rounded-full bg-violet-100/80 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 left-1/4 h-64 w-64 rounded-full bg-cyan-100/70 blur-3xl" />
      <Card className="relative w-full max-w-lg rounded-[2rem] border-white/70 bg-white/95 p-6 shadow-2xl shadow-violet-950/10 backdrop-blur sm:p-9">
        <div className="mb-7 text-center">
          <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-violet-50">
            <img src={evaLogoColor} alt="EVA 360" className="h-12 w-12 object-contain" />
          </div>
          <h1 className="text-3xl font-black tracking-tight">{title}</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
        </div>
        {children}
        <div className="mt-6 flex items-center justify-between gap-4 border-t border-slate-100 pt-5">
          <Link to="/login" className="inline-flex items-center gap-2 text-sm font-bold text-violet-700 hover:text-violet-900">
            <ArrowLeft className="h-4 w-4" /> Volver al login
          </Link>
          <span className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-700">
            <ShieldCheck className="h-4 w-4" /> Enlace seguro
          </span>
        </div>
        <div className="mt-4 flex items-center gap-2 rounded-2xl bg-slate-50 px-4 py-3 text-xs leading-5 text-slate-500">
          <LockKeyhole className="h-4 w-4 shrink-0" /> ABRIL360 nunca te solicitará tu contraseña por correo.
        </div>
      </Card>
    </main>
  );
}
