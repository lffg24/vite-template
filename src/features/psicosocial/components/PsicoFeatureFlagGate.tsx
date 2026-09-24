import type { ReactNode } from "react";

import type { PsicoFeatureFlags } from "@/features/psicosocial/api/psicoAccessService";
import { usePsicoEmpresaActiva } from "@/features/psicosocial/context/PsicoEmpresaActivaContext";

type PsicoFeatureFlagGateProps = {
  feature: keyof PsicoFeatureFlags;
  children: ReactNode;
  fallback?: ReactNode;
};

export function PsicoFeatureFlagGate({
  feature,
  children,
  fallback = null,
}: PsicoFeatureFlagGateProps) {
  const { featureFlags } = usePsicoEmpresaActiva();
  return featureFlags[feature] ? children : fallback;
}
