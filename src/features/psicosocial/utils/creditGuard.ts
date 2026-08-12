import { AbrilApiError } from "@/features/psicosocial/api/httpClient";

export const CREDIT_PURCHASE_WHATSAPP_URL = "https://wa.me/573002458438";
export const REL_PRIMARY_COLOR = "#00b89f";
export const REL_PRIMARY_HOVER_COLOR = "#009b88";

export type CreditGuardInfo = {
  isInsufficient: boolean;
  saldoActual?: number;
  requeridos?: number;
  message: string;
};

export function getCreditGuardInfo(error: unknown): CreditGuardInfo {
  if (!(error instanceof AbrilApiError)) {
    return {
      isInsufficient: false,
      message: error instanceof Error ? error.message : "Intenta nuevamente.",
    };
  }
  const detail = typeof error.detail === "object" && error.detail !== null ? (error.detail as Record<string, any>) : {};
  const code = String(detail.error || error.message || "").trim();
  const isInsufficient = error.status === 402 || code === "CREDITOS_INSUFICIENTES";
  if (!isInsufficient) {
    return { isInsufficient: false, message: error.message || "Intenta nuevamente." };
  }
  const saldoActual = Number(detail.saldo_actual ?? 0);
  const requeridos = Number(detail.requeridos ?? 1);
  return {
    isInsufficient: true,
    saldoActual: Number.isFinite(saldoActual) ? saldoActual : 0,
    requeridos: Number.isFinite(requeridos) ? requeridos : 1,
    message:
      typeof detail.message === "string"
        ? detail.message
        : "No tienes creditos disponibles para ejecutar esta accion.",
  };
}
