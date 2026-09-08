import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import ProtectedRoute from "./ProtectedRoute";

let passwordChangeRequired = false;
let isAuthenticated = true;

vi.mock("@/context/AuthContext", () => ({
  useAuth: () => ({
    initialized: true,
    isAuthenticated,
    roles: ["PSICOLOGO_EVALUADOR"],
    permissions: ["psico.dashboard.view"],
    passwordChangeRequired,
  }),
}));

describe("ProtectedRoute", () => {
  beforeEach(() => {
    passwordChangeRequired = false;
    isAuthenticated = true;
  });

  it("conserva ruta y consulta al enviar una sesión vencida al login", async () => {
    isAuthenticated = false;

    render(
      <MemoryRouter initialEntries={["/psicosocial/empresas/empresa-1/aplicaciones/77?tab=resumen"]}>
        <Routes>
          <Route element={<ProtectedRoute />}>
            <Route
              path="/psicosocial/empresas/:empresaId/aplicaciones/:aplicacionId"
              element={<div>Detalle</div>}
            />
          </Route>
          <Route path="/login" element={<LoginLocation />} />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("login-location")).toHaveTextContent(
        "/login?next=%2Fpsicosocial%2Fempresas%2Fempresa-1%2Faplicaciones%2F77%3Ftab%3Dresumen",
      );
    });
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

function LoginLocation() {
  const location = useLocation();
  return <div data-testid="login-location">{`${location.pathname}${location.search}`}</div>;
}
