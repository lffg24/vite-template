import { useState } from "react";
import { CheckCircle2, Mail } from "lucide-react";

import { PasswordRecoveryShell } from "@/components/auth/PasswordRecoveryShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { requestPasswordReset } from "@/features/auth/passwordResetService";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function SolicitarRecuperacionClave() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const normalized = email.trim().toLowerCase();
    if (!emailRegex.test(normalized)) {
      setError("Ingresa un correo electrónico válido.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await requestPasswordReset(normalized);
      setSubmitted(true);
    } catch {
      setError("No fue posible procesar la solicitud. Inténtalo de nuevo más tarde.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <PasswordRecoveryShell title="Recupera tu acceso" description="Te enviaremos un enlace de un solo uso al correo asociado con tu cuenta.">
      {submitted ? (
        <div role="status" className="rounded-3xl border border-emerald-100 bg-emerald-50 p-5 text-emerald-900">
          <CheckCircle2 className="mb-3 h-7 w-7" />
          <p className="font-black">Revisa tu correo</p>
          <p className="mt-2 text-sm leading-6">Si existe una cuenta asociada, recibirás instrucciones para recuperar el acceso. Revisa también la carpeta de correo no deseado.</p>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-5" noValidate>
          <div className="space-y-2">
            <Label htmlFor="recovery-email" className="font-bold">Correo electrónico</Label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <Input id="recovery-email" type="email" autoComplete="email" autoCapitalize="none" spellCheck={false} value={email} onChange={(event) => setEmail(event.target.value)} className="h-14 rounded-2xl pl-12 text-base" />
            </div>
            {error ? <p role="alert" className="text-sm text-rose-600">{error}</p> : null}
          </div>
          <Button type="submit" disabled={loading} className="h-14 w-full rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 text-base font-bold">
            {loading ? "Procesando..." : "Enviar enlace seguro"}
          </Button>
        </form>
      )}
    </PasswordRecoveryShell>
  );
}
