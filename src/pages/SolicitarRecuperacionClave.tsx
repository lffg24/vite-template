import { useState } from "react";
import { Mail } from "lucide-react";

import recoverySentIllustration from "@/assets/password-recovery-sent.png";
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
    <PasswordRecoveryShell
      title={submitted ? "Revisa tu correo" : "Recupera tu acceso"}
      description={submitted
        ? "Si existe una cuenta asociada, recibirás un enlace de un solo uso para recuperar el acceso."
        : "Te enviaremos un enlace de un solo uso al correo asociado con tu cuenta."}
      successIllustration={submitted ? recoverySentIllustration : undefined}
    >
      {submitted ? (
        <div className="mt-6 flex items-start gap-3 rounded-xl border border-border bg-surface-subtle p-4 text-left">
          <Mail className="mt-0.5 h-5 w-5 shrink-0 text-brand-primary" aria-hidden="true" />
          <div>
            <p className="text-sm font-bold text-foreground">¿Aún no ves el mensaje?</p>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">Revisa la carpeta de correo no deseado. La entrega puede tardar unos minutos.</p>
          </div>
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
          <Button type="submit" disabled={loading} className="h-14 w-full rounded-2xl bg-gradient-to-r from-primary to-brand-dark text-base font-bold text-primary-foreground">
            {loading ? "Procesando..." : "Enviar enlace seguro"}
          </Button>
        </form>
      )}
    </PasswordRecoveryShell>
  );
}
