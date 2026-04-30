// src/features/psicosocial/context/PsicoEmpresaActivaContext.tsx
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  EmpresaAsignada,
  getEmpresasAsignadas,
  getEmpresaActivaId,
  setEmpresaActivaId,
} from "@/features/psicosocial/api/psicoAccessService";

type PsicoEmpresaContextValue = {
  empresas: EmpresaAsignada[];
  empresaActiva?: EmpresaAsignada;
  empresaActivaId?: string;
  loading: boolean;
  error?: string;
  cambiarEmpresa: (empresaId: string) => void;
  recargarEmpresas: () => Promise<void>;
};

const PsicoEmpresaActivaContext = createContext<PsicoEmpresaContextValue | null>(null);

export function PsicoEmpresaActivaProvider({ children }: { children: React.ReactNode }) {
  const [empresas, setEmpresas] = useState<EmpresaAsignada[]>([]);
  const [empresaActivaId, setEmpresaActivaIdState] = useState<string | undefined>(
    getEmpresaActivaId() ?? undefined
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>();

  const recargarEmpresas = async () => {
    setLoading(true);
    setError(undefined);
    try {
      const list = await getEmpresasAsignadas();
      setEmpresas(list);

      const current = getEmpresaActivaId();
      const currentIsAllowed = current && list.some((e) => e.empresa_id === current);
      const next = currentIsAllowed ? current! : list[0]?.empresa_id;

      if (next) {
        setEmpresaActivaId(next);
        setEmpresaActivaIdState(next);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error cargando empresas asignadas");
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

  const empresaActiva = useMemo(
    () => empresas.find((e) => e.empresa_id === empresaActivaId),
    [empresas, empresaActivaId]
  );

  const value = useMemo(
    () => ({ empresas, empresaActiva, empresaActivaId, loading, error, cambiarEmpresa, recargarEmpresas }),
    [empresas, empresaActiva, empresaActivaId, loading, error]
  );

  return <PsicoEmpresaActivaContext.Provider value={value}>{children}</PsicoEmpresaActivaContext.Provider>;
}

export function usePsicoEmpresaActiva() {
  const ctx = useContext(PsicoEmpresaActivaContext);
  if (!ctx) throw new Error("usePsicoEmpresaActiva debe usarse dentro de PsicoEmpresaActivaProvider");
  return ctx;
}
