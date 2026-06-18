import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import PsicologoPerfilPage from "./PsicologoPerfilPage";

const changePassword = vi.fn();
let passwordChangeRequired = false;

vi.mock("@/context/AuthContext", () => ({
  useAuth: () => ({
    user: {
      id: "66",
      nombre: "Mary Luz Agudelo Test",
      email: "psicologa.demo@eva360.com.co",
      empresaId: "46fa152f-cafc-4a1a-bee8-3831403ae1db",
    },
    tenantId: "46fa152f-cafc-4a1a-bee8-3831403ae1db",
    roles: ["PSICOLOGO_EVALUADOR"],
    permissions: ["psico.dashboard.view", "psico.empresas.view"],
    passwordChangeRequired,
    changePassword,
  }),
}));

vi.mock("@/hooks/use-toast", () => ({
  toast: vi.fn(),
}));

describe("PsicologoPerfilPage", () => {
  beforeEach(() => {
    changePassword.mockReset();
    changePassword.mockResolvedValue(undefined);
    passwordChangeRequired = false;
  });

  it("muestra la información registrada del psicólogo", () => {
    render(<PsicologoPerfilPage />);

    expect(screen.getAllByText("Mary Luz Agudelo Test").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("psicologa.demo@eva360.com.co")).toBeInTheDocument();
    expect(screen.getAllByText("Psicologo Evaluador").length).toBeGreaterThanOrEqual(1);
  });

  it("permite cambiar contraseña cuando cumple la política visual", async () => {
    render(<PsicologoPerfilPage />);

    fireEvent.click(screen.getByRole("button", { name: "Cambiar contraseña" }));
    fireEvent.change(screen.getByLabelText("Contraseña actual"), { target: { value: "ActualPass!2026" } });
    fireEvent.change(screen.getByLabelText("Nueva contraseña"), { target: { value: "ClaveSegura!2026" } });
    fireEvent.change(screen.getByLabelText("Confirmar nueva contraseña"), { target: { value: "ClaveSegura!2026" } });
    fireEvent.click(screen.getByRole("button", { name: "Guardar contraseña" }));

    await waitFor(() => {
      expect(changePassword).toHaveBeenCalledWith({
        currentPassword: "ActualPass!2026",
        newPassword: "ClaveSegura!2026",
        confirmPassword: "ClaveSegura!2026",
      });
    });
  });

  it("abre el cambio obligatorio y bloquea cancelar cuando la cuenta tiene contraseña temporal", () => {
    passwordChangeRequired = true;

    render(<PsicologoPerfilPage />);

    expect(screen.getByText("Cambio obligatorio de contraseña")).toBeInTheDocument();
    expect(screen.getByText("Por seguridad, actualiza la contraseña temporal antes de continuar.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Cancelar" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Cerrar" })).not.toBeInTheDocument();
  });
});
