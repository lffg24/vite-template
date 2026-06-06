// src/__tests__/Login.test.tsx
import { describe, it, expect, beforeEach, vi } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { AuthProvider } from "@/context/AuthContext";
import Login from "@/pages/Login";

function meResponse(roles: string[], permissions: string[] = []) {
  return {
    id: "u1",
    nombre: "Usuario Test",
    email: "test@example.com",
    empresa_id: "t1",
    roles,
    permissions,
  };
}

describe("Login", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    sessionStorage.clear();
    localStorage.clear();
  });

  it("loguea psicóloga y redirige al dashboard psicosocial", async () => {
    vi.spyOn(global, "fetch")
      .mockResolvedValueOnce(new Response(null, { status: 401 }) as any)
      .mockResolvedValueOnce(new Response(JSON.stringify(meResponse(["PSICOLOGO_EVALUADOR"], ["psico.dashboard.view"])), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }) as any);

    render(
      <AuthProvider>
        <MemoryRouter initialEntries={["/login"]}>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/psicosocial/dashboard" element={<div>HOME PSICO</div>} />
          </Routes>
        </MemoryRouter>
      </AuthProvider>
    );

    fireEvent.change(await screen.findByLabelText(/correo/i), {
      target: { value: "a@b.com" },
    });
    fireEvent.change(screen.getByPlaceholderText(/ingresa tu contraseña/i), {
      target: { value: "x" },
    });
    fireEvent.click(screen.getByRole("button", { name: /iniciar sesión/i }));

    await waitFor(() =>
      expect(screen.getByText("HOME PSICO")).toBeInTheDocument()
    );
  });

  it("loguea superadmin y redirige al dashboard de plataforma", async () => {
    vi.spyOn(global, "fetch")
      .mockResolvedValueOnce(new Response(null, { status: 401 }) as any)
      .mockResolvedValueOnce(new Response(JSON.stringify(meResponse(["SUPER_ADMIN"], ["superadmin.dashboard.view"])), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }) as any);

    render(
      <AuthProvider>
        <MemoryRouter initialEntries={["/login"]}>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/superadmin/dashboard"
              element={<div>HOME SUPERADMIN</div>}
            />
          </Routes>
        </MemoryRouter>
      </AuthProvider>
    );

    fireEvent.change(await screen.findByLabelText(/correo/i), {
      target: { value: "c@d.com" },
    });
    fireEvent.change(screen.getByPlaceholderText(/ingresa tu contraseña/i), {
      target: { value: "y" },
    });
    fireEvent.click(screen.getByRole("button", { name: /iniciar sesión/i }));

    await waitFor(() =>
      expect(screen.getByText("HOME SUPERADMIN")).toBeInTheDocument()
    );
  });

  it("no reutiliza rutas piloto recibidas en next", async () => {
    vi.spyOn(global, "fetch")
      .mockResolvedValueOnce(new Response(null, { status: 401 }) as any)
      .mockResolvedValueOnce(new Response(JSON.stringify(meResponse(["PSICOLOGO_EVALUADOR"], ["psico.dashboard.view"])), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }) as any);

    render(
      <AuthProvider>
        <MemoryRouter initialEntries={["/login?next=/usuarios"]}>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/usuarios" element={<div>RUTA PILOTO</div>} />
            <Route path="/psicosocial/dashboard" element={<div>HOME PSICO</div>} />
          </Routes>
        </MemoryRouter>
      </AuthProvider>
    );

    fireEvent.change(await screen.findByLabelText(/correo/i), {
      target: { value: "psicologa.demo@eva360.com.co" },
    });
    fireEvent.change(screen.getByPlaceholderText(/ingresa tu contraseña/i), {
      target: { value: "MiP4ss!" },
    });
    fireEvent.click(screen.getByRole("button", { name: /iniciar sesión/i }));

    await waitFor(() =>
      expect(screen.getByText("HOME PSICO")).toBeInTheDocument()
    );
    expect(screen.queryByText("RUTA PILOTO")).not.toBeInTheDocument();
  });
});
