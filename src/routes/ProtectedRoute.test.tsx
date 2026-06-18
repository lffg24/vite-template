import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import ProtectedRoute from "./ProtectedRoute";

let passwordChangeRequired = false;

vi.mock("@/context/AuthContext", () => ({
  useAuth: () => ({
    initialized: true,
    isAuthenticated: true,
    roles: ["PSICOLOGO_EVALUADOR"],
    permissions: ["psico.dashboard.view"],
    passwordChangeRequired,
  }),
}));

describe("ProtectedRoute", () => {
  beforeEach(() => {
    passwordChangeRequired = false;
  });

  it("redirige al perfil cuando el usuario debe cambiar una contraseña temporal", async () => {
    passwordChangeRequired = true;

    render(
      <MemoryRouter initialEntries={["/psicosocial/dashboard"]}>
        <Routes>
          <Route element={<ProtectedRoute requirePermission="psico.dashboard.view" />}>
            <Route path="/psicosocial/dashboard" element={<div>Dashboard</div>} />
            <Route path="/psicosocial/perfil" element={<div>Perfil obligatorio</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText("Perfil obligatorio")).toBeInTheDocument();
    });
    expect(screen.queryByText("Dashboard")).not.toBeInTheDocument();
  });
});
