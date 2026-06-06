import { useMemo, useState } from "react";
import { Navigate, useLocation, useNavigate, useSearchParams } from "react-router-dom";
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
import { safeRedirectPath } from "@/lib/accessRoutes";

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
  const { initialized, isAuthenticated, roles, permissions, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  const fromState = (location.state as LoginLocationState)?.from;
  const fromQuery = searchParams.get("next") || undefined;
  const from = fromState || fromQuery;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState<boolean>(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [logoError, setLogoError] = useState(false);

  const redirectPath = useMemo(() => safeRedirectPath(from, roles, permissions), [from, roles, permissions]);

  if (!initialized) {
    return (
      <div className="grid h-screen place-items-center overflow-hidden bg-slate-950 px-4 text-sm text-white">
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
    <main className="relative h-screen overflow-hidden bg-[#f4f6ff] text-slate-950">
      <div className="pointer-events-none absolute -right-24 -top-36 h-[360px] w-[360px] rounded-full bg-violet-100/80 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 left-1/3 h-56 w-56 rounded-full bg-cyan-100/70 blur-3xl" />

      <div className="grid h-full lg:grid-cols-[0.92fr_1.08fr]">
        <section className="relative hidden overflow-hidden bg-[#061126] text-white lg:block">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_22%_16%,rgba(124,58,237,0.38),transparent_28%),radial-gradient(circle_at_85%_78%,rgba(34,211,238,0.20),transparent_32%)]" />
          <div className="absolute -bottom-20 left-12 h-64 w-64 rounded-full border border-violet-400/15 bg-violet-500/10 blur-sm" />
          <div className="relative z-10 flex h-full flex-col justify-between px-10 py-8 xl:px-12 xl:py-10">
            <div>
              <div className="mb-10 flex items-center gap-4">
                <div className="grid h-14 w-14 place-items-center rounded-3xl bg-gradient-to-br from-violet-500 to-cyan-400 shadow-2xl shadow-violet-950/40">
                  <BrainCircuit className="h-8 w-8" />
                </div>
                <div>
                  <div className="text-3xl font-black tracking-tight">ABRIL<span className="text-violet-300">360</span></div>
                  <div className="text-xs uppercase tracking-[0.32em] text-cyan-100/70">Gestión psicosocial</div>
                </div>
              </div>

              <h1 className="max-w-xl text-4xl font-black leading-tight tracking-tight xl:text-5xl">
                Evaluamos.<br />Protegemos.<br />
                <span className="bg-gradient-to-r from-violet-300 to-cyan-200 bg-clip-text text-transparent">Transformamos.</span>
              </h1>

              <p className="mt-4 max-w-md text-base leading-7 text-slate-300 xl:text-lg">
                Plataforma integral para evaluaciones, seguridad laboral, bienestar y desarrollo organizacional.
              </p>

              <div className="mt-8 grid max-w-xl grid-cols-2 gap-3 xl:grid-cols-3">
                {productCards.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.title} className="rounded-3xl border border-white/10 bg-white/[0.055] p-4 shadow-xl shadow-slate-950/20 backdrop-blur">
                      <Icon className="mb-3 h-6 w-6 text-cyan-200" />
                      <div className="text-sm font-black">{item.title}</div>
                      <div className="mt-1 text-xs text-slate-400">{item.text}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center gap-2 text-sm text-slate-400">
              <LockKeyhole className="h-4 w-4" /> Seguridad y confidencialidad de tus datos garantizada
            </div>
          </div>
        </section>

        <section className="relative flex h-full items-center justify-center px-4 py-4 sm:px-6 lg:px-8">
          <div className="absolute right-10 top-10 hidden grid-cols-4 gap-3 opacity-40 md:grid">
            {Array.from({ length: 20 }).map((_, i) => <span key={i} className="h-1.5 w-1.5 rounded-full bg-violet-300" />)}
          </div>

          <div className="w-full max-w-[620px]">
            <div className="mb-4 flex items-center justify-center gap-3 lg:hidden">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-violet-600 to-cyan-400 text-white shadow-lg">
                <BrainCircuit className="h-7 w-7" />
              </div>
              <div className="text-2xl font-black tracking-tight">ABRIL<span className="text-violet-600">360</span></div>
            </div>

            <Card className="rounded-[2rem] border-white/70 bg-white/92 p-5 shadow-2xl shadow-violet-950/10 backdrop-blur md:p-8 xl:p-9">
              <div className="mb-6 text-center">
                <div className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-2xl bg-violet-50 text-violet-700">
                  <ShieldCheck className="h-7 w-7" />
                </div>
                <h2 className="text-3xl font-black tracking-tight">Bienvenido de nuevo</h2>
                <p className="mt-1 text-slate-600">
                  Inicia sesión en tu cuenta de <span className="font-bold text-violet-700">ABRIL360</span>
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4" noValidate>
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
                      className="h-14 rounded-2xl border-slate-200 pl-12 text-base"
                    />
                  </div>
                  {errors.email ? <p className="text-sm text-rose-600">{errors.email}</p> : null}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="font-bold">Contraseña</Label>
                    <button type="button" className="text-sm font-semibold text-violet-700 hover:text-violet-800">
                      ¿Olvidaste tu contraseña?
                    </button>
                  </div>
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
                      className="h-14 rounded-2xl border-slate-200 pl-12 pr-12 text-base"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-violet-700"
                      aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  {errors.password ? <p className="text-sm text-rose-600">{errors.password}</p> : null}
                </div>

                <div className="flex items-center justify-between gap-3 pt-1">
                  <label className="flex items-center gap-3 text-sm text-slate-600">
                    <Checkbox checked={remember} onCheckedChange={(v) => setRemember(Boolean(v))} />
                    Recordarme en este dispositivo
                  </label>
                  <div className="hidden items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 sm:flex">
                    <CheckCircle2 className="h-4 w-4" /> Acceso seguro
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="h-14 w-full rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 text-base font-bold shadow-lg shadow-violet-500/25 transition hover:from-violet-700 hover:to-indigo-700"
                >
                  {loading ? (
                    <span className="inline-flex items-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/70 border-t-transparent" />
                      Iniciando sesión...
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-2">
                      Iniciar sesión <ArrowRight className="h-5 w-5" />
                    </span>
                  )}
                </Button>
              </form>

              <div className="mt-5 rounded-[1.6rem] border border-violet-100 bg-gradient-to-r from-violet-50 to-cyan-50 px-4 py-3">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-black text-slate-900">Cumplimiento normativo colombiano y trazabilidad SG-SST</p>
                    <p className="text-sm text-slate-600">Plataforma operada para gestión psicosocial empresarial.</p>
                  </div>
                  <div className="flex items-center gap-3 rounded-2xl bg-white/80 px-3 py-2 shadow-sm">
                    {!logoError ? (
                      <img
                        src={REL_LOGO_URL}
                        alt="REL Consilium SAS"
                        className="h-8 w-auto object-contain"
                        onError={() => setLogoError(true)}
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="text-sm font-bold text-slate-700">REL Consilium SAS</div>
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
