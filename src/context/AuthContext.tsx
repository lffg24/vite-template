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
  exp?: number;
  [k: string]: any;
};

type AuthState = {
  token: string | null;
  userId: string | null;
  tenantId: string | null;
  roles: string[];
  isAuthenticated: boolean;
};

type LoginOptions = { remember?: boolean; scope?: string };

type AuthContextType = AuthState & {
  // antes: login: (...) => Promise<void>
  login: (
    email: string,
    password: string,
    options?: LoginOptions
  ) => Promise<string[]>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | null>(null);

function parseJwt(token: string): JwtPayload | null {
  try {
    const base64Url = token.split(".")[1];
    const json = atob(base64Url.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(json);
  } catch {
    return null;
  }
}

const STORAGE_KEY = "auth";

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [state, setState] = useState<AuthState>({
    token: null,
    userId: null,
    tenantId: null,
    roles: [],
    isAuthenticated: false,
  });

  // Cargar desde storage (sessionStorage prioridad; si no, localStorage)
  useEffect(() => {
    const raw =
      sessionStorage.getItem(STORAGE_KEY) ?? localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        const { token } = JSON.parse(raw);
        const payload = token ? parseJwt(token) : null;
        const roles = payload?.roles
          ? Array.isArray(payload.roles)
            ? payload.roles
            : String(payload.roles).split(" ")
          : [];
        setState({
          token,
          userId: payload?.sub ?? null,
          tenantId: payload?.tenant_id ?? null,
          roles,
          isAuthenticated: !!token,
        });
        setAuthToken(token);
      } catch {
        // ignore
      }
    }
  }, []);

  const login = async (
    email: string,
    password: string,
    options?: LoginOptions
  ): Promise<string[]> => {
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
      // Parseamos la respuesta para obtener un mensaje claro
      let message = `Error de autenticación (${res.status})`;
      try {
        // FastAPI suele responder JSON con "detail"
        const data = await res.json();
        if (typeof data?.detail === "string") message = data.detail;
        else if (Array.isArray(data?.detail))
          message = data.detail[0]?.msg ?? message;
      } catch {
        try {
          const text = await res.text();
          if (text) message = text;
        } catch {}
      }
      // Adjuntamos status para que la UI pueda decidir qué mostrar
      const err = new Error(message) as Error & { status?: number };
      err.status = res.status;
      throw err;
    }

    const data = await res.json();
    const token: string = data?.access_token;
    if (!token)
      throw new Error("Respuesta inválida del servidor (sin access_token).");

    const payload = parseJwt(token);
    const roles = payload?.roles
      ? Array.isArray(payload.roles)
        ? payload.roles
        : String(payload.roles).split(" ")
      : [];

    const auth: AuthState = {
      token,
      userId: payload?.sub ?? null,
      tenantId: payload?.tenant_id ?? null,
      roles,
      isAuthenticated: true,
    };

    setState(auth);
    setAuthToken(token);

    const save = JSON.stringify({ token });
    if (options?.remember) localStorage.setItem(STORAGE_KEY, save);
    else sessionStorage.setItem(STORAGE_KEY, save);

    return roles; // devolvemos roles recién decodificados
  };

  const logout = () => {
    setState({
      token: null,
      userId: null,
      tenantId: null,
      roles: [],
      isAuthenticated: false,
    });
    setAuthToken(null);
    try {
      sessionStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
  };

  const value = useMemo<AuthContextType>(
    () => ({ ...state, login, logout }),
    [state]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  return ctx;
};
