import { useEffect, useState } from "react";
import { LockKeyhole } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";

import { PasswordRecoveryShell } from "@/components/auth/PasswordRecoveryShell";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Aviso } from "@/shared/ui/Aviso";
import { EntradaClave } from "@/shared/ui/EntradaClave";
import { confirmPasswordReset } from "@/features/auth/passwordResetService";
import { ALTO_CONTROL } from "@/shared/ui/controles";

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
    return <PasswordRecoveryShell title="Enlace no válido" description="El enlace de recuperación está incompleto o ya no está disponible." escena="link-fallido"><Link viewTransition to="/recuperar-clave" className="block rounded-rel-panel bg-primary px-5 py-4 text-center font-bold text-primary-foreground">Solicitar un nuevo enlace</Link></PasswordRecoveryShell>;
  }

  return (
    <PasswordRecoveryShell title="Crea una nueva contraseña" description="El enlace es de un solo uso. Al completar el cambio, las sesiones anteriores quedarán cerradas." escena="cambio-contrasena">
      {completed ? (
        <Aviso
          tono="exito"
          titulo="Contraseña actualizada"
          acciones={
            <Button asChild variant="outline" size="sm">
              <Link viewTransition to="/login">Ir al login</Link>
            </Button>
          }
        >
          Ya puedes iniciar sesión con tu nueva contraseña.
        </Aviso>
      ) : (
        <form onSubmit={submit} className="space-y-4" noValidate>
          {[
            { id: "new-password", label: "Nueva contraseña", value: password, setter: setPassword, autocomplete: "new-password" },
            { id: "confirm-password", label: "Confirmar contraseña", value: confirmation, setter: setConfirmation, autocomplete: "new-password" },
          ].map((field) => (
            <div key={field.id} className="space-y-2">
              <Label htmlFor={field.id} className="font-bold">{field.label}</Label>
              {/* La visibilidad es UNA para los dos campos, y a propósito: son la
                  contraseña y su confirmación, y verlas juntas es lo que permite
                  cotejarlas. Antes salía así por compartir una variable; ahora
                  se dice con `visible` / `alAlternar`, que es lo que hace que
                  el botón se anuncie en plural. */}
              <EntradaClave
                id={field.id}
                icono={LockKeyhole}
                autoComplete={field.autocomplete}
                value={field.value}
                visible={visible}
                alAlternar={() => setVisible((current) => !current)}
                onChange={(event) => field.setter(event.target.value)}
                className={`${ALTO_CONTROL.entrada} rounded-rel-control text-base`}
              />
            </div>
          ))}
          <p className="text-xs leading-5 text-muted-foreground">Usa entre 12 y 128 caracteres. Puedes utilizar espacios y una frase larga fácil de recordar.</p>
          {error ? <p role="alert" className="text-sm font-semibold text-danger">{error}</p> : null}
          <Button type="submit" disabled={loading} className={`${ALTO_CONTROL.entrada} w-full rounded-rel-control bg-marca text-base font-bold text-primary-foreground`}>{loading ? "Actualizando..." : "Actualizar contraseña"}</Button>
        </form>
      )}
    </PasswordRecoveryShell>
  );
}
