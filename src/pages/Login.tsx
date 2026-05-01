// src/pages/Login.tsx
import { useState } from "react";
import { useLocation, useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff } from "lucide-react";

type FieldErrors = { email?: string; password?: string };
type LoginLocationState = { from?: string } | null;

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function routeByAccess(roles: string[], permissions: string[]) {
  if (
    roles.includes("PSICOLOGO_EVALUADOR") ||
    permissions.includes("psico.dashboard.view")
  ) {
    return "/psicosocial/dashboard";
  }

  if (
    roles.includes("ADMIN_EMPRESA") ||
    roles.includes("admin_empresa") ||
    permissions.includes("evaluaciones.view")
  ) {
    return "/evaluaciones";
  }

  return "/mis-evaluaciones";
}

function safeRedirectPath(path: unknown, roles: string[], permissions: string[]) {
  if (typeof path !== "string" || !path.startsWith("/")) {
    return routeByAccess(roles, permissions);
  }

  if (path === "/login" || path === "/logout") {
    return routeByAccess(roles, permissions);
  }

  if (
    path.startsWith("/psicosocial") &&
    !permissions.includes("psico.dashboard.view") &&
    !roles.includes("PSICOLOGO_EVALUADOR")
  ) {
    return routeByAccess(roles, permissions);
  }

  return path;
}

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

  if (!initialized) {
    return (
      <div className="min-h-screen grid place-items-center bg-background px-4 text-sm text-muted-foreground">
        Validando sesión...
      </div>
    );
  }

  if (isAuthenticated) {
    return (
      <Navigate
        to={safeRedirectPath(from, roles, permissions)}
        replace
      />
    );
  }

  const validate = (): boolean => {
    const e: FieldErrors = {};
    if (!email.trim()) e.email = "El email es obligatorio.";
    else if (!emailRegex.test(email.trim())) {
      e.email = "Ingresa un email válido.";
    }
    if (!password) e.password = "La contraseña es obligatoria.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const result = await login(email.trim(), password, { remember });
      const to = safeRedirectPath(from, result.roles, result.permissions);
      navigate(to, { replace: true });
    } catch (err: any) {
      const status = err?.status as number | undefined;
      const msg =
        typeof err?.message === "string"
          ? err.message
          : "No pudimos iniciar sesión.";

      if (status === 401) {
        setErrors((prev) => ({
          ...prev,
          password: "Email o contraseña no válidos.",
        }));
        toast({
          title: "Credenciales inválidas",
          description: "Revisa tu email o contraseña e inténtalo nuevamente.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "No pudimos iniciar sesión",
          description: msg,
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid place-items-center bg-background px-4">
      <Card className="w-full max-w-md p-8 shadow-xl">
        <h1 className="text-2xl font-semibold tracking-tight mb-2">
          Inicia sesión
        </h1>
        <p className="text-sm text-muted-foreground mb-6">
          Autentícate para continuar.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="tucorreo@empresa.com"
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
              required
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errors.email) validate();
              }}
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? "email-error" : undefined}
              disabled={loading}
            />
            {errors.email && (
              <p id="email-error" className="text-sm text-destructive mt-1">
                {errors.email}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password">Contraseña</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                required
                className="pr-10"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errors.password) validate();
                }}
                aria-invalid={!!errors.password}
                aria-describedby={errors.password ? "password-error" : undefined}
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground"
                aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                aria-pressed={showPassword}
                disabled={loading}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            {errors.password && (
              <p id="password-error" className="text-sm text-destructive mt-1">
                {errors.password}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="remember"
              checked={remember}
              onCheckedChange={(v) => setRemember(Boolean(v))}
              disabled={loading}
            />
            <Label
              htmlFor="remember"
              className="text-sm text-muted-foreground cursor-pointer"
            >
              Recordarme en este dispositivo
            </Label>
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Ingresando..." : "Ingresar"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
