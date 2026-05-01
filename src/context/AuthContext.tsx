// src/context/AuthContext.tsx
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { API_URL } from "@/lib/config";
import { setAuthToken } from "@/lib/apiClient";

type JwtPayload = {
  sub?: string;
  tenant_id?: string;
  roles?: string[] | string;
  permissions?: string[] | string;
  scope?: string;
  exp?: number;
  [k: string]: unknown;
};

export type AuthState = {
  token: string | null;
  userId: string | null;
  tenantId: string | null;
  roles: string[];
  permissions: string[];
  isAuthenticated: boolean;
  initialized: boolean;
};

type LoginOptions = { remember?: boolean; scope?: string };

type LoginResult = {
  roles: string[];
  permissions: string[];
  userId: string | null;
  tenantId: string | null;
};

type AuthContextType = AuthState & {
  login: (
    email: string,
    password: string,
    options?: LoginOptions
  ) => Promise<LoginResult>;
  logout: () => void;
  hasRole: (required?: string | string[]) => boolean;
  hasPermission: (required?: string | string[]) => boolean;
};

const AuthContext = createContext<AuthContextType | null>(null);
const STORAGE_KEY = "auth";

function normalizeList(value?: string[] | string | null): string[] {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter(Boolean).map(String);
  return String(value)
    .split(/[\s,]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function unique(values: string[]) {
  return Array.from(new Set(values));
}

function parseJwt(token: string): JwtPayload | null {
  try {
    const base64Url = token.split(".")[1];
    if (!base64Url) return null;
    const json = atob(base64Url.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(json);
  } catch {
    return null;
  }
}

function buildAuthState(token: string | null, initialized = true): AuthState {
  if (!token) {
    return {
      token: null,
      userId: null,
      tenantId: null,
      roles: [],
      permissions: [],
      isAuthenticated: false,
      initialized,
    };
  }

  const payload = parseJwt(token);
  const now = Math.floor(Date.now() / 1000);

  if (!payload || (typeof payload.exp === "number" && payload.exp <= now)) {
    return buildAuthState(null, initialized);
  }

  const roles = unique(normalizeList(payload.roles));
  const permissions = unique([
    ...normalizeList(payload.permissions),
    ...normalizeList(payload.scope).filter((item) => !roles.includes(item)),
  ]);

  return {
    token,
    userId: payload.sub ?? null,
    tenantId: payload.tenant_id ?? null,
    roles,
    permissions,
    isAuthenticated: true,
    initialized,
  };
}

function readStoredToken(): string | null {
  const raw = sessionStorage.getItem(STORAGE_KEY) ?? localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw);
    return parsed?.token ?? parsed?.access_token ?? parsed?.accessToken ?? null;
  } catch {
    return raw;
  }
}

function removeStoredAuth() {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // noop
  }
}

function hasAny(values: string[], required?: string | string[]) {
  if (!required) return true;
  const list = Array.isArray(required) ? required : [required];
  return list.some((item) => values.includes(item));
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [state, setState] = useState<AuthState>(() => ({
    token: null,
    userId: null,
    tenantId: null,
    roles: [],
    permissions: [],
    isAuthenticated: false,
    initialized: false,
  }));

  useEffect(() => {
    const token = readStoredToken();
    const next = buildAuthState(token, true);

    if (!next.isAuthenticated) removeStoredAuth();

    setAuthToken(next.token);
    setState(next);
  }, []);

  const login = async (
    email: string,
    password: string,
    options?: LoginOptions
  ): Promise<LoginResult> => {
    const body = new URLSearchParams();
    body.append("username", email);
    body.append("password", password);
    if (options?.scope) body.append("scope", options.scope);

    const res = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });

    if (!res.ok) {
      let message = `Error de autenticación (${res.status})`;
      try {
        const data = await res.json();
        if (typeof data?.detail === "string") message = data.detail;
        else if (Array.isArray(data?.detail)) {
          message = data.detail[0]?.msg ?? message;
        }
      } catch {
        try {
          const text = await res.text();
          if (text) message = text;
        } catch {
          // noop
        }
      }

      const err = new Error(message) as Error & { status?: number };
      err.status = res.status;
      throw err;
    }

    const data = await res.json();
    const token: string | undefined = data?.access_token ?? data?.token;
    if (!token) {
      throw new Error("Respuesta inválida del servidor: no llegó access_token.");
    }

    const auth = buildAuthState(token, true);
    if (!auth.isAuthenticated) {
      throw new Error("Token inválido o expirado recibido desde el servidor.");
    }

    setState(auth);
    setAuthToken(token);

    const save = JSON.stringify({ token });
    removeStoredAuth();
    if (options?.remember) localStorage.setItem(STORAGE_KEY, save);
    else sessionStorage.setItem(STORAGE_KEY, save);

    return {
      roles: auth.roles,
      permissions: auth.permissions,
      userId: auth.userId,
      tenantId: auth.tenantId,
    };
  };

  const logout = () => {
    const empty = buildAuthState(null, true);
    setState(empty);
    setAuthToken(null);
    removeStoredAuth();
  };

  const value = useMemo<AuthContextType>(
    () => ({
      ...state,
      login,
      logout,
      hasRole: (required?: string | string[]) => hasAny(state.roles, required),
      hasPermission: (required?: string | string[]) =>
        hasAny(state.permissions, required),
    }),
    [state]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  return ctx;
};
