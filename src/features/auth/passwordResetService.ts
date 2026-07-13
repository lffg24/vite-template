import { API_URL } from "@/lib/config";

type PasswordResetResponse = { ok: boolean; message: string };

async function parseResponse(response: Response): Promise<PasswordResetResponse> {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const detail = typeof data?.detail === "string" ? data.detail : "No fue posible completar la solicitud.";
    const error = new Error(detail) as Error & { status?: number };
    error.status = response.status;
    throw error;
  }
  return data as PasswordResetResponse;
}

export async function requestPasswordReset(email: string): Promise<PasswordResetResponse> {
  const response = await fetch(`${API_URL}/auth/password-reset/request`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ email: email.trim().toLowerCase() }),
  });
  return parseResponse(response);
}

export async function confirmPasswordReset(payload: {
  token: string;
  newPassword: string;
  confirmPassword: string;
}): Promise<PasswordResetResponse> {
  const response = await fetch(`${API_URL}/auth/password-reset/confirm`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      token: payload.token,
      new_password: payload.newPassword,
      confirm_password: payload.confirmPassword,
    }),
  });
  return parseResponse(response);
}
