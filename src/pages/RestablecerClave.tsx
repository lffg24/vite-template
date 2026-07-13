import { useEffect, useState } from "react";
import { CheckCircle2, Eye, EyeOff, LockKeyhole } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";

import { PasswordRecoveryShell } from "@/components/auth/PasswordRecoveryShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { confirmPasswordReset } from "@/features/auth/passwordResetService";

function validPassword(value: string) {
  return value.length >= 12 && value.length <= 128;
}

export default function RestablecerClave() {
  const [searchParams] = useSearchParams();
  const [token] = useState(() => searchParams.get("token") || "");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [visible, setVisible] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    if (token && typeof window !== "undefined") window.history.replaceState({}, "", "/restablecer-clave");
  }, [token]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!validPassword(password)) {
      setError("Usa una contraseña o frase de entre 12 y 128 caracteres.");
      return;
    }
    if (password !== confirmation) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await confirmPasswordReset({ token, newPassword: password, confirmPassword: confirmation });
      setCompleted(true);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "El enlace no es válido o expiró.");
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return <PasswordRecoveryShell title="Enlace no válido" description="El enlace de recuperación está incompleto o ya no está disponible."><Link to="/recuperar-clave" className="block rounded-2xl bg-violet-600 px-5 py-4 text-center font-bold text-white">Solicitar un nuevo enlace</Link></PasswordRecoveryShell>;
  }

  return (
    <PasswordRecoveryShell title="Crea una nueva contraseña" description="El enlace es de un solo uso. Al completar el cambio, las sesiones anteriores quedarán cerradas.">
      {completed ? (
        <div role="status" className="rounded-3xl border border-emerald-100 bg-emerald-50 p-5 text-emerald-900">
          <CheckCircle2 className="mb-3 h-7 w-7" />
          <p className="font-black">Contraseña actualizada</p>
          <p className="mt-2 text-sm leading-6">Ya puedes iniciar sesión con tu nueva contraseña.</p>
          <Link to="/login" className="mt-4 block rounded-2xl bg-emerald-700 px-4 py-3 text-center font-bold text-white">Ir al login</Link>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4" noValidate>
          {[
            { id: "new-password", label: "Nueva contraseña", value: password, setter: setPassword, autocomplete: "new-password" },
            { id: "confirm-password", label: "Confirmar contraseña", value: confirmation, setter: setConfirmation, autocomplete: "new-password" },
          ].map((field) => (
            <div key={field.id} className="space-y-2">
              <Label htmlFor={field.id} className="font-bold">{field.label}</Label>
              <div className="relative">
                <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <Input id={field.id} type={visible ? "text" : "password"} autoComplete={field.autocomplete} value={field.value} onChange={(event) => field.setter(event.target.value)} className="h-14 rounded-2xl pl-12 pr-12 text-base" />
                <button type="button" onClick={() => setVisible((current) => !current)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" aria-label={visible ? "Ocultar contraseñas" : "Mostrar contraseñas"}>{visible ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}</button>
              </div>
            </div>
          ))}
          <p className="text-xs leading-5 text-slate-500">Usa entre 12 y 128 caracteres. Puedes utilizar espacios y una frase larga fácil de recordar.</p>
          {error ? <p role="alert" className="text-sm text-rose-600">{error}</p> : null}
          <Button type="submit" disabled={loading} className="h-14 w-full rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 text-base font-bold">{loading ? "Actualizando..." : "Actualizar contraseña"}</Button>
        </form>
      )}
    </PasswordRecoveryShell>
  );
}
