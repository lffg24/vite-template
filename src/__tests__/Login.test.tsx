// src/__tests__/Login.test.tsx
import { describe, it, expect, beforeEach, vi } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { AuthProvider } from "@/context/AuthContext";
import Login from "@/pages/Login";

function meResponse(roles: string[]) {
  return {
    id: "u1",
    nombre: "Usuario Test",
    email: "test@example.com",
    empresa_id: "t1",
    roles,
    permissions: [],
  };
}

describe("Login", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    sessionStorage.clear();
    localStorage.clear();
  });

  it("loguea y redirige admin a /evaluaciones", async () => {
    vi.spyOn(global, "fetch")
      .mockResolvedValueOnce(new Response(null, { status: 401 }) as any)
      .mockResolvedValueOnce(new Response(JSON.stringify(meResponse(["admin_empresa"])), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }) as any);

    render(
      <AuthProvider>
        <MemoryRouter initialEntries={["/login"]}>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/evaluaciones" element={<div>HOME EMPRESA</div>} />
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
      expect(screen.getByText("HOME EMPRESA")).toBeInTheDocument()
    );
  });

  it("loguea empleado y redirige a /mis-evaluaciones", async () => {
    vi.spyOn(global, "fetch")
      .mockResolvedValueOnce(new Response(null, { status: 401 }) as any)
      .mockResolvedValueOnce(new Response(JSON.stringify(meResponse(["evaluado"])), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }) as any);

    render(
      <AuthProvider>
        <MemoryRouter initialEntries={["/login"]}>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/mis-evaluaciones"
              element={<div>HOME EMPLEADO</div>}
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
      expect(screen.getByText("HOME EMPLEADO")).toBeInTheDocument()
    );
  });
});
