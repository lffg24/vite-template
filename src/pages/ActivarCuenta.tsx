import { useEffect, useState, type FormEvent } from "react";
import { CheckCircle2, LockKeyhole } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import AbrilWordmark from "@/components/brand/AbrilWordmark";
import { API_URL } from "@/lib/config";

export default function ActivarCuenta() {
  const [query] = useSearchParams();
  const [token] = useState(() => query.get("token") ?? "");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => { if (token) window.history.replaceState({}, "", "/activar-cuenta"); }, [token]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!token) { setError("El enlace de invitación está incompleto."); return; }
    if (password.length < 12 || password.length > 128 || password !== confirmation) {
      setError("Usa una contraseña de 12 a 128 caracteres y confirma el mismo valor."); return;
    }
    setBusy(true); setError("");
    try {
      const response = await fetch(`${API_URL}/auth/invitaciones/aceptar`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, new_password: password, confirm_password: confirmation }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(typeof data.detail === "string" ? data.detail : "No pudimos activar la cuenta.");
      }
      setDone(true); setPassword(""); setConfirmation("");
    } catch (caught) { setError(caught instanceof Error ? caught.message : "No pudimos activar la cuenta."); }
    finally { setBusy(false); }
  }

  return <main className="rel-scope grid min-h-screen place-items-center bg-rel-canvas px-4 py-10 font-rel-body text-rel-dark">
    <section className="w-full max-w-md rounded-rel-card border border-rel-border bg-rel-surface p-6 shadow-sm sm:p-8">
      <AbrilWordmark className="font-rel-heading text-2xl font-black" accentClassName="text-rel-primary" />
      {done ? <div role="status" className="mt-8"><CheckCircle2 className="h-10 w-10 text-rel-success" /><h1 className="mt-4 font-rel-heading text-2xl font-bold">Tu cuenta está lista</h1><p className="mt-2 text-sm text-rel-muted">Ya puedes ingresar con tu correo y la contraseña que acabas de crear.</p><Link to="/login" className="mt-6 inline-flex rounded-rel-control bg-rel-primary px-5 py-3 font-semibold text-white focus-visible:ring-2 focus-visible:ring-rel-primary">Iniciar sesión</Link></div>
      : <><h1 className="mt-8 font-rel-heading text-2xl font-bold">Activa tu cuenta</h1><p className="mt-2 text-sm text-rel-muted">Crea una contraseña personal para comenzar.</p>
        {!token ? <p role="alert" className="mt-6 rounded-rel-control bg-rel-warning-subtle p-4 text-sm">El enlace de invitación está incompleto. Solicita una invitación nueva a quien administra tu cuenta.</p>
        : <form onSubmit={submit} className="mt-6 space-y-5"><div className="space-y-2"><Label htmlFor="activation-password">Contraseña</Label><div className="relative"><LockKeyhole className="absolute left-3 top-3 h-5 w-5 text-rel-muted" aria-hidden="true" /><Input id="activation-password" type="password" autoComplete="new-password" required minLength={12} maxLength={128} value={password} onChange={event => setPassword(event.target.value)} className="pl-10" /></div></div><div className="space-y-2"><Label htmlFor="activation-confirm">Confirmar contraseña</Label><Input id="activation-confirm" type="password" autoComplete="new-password" required value={confirmation} onChange={event => setConfirmation(event.target.value)} /></div>{error && <p role="alert" className="text-sm text-rel-danger">{error}</p>}<Button variant="rel" type="submit" disabled={busy} className="w-full">{busy ? "Activando…" : "Activar cuenta"}</Button></form>}
      </>}
    </section>
  </main>;
}
