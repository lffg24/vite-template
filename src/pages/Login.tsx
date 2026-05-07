// src/pages/Login.tsx
import { useMemo, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  BarChart3,
  BrainCircuit,
  CheckCircle2,
  Eye,
  EyeOff,
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
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";

type FieldErrors = { email?: string; password?: string };
type LoginLocationState = { from?: string } | null;

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function routeByAccess(roles: string[], permissions: string[]) {
  if (roles.includes("PSICOLOGO_EVALUADOR") || permissions.includes("psico.dashboard.view")) {
    return "/psicosocial/dashboard";
  }

  if (roles.includes("ADMIN_EMPRESA") || roles.includes("admin_empresa") || permissions.includes("evaluaciones.view")) {
    return "/evaluaciones";
  }

  return "/mis-evaluaciones";
}

function safeRedirectPath(path: unknown, roles: string[], permissions: string[]) {
  if (typeof path !== "string" || !path.startsWith("/")) return routeByAccess(roles, permissions);
  if (path === "/login" || path === "/logout") return routeByAccess(roles, permissions);

  if (
    path.startsWith("/psicosocial") &&
    !permissions.includes("psico.dashboard.view") &&
    !roles.includes("PSICOLOGO_EVALUADOR")
  ) {
    return routeByAccess(roles, permissions);
  }

  return path;
}

const productCards = [
  { icon: UsersRound, title: "Evaluaciones", text: "360° · 180° · 90°" },
  { icon: ShieldCheck, title: "Seguridad laboral", text: "SG-SST" },
  { icon: BrainCircuit, title: "Riesgo psicosocial", text: "Formas A y B" },
  { icon: HeartPulse, title: "Bienestar laboral", text: "Programas" },
  { icon: BarChart3, title: "Reportes", text: "Inteligentes" },
  { icon: Sparkles, title: "NeuroMapa", text: "Análisis explicable" },
];

export default function Login() {
  const { initialized, isAuthenticated, roles, permissions, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  const from = (location.state as LoginLocationState)?.from;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState<boolean>(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});

  const redirectPath = useMemo(() => safeRedirectPath(from, roles, permissions), [from, roles, permissions]);

  if (!initialized) {
    return (
      <div className="grid min-h-screen place-items-center bg-slate-950 px-4 text-sm text-white">
        <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/10 px-5 py-4 shadow-2xl backdrop-blur">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-violet-300 border-t-transparent" />
          Validando sesión segura...
        </div>
      </div>
    );
  }

  if (isAuthenticated) return <Navigate to={redirectPath} replace />;

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
      navigate(safeRedirectPath(from, result.roles, result.permissions), { replace: true });
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
    <main className="relative min-h-screen overflow-hidden bg-[#f7f8ff] text-slate-950">
      <div className="pointer-events-none absolute -right-28 -top-40 h-[520px] w-[520px] rounded-full bg-violet-100/70 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 right-1/3 h-72 w-72 rounded-full bg-cyan-100/60 blur-3xl" />

      <div className="grid min-h-screen lg:grid-cols-[0.82fr_1.18fr]">
        <section className="relative hidden overflow-hidden bg-[#061126] text-white lg:block">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_24%_12%,rgba(124,58,237,0.42),transparent_28%),radial-gradient(circle_at_85%_78%,rgba(34,211,238,0.22),transparent_35%)]" />
          <div className="absolute -bottom-32 left-12 h-72 w-72 rounded-full border border-violet-400/20 bg-violet-500/10 blur-sm" />
          <div className="relative z-10 flex h-full flex-col justify-between p-12 xl:p-14">
            <div>
              <div className="mb-16 flex items-center gap-4">
                <div className="grid h-14 w-14 place-items-center rounded-3xl bg-gradient-to-br from-violet-500 to-cyan-400 shadow-2xl shadow-violet-950/40">
                  <BrainCircuit className="h-8 w-8" />
                </div>
                <div>
                  <div className="text-3xl font-black tracking-tight">ABRIL<span className="text-violet-300">360</span></div>
                  <div className="text-xs uppercase tracking-[0.35em] text-cyan-100/70">Gestión psicosocial</div>
                </div>
              </div>

              <h1 className="max-w-lg text-5xl font-black leading-tight tracking-tight">
                Evaluamos.<br />Protegemos.<br />
                <span className="bg-gradient-to-r from-violet-300 to-cyan-200 bg-clip-text text-transparent">Transformamos.</span>
              </h1>
              <p className="mt-6 max-w-md text-lg leading-8 text-slate-300">
                Plataforma integral para evaluaciones, seguridad laboral, bienestar y desarrollo organizacional.
              </p>

              <div className="mt-10 grid max-w-lg grid-cols-2 gap-4 xl:grid-cols-3">
                {productCards.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.title} className="rounded-3xl border border-white/10 bg-white/[0.055] p-4 shadow-xl shadow-slate-950/20 backdrop-blur">
                      <Icon className="mb-3 h-7 w-7 text-cyan-200" />
                      <div className="text-sm font-black">{item.title}</div>
                      <div className="mt-1 text-xs text-slate-400">{item.text}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2 text-sm text-slate-400">
              <div className="flex items-center gap-2">
                <LockKeyhole className="h-4 w-4" /> Seguridad y confidencialidad de tus datos garantizada
              </div>
              <div>© {new Date().getFullYear()} REL Consilium SAS · ABRIL-360</div>
            </div>
          </div>
        </section>

        <section className="relative grid place-items-center px-5 py-10 sm:px-8">
          <div className="absolute right-16 top-14 hidden grid-cols-4 gap-3 opacity-40 md:grid">
            {Array.from({ length: 32 }).map((_, i) => <span key={i} className="h-1.5 w-1.5 rounded-full bg-violet-300" />)}
          </div>

          <div className="w-full max-w-[560px]">
            <div className="mb-8 flex items-center justify-center gap-3 lg:hidden">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-violet-600 to-cyan-400 text-white shadow-lg">
                <BrainCircuit className="h-7 w-7" />
              </div>
              <div className="text-2xl font-black tracking-tight">ABRIL<span className="text-violet-600">360</span></div>
            </div>

            <Card className="rounded-[2rem] border-white/70 bg-white/88 p-6 shadow-2xl shadow-violet-950/10 backdrop-blur md:p-10">
              <div className="mb-8 text-center">
                <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-violet-50 text-violet-700">
                  <ShieldCheck className="h-7 w-7" />
                </div>
                <h2 className="text-3xl font-black tracking-tight">Bienvenido de nuevo</h2>
                <p className="mt-2 text-slate-600">Inicia sesión en tu cuenta de <span className="font-bold text-violet-700">ABRIL360</span></p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                <div className="space-y-2">
                  <Label htmlFor="email" className="font-bold">Correo electrónico</Label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="ejemplo@empresa.com"
                      autoComplete="username"
                      autoCapitalize="none"
                      spellCheck={false}
                      required
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
                      }}
                      aria-invalid={!!errors.email}
                      aria-describedby={errors.email ? "email-error" : undefined}
                      disabled={loading}
                      className="h-14 rounded-2xl border-slate-200 bg-white pl-12 text-base shadow-sm focus-visible:ring-violet-500"
                    />
                  </div>
                  {errors.email && <p id="email-error" className="text-sm font-medium text-red-600">{errors.email}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="font-bold">Contraseña</Label>
                  <div className="relative">
                    <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Ingresa tu contraseña"
                      autoComplete="current-password"
                      required
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
                      }}
                      aria-invalid={!!errors.password}
                      aria-describedby={errors.password ? "password-error" : undefined}
                      disabled={loading}
                      className="h-14 rounded-2xl border-slate-200 bg-white px-12 text-base shadow-sm focus-visible:ring-violet-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute inset-y-0 right-0 flex items-center px-4 text-slate-400 hover:text-slate-700"
                      aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                      aria-pressed={showPassword}
                      disabled={loading}
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  {errors.password && <p id="password-error" className="text-sm font-medium text-red-600">{errors.password}</p>}
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <label htmlFor="remember" className="flex cursor-pointer items-center gap-2 text-sm text-slate-600">
                    <Checkbox id="remember" checked={remember} onCheckedChange={(v) => setRemember(Boolean(v))} disabled={loading} />
                    Recordarme en este dispositivo
                  </label>
                  <span className="text-sm font-semibold text-violet-700">Recuperación con administrador</span>
                </div>

                <Button type="submit" disabled={loading} className="h-14 w-full rounded-2xl bg-gradient-to-r from-violet-700 to-indigo-600 text-base font-black shadow-lg shadow-violet-900/20 hover:from-violet-800 hover:to-indigo-700">
                  {loading ? "Iniciando sesión..." : "Iniciar sesión"}
                  {!loading && <ArrowRight className="ml-2 h-5 w-5" />}
                </Button>
              </form>
            </Card>

            <div className="mx-auto mt-6 flex w-fit flex-col items-center gap-1 rounded-2xl border border-violet-100 bg-white/80 px-5 py-3 text-center text-sm text-slate-600 shadow-sm backdrop-blur sm:flex-row sm:gap-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-violet-700" /> Cumplimiento normativo colombiano y trazabilidad SG-SST
              </div>
              <span className="hidden text-slate-300 sm:inline">·</span>
              <a href="https://relconsilium.com/" target="_blank" rel="noreferrer" className="font-semibold text-violet-700 hover:text-violet-900">REL Consilium SAS</a>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
