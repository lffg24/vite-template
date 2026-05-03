// src/features/psicosocial/context/PsicoEmpresaActivaContext.tsx
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  EmpresaAsignada,
  CrearEmpresaPsicoPayload,
  crearEmpresaPsicologo,
  getEmpresasAsignadasResponse,
} from "@/features/psicosocial/api/psicoAccessService";

type PsicoEmpresaContextValue = {
  empresas: EmpresaAsignada[];
  loading: boolean;
  error?: string;
  errorStatus?: number;
  onboardingRequired: boolean;
  message?: string | null;
  recargarEmpresas: () => Promise<void>;
  crearEmpresa: (payload: CrearEmpresaPsicoPayload) => Promise<EmpresaAsignada>;
};

const PsicoEmpresaActivaContext = createContext<PsicoEmpresaContextValue | null>(null);

export function PsicoEmpresaActivaProvider({ children }: { children: React.ReactNode }) {
  const [empresas, setEmpresas] = useState<EmpresaAsignada[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>();
  const [errorStatus, setErrorStatus] = useState<number | undefined>();
  const [onboardingRequired, setOnboardingRequired] = useState(false);
  const [message, setMessage] = useState<string | null | undefined>();

  const recargarEmpresas = async () => {
    setLoading(true);
    setError(undefined);
    setErrorStatus(undefined);
    try {
      const response = await getEmpresasAsignadasResponse();
      const list = response.empresas ?? [];
      setEmpresas(list);
      setOnboardingRequired(Boolean(response.onboarding_required ?? list.length === 0));
      setMessage(response.message ?? null);
    } catch (err) {
      const status = (err as Error & { status?: number })?.status;
      setErrorStatus(status);
      setError(err instanceof Error ? err.message : "Error cargando empresas vinculadas");
      setEmpresas([]);
      setOnboardingRequired(status !== 401);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void recargarEmpresas();
  }, []);

  const crearEmpresa = async (payload: CrearEmpresaPsicoPayload) => {
    const result = await crearEmpresaPsicologo(payload);
    await recargarEmpresas();
    return {
      empresa_id: result.empresa_id,
      id: result.empresa_id,
      nombre: payload.nombre,
      nit: payload.nit ?? null,
      estado: "Activa",
      rol_en_empresa: "PSICOLOGO_EVALUADOR",
      puede_ver_individuales: true,
      puede_cargar_respuestas: true,
      puede_crear_aplicaciones: true,
    };
  };

  const value = useMemo(
    () => ({
      empresas,
      loading,
      error,
      errorStatus,
      onboardingRequired,
      message,
      recargarEmpresas,
      crearEmpresa,
    }),
    [empresas, loading, error, errorStatus, onboardingRequired, message]
  );

  return <PsicoEmpresaActivaContext.Provider value={value}>{children}</PsicoEmpresaActivaContext.Provider>;
}

export function usePsicoEmpresaActiva() {
  const ctx = useContext(PsicoEmpresaActivaContext);
  if (!ctx) throw new Error("usePsicoEmpresaActiva debe usarse dentro de PsicoEmpresaActivaProvider");
  return ctx;
}
