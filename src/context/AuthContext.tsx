// src/context/AuthContext.tsx
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { API_URL } from "@/lib/config";
import { loginPathForCurrentLocation, SESSION_EXPIRED_EVENT } from "@/lib/sessionEvents";

export type AuthUser = {
  id: string;
  nombre: string;
  email: string;
  empresaId: string;
};

export type AuthState = {
  token: null;
  user: AuthUser | null;
  userId: string | null;
  tenantId: string | null;
  roles: string[];
  permissions: string[];
  passwordChangeRequired: boolean;
  isAuthenticated: boolean;
  initialized: boolean;
};

type LoginOptions = { remember?: boolean; scope?: string };

type LoginResult = {
  roles: string[];
  permissions: string[];
  userId: string | null;
  tenantId: string | null;
  passwordChangeRequired: boolean;
};

type AuthContextType = AuthState & {
  login: (email: string, password: string, options?: LoginOptions) => Promise<LoginResult>;
  logout: () => Promise<void>;
  changePassword: (payload: ChangePasswordPayload) => Promise<void>;
  hasRole: (required?: string | string[]) => boolean;
  hasPermission: (required?: string | string[]) => boolean;
};

type MeResponse = {
  id: number | string;
  nombre: string;
  email: string;
  empresa_id: string;
  roles?: string[];
  permissions?: string[];
  password_change_required?: boolean;
};

type ChangePasswordPayload = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

const AuthContext = createContext<AuthContextType | null>(null);

function emptyState(initialized = true): AuthState {
  return {
    token: null,
    user: null,
    userId: null,
    tenantId: null,
    roles: [],
    permissions: [],
    passwordChangeRequired: false,
    isAuthenticated: false,
    initialized,
  };
}

function normalizeList(value?: string[] | string | null): string[] {
  if (!value) return [];
  if (Array.isArray(value)) return Array.from(new Set(value.filter(Boolean).map(String)));
  return Array.from(new Set(String(value).split(/[\s,]+/).map((item) => item.trim()).filter(Boolean)));
}

function stateFromMe(me: MeResponse): AuthState {
  const user = {
    id: String(me.id),
    nombre: me.nombre,
    email: me.email,
    empresaId: me.empresa_id,
  };
  return {
    token: null,
    user,
    userId: user.id,
    tenantId: me.empresa_id,
    roles: normalizeList(me.roles),
    permissions: normalizeList(me.permissions),
    passwordChangeRequired: Boolean(me.password_change_required),
    isAuthenticated: true,
    initialized: true,
  };
}

function hasAny(values: string[], required?: string | string[]) {
  if (!required) return true;
  const list = Array.isArray(required) ? required : [required];
  return list.some((item) => values.includes(item));
}

async function parseError(res: Response, fallback: string): Promise<string> {
  try {
    const data = await res.json();
    if (typeof data?.detail === "string") return data.detail;
    if (Array.isArray(data?.detail)) return data.detail[0]?.msg ?? fallback;
    if (typeof data?.message === "string") return data.message;
  } catch {
    try {
      const text = await res.text();
      if (text) return text;
    } catch {
      // noop
    }
  }
  return fallback;
}

async function fetchMe(): Promise<AuthState> {
  const res = await fetch(`${API_URL}/auth/me`, {
    method: "GET",
    credentials: "include",
    headers: { Accept: "application/json" },
  });

  if (res.status === 401) return emptyState(true);
  if (!res.ok) {
    const detail = await parseError(res, `No fue posible validar la sesión (${res.status})`);
    throw new Error(detail);
  }

  return stateFromMe((await res.json()) as MeResponse);
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AuthState>(() => emptyState(false));

  useEffect(() => {
    let alive = true;
    fetchMe()
      .then((next) => {
        if (alive) setState(next);
      })
      .catch(() => {
        if (alive) setState(emptyState(true));
      });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    const onSessionExpired = () => {
      setState(emptyState(true));
      if (typeof window !== "undefined" && window.location.pathname !== "/login") {
        window.location.assign(loginPathForCurrentLocation());
      }
    };

    window.addEventListener(SESSION_EXPIRED_EVENT, onSessionExpired);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, onSessionExpired);
  }, []);

  const login = useCallback(async (email: string, password: string, options?: LoginOptions): Promise<LoginResult> => {
    const body = new URLSearchParams();
    body.append("username", email);
    body.append("password", password);
    if (options?.scope) body.append("scope", options.scope);

    const res = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
      body,
    });

    if (!res.ok) {
      const message = await parseError(res, `Error de autenticación (${res.status})`);
      const err = new Error(message) as Error & { status?: number };
      err.status = res.status;
      throw err;
    }

    const data = (await res.json()) as MeResponse;
    const next = stateFromMe(data);
    setState(next);

    return {
      roles: next.roles,
      permissions: next.permissions,
      userId: next.userId,
      tenantId: next.tenantId,
      passwordChangeRequired: next.passwordChangeRequired,
    };
  }, []);

  const logout = useCallback(async () => {
    try {
      await fetch(`${API_URL}/auth/logout`, {
        method: "POST",
        credentials: "include",
        headers: { Accept: "application/json" },
      });
    } finally {
      setState(emptyState(true));
    }
  }, []);

  const changePassword = useCallback(async (payload: ChangePasswordPayload) => {
    const res = await fetch(`${API_URL}/auth/password`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        current_password: payload.currentPassword,
        new_password: payload.newPassword,
        confirm_password: payload.confirmPassword,
      }),
    });

    if (!res.ok) {
      const message = await parseError(res, `No fue posible actualizar la contraseña (${res.status})`);
      const err = new Error(message) as Error & { status?: number };
      err.status = res.status;
      throw err;
    }
    setState((current) => ({ ...current, passwordChangeRequired: false }));
  }, []);

  const value = useMemo<AuthContextType>(
    () => ({
      ...state,
      login,
      logout,
      changePassword,
      hasRole: (required?: string | string[]) => hasAny(state.roles, required),
      hasPermission: (required?: string | string[]) => hasAny(state.permissions, required),
    }),
    [state, login, logout, changePassword]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return ctx;
}
