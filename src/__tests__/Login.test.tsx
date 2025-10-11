// src/__tests__/Login.test.tsx
import { describe, it, expect, beforeEach, vi } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { AuthProvider } from "@/context/AuthContext";
import Login from "@/pages/Login";

function jwt(roles: string[]) {
  const header = Buffer.from(
    JSON.stringify({ alg: "none", typ: "JWT" })
  ).toString("base64url");
  const payload = Buffer.from(
    JSON.stringify({ sub: "u1", tenant_id: "t1", roles, exp: 9999999999 })
  ).toString("base64url");
  return `${header}.${payload}.`;
}

describe("Login", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    sessionStorage.clear();
    localStorage.clear();
  });

  it("loguea y redirige admin a /evaluaciones", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({ access_token: jwt(["admin_empresa"]) }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }) as any
    );

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

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "a@b.com" },
    });
    fireEvent.change(screen.getByLabelText(/contraseña/i), {
      target: { value: "x" },
    });
    fireEvent.click(screen.getByRole("button", { name: /ingresar/i }));

    await waitFor(() =>
      expect(screen.getByText("HOME EMPRESA")).toBeInTheDocument()
    );
  });

  it("loguea empleado y redirige a /mis-evaluaciones", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({ access_token: jwt(["evaluado"]) }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }) as any
    );

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

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "c@d.com" },
    });
    fireEvent.change(screen.getByLabelText(/contraseña/i), {
      target: { value: "y" },
    });
    fireEvent.click(screen.getByRole("button", { name: /ingresar/i }));

    await waitFor(() =>
      expect(screen.getByText("HOME EMPLEADO")).toBeInTheDocument()
    );
  });
});
