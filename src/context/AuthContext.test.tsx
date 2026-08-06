import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthProvider, useAuth } from "./AuthContext";

function meResponse(passwordChangeRequired: boolean, nombre = "Psicologa QA") {
  return {
    id: "u1",
    nombre,
    email: "qa@example.com",
    empresa_id: "tenant-1",
    roles: ["PSICOLOGO_EVALUADOR"],
    permissions: ["psico.dashboard.view"],
    password_change_required: passwordChangeRequired,
  };
}

function Harness() {
  const { user, passwordChangeRequired, changePassword } = useAuth();
  return (
    <div>
      <span>{user?.nombre || "Sin usuario"}</span>
      <span>{passwordChangeRequired ? "pendiente" : "libre"}</span>
      <button
        type="button"
        onClick={() =>
          changePassword({
            currentPassword: "Temporal!2026",
            newPassword: "NuevaSegura!2026",
            confirmPassword: "NuevaSegura!2026",
          })
        }
      >
        cambiar
      </button>
    </div>
  );
}

describe("AuthContext", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("refresca auth/me despues de cambiar la contraseña obligatoria", async () => {
    const fetchMock = vi.spyOn(global, "fetch")
      .mockResolvedValueOnce(new Response(JSON.stringify(meResponse(true)), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }) as any)
      .mockResolvedValueOnce(new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }) as any)
      .mockResolvedValueOnce(new Response(JSON.stringify(meResponse(false, "Psicologa Actualizada")), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }) as any);

    render(
      <AuthProvider>
        <Harness />
      </AuthProvider>,
    );

    expect(await screen.findByText("pendiente")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "cambiar" }));

    await waitFor(() => {
      expect(screen.getByText("libre")).toBeInTheDocument();
      expect(screen.getByText("Psicologa Actualizada")).toBeInTheDocument();
    });
    expect(fetchMock.mock.calls.map((call) => String(call[0]))).toEqual([
      expect.stringContaining("/auth/me"),
      expect.stringContaining("/auth/password"),
      expect.stringContaining("/auth/me"),
    ]);
  });
});
