// src/lib/apiClient.ts
import axios from "axios";
import { API_URL } from "@/lib/config";

// Sesión definitiva: cookie HttpOnly enviada por el navegador.
// No se guarda ni se inyecta JWT en JavaScript.
export const setAuthToken = (_token: string | null) => {
  // noop intencional por compatibilidad con imports existentes durante la transición de código.
};

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    const status = error?.response?.status;
    if (status === 401) {
      if (typeof window !== "undefined" && window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);
