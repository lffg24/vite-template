import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowRight,
  BarChart3,
  BrainCircuit,
  CheckCircle2,
  HeartPulse,
  LockKeyhole,
  Mail,
  ShieldCheck,
  Sparkles,
  UsersRound,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { EntradaClave } from "@/shared/ui/EntradaClave";
import { Pill } from "@/shared/ui/Pill";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Marca } from "@/components/brand/Marca";
import { ALTO_CONTROL } from "@/shared/ui/controles";
import { Casilla } from "@/shared/ui/Casilla";

type FieldErrors = { email?: string; password?: string };
type LoginLocationState = { from?: string } | null;

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const REL_LOGO_URL = "https://relconsilium.com/wp-content/uploads/2026/02/Logo-REL-Consilium-1.png";

const productCards = [
  { icon: UsersRound, title: "Evaluaciones", text: "360° · 180° · 90°" },
  { icon: ShieldCheck, title: "Seguridad laboral", text: "SG-SST" },
  { icon: BrainCircuit, title: "Riesgo psicosocial", text: "Formas A y B" },
  { icon: HeartPulse, title: "Bienestar laboral", text: "Programas" },
  { icon: BarChart3, title: "Reportes", text: "Inteligentes" },
  { icon: Sparkles, title: "NeuroMapa", text: "Análisis explicable" },
];

export default function Login() {
  const { initialized, isAuthenticated, passwordChangeRequired, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  const fromState = (location.state as LoginLocationState)?.from;
  const fromQuery = searchParams.get("next") || undefined;
  const from = fromState || fromQuery;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState<boolean>(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [relLogoError, setRelLogoError] = useState(false);

  if (!initialized) {
    return (
      <div className="grid h-screen place-items-center overflow-hidden bg-sidebar px-4 text-sm text-sidebar-foreground">
        <div className="flex items-center gap-3 rounded-rel-panel border border-sidebar-border bg-sidebar-hover px-5 py-4 shadow-rel-floating backdrop-blur">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-brand-turquoise border-t-transparent" />
          Validando sesión segura...
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return passwordChangeRequired
      ? <Navigate to="/psicosocial/perfil?forcePassword=1" replace />
      : <Navigate to="/" replace state={{ from }} />;
  }

  const validate = (): boolean => {
    const next: FieldErrors = {};
    if (!email.trim()) next.email = "El correo electrónico es obligatorio.";
    else if (!emailRegex.test(email.trim())) next.email = "Ingresa un correo electrónico válido.";
    if (!password) next.password = "La contraseña es obligatoria.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const result = await login(email.trim(), password, { remember });
      navigate(result.passwordChangeRequired ? "/psicosocial/perfil?forcePassword=1" : "/", {
        replace: true,
        state: result.passwordChangeRequired ? undefined : { from },
      });
    } catch (err: any) {
      const status = err?.status as number | undefined;
      const msg = typeof err?.message === "string" ? err.message : "No pudimos iniciar sesión.";

      if (status === 401) {
        setErrors((prev) => ({ ...prev, password: "Correo o contraseña no válidos." }));
        toast({
          title: "Credenciales inválidas",
          description: "Revisa el correo o la contraseña e inténtalo nuevamente.",
          variant: "destructive",
        });
      } else {
        toast({ title: "No pudimos iniciar sesión", description: msg, variant: "destructive" });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative h-screen overflow-hidden bg-background text-foreground">
      <div className="pointer-events-none absolute -right-24 -top-36 h-[360px] w-[360px] rounded-full bg-brand-primary/10 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 left-1/3 h-56 w-56 rounded-full bg-brand-turquoise/15 blur-3xl" />

      <div className="grid h-full lg:grid-cols-[0.92fr_1.08fr]">
        <section className="relative hidden overflow-hidden bg-sidebar text-sidebar-foreground lg:block">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_14%,rgba(0,212,184,0.22),transparent_26%),radial-gradient(circle_at_78%_82%,rgba(0,152,214,0.12),transparent_30%),linear-gradient(135deg,rgba(0,212,184,0.06)_0%,transparent_36%)]" />
          <div className="absolute -bottom-20 left-12 h-64 w-64 rounded-full border border-brand-primary/10 bg-brand-turquoise/12 blur-sm" />
          <div className="relative z-10 flex h-full flex-col justify-between px-10 py-8 xl:px-12 xl:py-10">
            <div>
              <Marca sobre="oscuro" className="mb-10 h-14" />

              <h1 className="max-w-xl text-4xl font-black leading-tight tracking-tight xl:text-5xl">
                <span className="block text-sidebar-foreground drop-shadow-[0_8px_24px_rgba(2,6,23,0.32)]">Evaluamos.</span>
                <span className="block text-sidebar-foreground drop-shadow-[0_8px_24px_rgba(2,6,23,0.32)]">Protegemos.</span>
                <span className="marker-highlight mt-3 block pb-1 text-brand-dark xl:mt-4">Transformamos.</span>
              </h1>

              <p className="mt-4 max-w-md text-base leading-7 text-sidebar-muted xl:text-lg">
                Plataforma integral para evaluaciones, seguridad laboral, bienestar y desarrollo organizacional.
              </p>

              <div className="mt-8 grid max-w-xl grid-cols-2 gap-3 xl:grid-cols-3">
                {productCards.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.title} className="rounded-rel-panel border border-sidebar-border bg-white/[0.055] p-4 shadow-rel-card backdrop-blur">
                      <Icon className="mb-3 h-6 w-6 text-brand-turquoise" />
                      <div className="text-sm font-black">{item.title}</div>
                      <div className="mt-1 text-xs text-sidebar-muted">{item.text}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center gap-2 text-sm text-sidebar-muted">
              <LockKeyhole className="h-4 w-4" aria-hidden="true" /> Seguridad y confidencialidad de tus datos garantizada
            </div>
          </div>
        </section>

        <section className="relative flex h-full items-center justify-center px-4 py-4 sm:px-6 lg:px-8">
          <div className="absolute right-10 top-10 hidden grid-cols-4 gap-3 opacity-40 md:grid">
            {Array.from({ length: 20 }).map((_, i) => <span key={i} className="h-1.5 w-1.5 rounded-full bg-brand-turquoise/50" />)}
          </div>

          <div className="w-full max-w-[620px]">
            <Marca className="mb-4 h-11 lg:hidden" />

            <Card className="rounded-rel-panel border-white/70 bg-white/92 p-5 shadow-rel-floating backdrop-blur md:p-8 xl:p-9">
              <div className="mb-6 text-center">
                <div className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-rel-panel bg-accent">
                  <Marca variante="isotipo" decorativa className="h-9" />
                </div>
                {/* `balance` reparte las dos lineas: a 375 px el titular cortaba por
                    medio del subrayado y dejaba «de» arriba y «nuevo» abajo. */}
                <h2 className="text-3xl font-black tracking-tight [text-wrap:balance]">Bienvenido <span className="marker-highlight">de nuevo</span></h2>
                <p className="mt-1 text-muted-foreground">
                  Inicia sesión en tu cuenta de <span className="font-bold text-brand-primary">ABRIL360</span>
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                <div className="space-y-2">
                  <Label htmlFor="email" className="font-bold">Correo electrónico</Label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="ejemplo@empresa.com"
                      autoComplete="username"
                      autoCapitalize="none"
                      spellCheck={false}
                      required
                      aria-invalid={errors.email ? true : undefined}
                      aria-describedby={errors.email ? "email-error" : undefined}
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
                      }}
                      className={`${ALTO_CONTROL.entrada} rounded-rel-control border-border pl-12 text-base`}
                    />
                  </div>
                  {errors.email ? <p id="email-error" className="text-sm font-semibold text-danger">{errors.email}</p> : null}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="font-bold">Contraseña</Label>
                    <Link to="/recuperar-clave" className="text-sm font-semibold text-brand-primary hover:text-brand-turquoise">
                      ¿Olvidaste tu contraseña?
                    </Link>
                  </div>
                  <EntradaClave
                    id="password"
                    icono={LockKeyhole}
                    placeholder="Ingresa tu contraseña"
                    autoComplete="current-password"
                    required
                    aria-invalid={errors.password ? true : undefined}
                    aria-describedby={errors.password ? "password-error" : undefined}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
                    }}
                    className={`${ALTO_CONTROL.entrada} rounded-rel-control border-border text-base`}
                  />
                  {errors.password ? <p id="password-error" className="text-sm font-semibold text-danger">{errors.password}</p> : null}
                </div>

                <div className="flex items-center justify-between gap-3 pt-1">
                  {/* Medido en pantalla: con la etiqueta a mano el blanco
                      tactil era de 40 px. La pieza garantiza los 44 de fila. */}
                  <Casilla
                    marcada={remember}
                    alCambiar={setRemember}
                    etiqueta="Recordarme en este dispositivo"
                    claseEtiqueta="text-sm text-foreground-soft"
                  />
                  <Pill tono="exito" className="hidden sm:inline-flex">Acceso seguro</Pill>
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className={`${ALTO_CONTROL.entrada} w-full rounded-rel-control bg-marca text-base font-bold shadow-rel-floating transition hover:brightness-[0.96]`}
                >
                  {loading ? (
                    <span className="inline-flex items-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/70 border-t-transparent" />
                      Iniciando sesión...
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-2">
                      Iniciar sesión <ArrowRight className="h-5 w-5" aria-hidden="true" />
                    </span>
                  )}
                </Button>
              </form>

              <div className="mt-5 rounded-rel-panel border border-accent bg-gradient-to-r from-accent/90 to-brand-canvas px-4 py-3">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-black text-foreground">Cumplimiento normativo colombiano y trazabilidad SG-SST</p>
                    <p className="text-sm text-muted-foreground">Plataforma operada para gestión psicosocial empresarial.</p>
                  </div>
                  <div className="flex h-14 min-w-[180px] items-center justify-center rounded-rel-panel bg-white/80 px-4 py-2 shadow-rel-card">
                    {!relLogoError ? (
                      <img
                        src={REL_LOGO_URL}
                        alt="REL Consilium SAS"
                        className="block h-10 max-w-[150px] object-contain object-center"
                        onError={() => setRelLogoError(true)}
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="text-sm font-bold text-foreground-soft">REL Consilium SAS</div>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </section>
      </div>
    </main>
  );
}
