// src/features/psicosocial/context/PsicoEmpresaActivaContext.tsx
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  EmpresaAsignada,
  CrearEmpresaPsicoPayload,
  crearEmpresaPsicologo,
  clearEmpresaActivaId,
  getEmpresasAsignadasResponse,
  getEmpresaActivaId,
  setEmpresaActivaId,
} from "@/features/psicosocial/api/psicoAccessService";

type PsicoEmpresaContextValue = {
  empresas: EmpresaAsignada[];
  empresaActiva?: EmpresaAsignada;
  empresaActivaId?: string;
  loading: boolean;
  error?: string;
  errorStatus?: number;
  onboardingRequired: boolean;
  message?: string | null;
  cambiarEmpresa: (empresaId: string) => void;
  recargarEmpresas: () => Promise<void>;
  crearEmpresa: (payload: CrearEmpresaPsicoPayload) => Promise<EmpresaAsignada>;
};

const PsicoEmpresaActivaContext = createContext<PsicoEmpresaContextValue | null>(null);

export function PsicoEmpresaActivaProvider({ children }: { children: React.ReactNode }) {
  const [empresas, setEmpresas] = useState<EmpresaAsignada[]>([]);
  const [empresaActivaId, setEmpresaActivaIdState] = useState<string | undefined>(
    getEmpresaActivaId() ?? undefined
  );
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
      setOnboardingRequired(Boolean(response.onboarding_required));
      setMessage(response.message ?? null);

      const current = getEmpresaActivaId();
      const currentIsAllowed = current && list.some((e) => e.empresa_id === current);
      const next = currentIsAllowed ? current! : response.empresa_activa_id ?? list[0]?.empresa_id;

      if (next) {
        setEmpresaActivaId(next);
        setEmpresaActivaIdState(next);
      } else {
        clearEmpresaActivaId();
        setEmpresaActivaIdState(undefined);
      }
    } catch (err) {
      const status = (err as Error & { status?: number })?.status;
      setErrorStatus(status);
      setError(err instanceof Error ? err.message : "Error cargando empresas asignadas");
      setEmpresas([]);
      setOnboardingRequired(status !== 401);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void recargarEmpresas();
  }, []);

  const cambiarEmpresa = (empresaId: string) => {
    if (!empresas.some((e) => e.empresa_id === empresaId)) return;
    setEmpresaActivaId(empresaId);
    setEmpresaActivaIdState(empresaId);
    window.dispatchEvent(new CustomEvent("eva360:empresa-activa-change", { detail: { empresaId } }));
  };

  const crearEmpresa = async (payload: CrearEmpresaPsicoPayload) => {
    const result = await crearEmpresaPsicologo(payload);
    await recargarEmpresas();
    if (result.empresa_id) {
      setEmpresaActivaId(result.empresa_id);
      setEmpresaActivaIdState(result.empresa_id);
      window.dispatchEvent(
        new CustomEvent("eva360:empresa-activa-change", { detail: { empresaId: result.empresa_id } })
      );
    }
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

  const empresaActiva = useMemo(
    () => empresas.find((e) => e.empresa_id === empresaActivaId),
    [empresas, empresaActivaId]
  );

  const value = useMemo(
    () => ({
      empresas,
      empresaActiva,
      empresaActivaId,
      loading,
      error,
      errorStatus,
      onboardingRequired,
      message,
      cambiarEmpresa,
      recargarEmpresas,
      crearEmpresa,
    }),
    [empresas, empresaActiva, empresaActivaId, loading, error, errorStatus, onboardingRequired, message]
  );

  return <PsicoEmpresaActivaContext.Provider value={value}>{children}</PsicoEmpresaActivaContext.Provider>;
}

export function usePsicoEmpresaActiva() {
  const ctx = useContext(PsicoEmpresaActivaContext);
  if (!ctx) throw new Error("usePsicoEmpresaActiva debe usarse dentro de PsicoEmpresaActivaProvider");
  return ctx;
}
