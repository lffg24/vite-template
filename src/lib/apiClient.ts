// src/lib/apiClient.ts
import axios from "axios";
import { API_URL } from "@/lib/config";

let authToken: string | null = null;

/** Permite setear/borrar el token desde el AuthProvider */
export const setAuthToken = (token: string | null) => {
  authToken = token;
};

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: false,
});

// Inyección de Authorization: Bearer
api.interceptors.request.use((config) => {
  if (authToken) {
    config.headers = config.headers ?? {};
    (config.headers as any).Authorization = `Bearer ${authToken}`;
  }
  return config;
});

// Manejo global de 401/403
api.interceptors.response.use(
  (res) => res,
  (error) => {
    const status = error?.response?.status;
    if (status === 401 || status === 403) {
      try {
        sessionStorage.removeItem("auth");
        localStorage.removeItem("auth");
      } catch {}
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);
