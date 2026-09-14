import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import CapacitacionesLayout from "./CapacitacionesLayout";

vi.mock("@/context/AuthContext", () => ({
  useAuth: () => ({ user: { nombre: "Prueba" } }),
}));
vi.mock("@/features/capacitaciones/ContextoCapacitaciones", () => ({
  ProveedorCapacitaciones: ({ children }: { children: ReactNode }) => children,
  useCapacitaciones: () => ({ fase: "listo", capacidades: { tiene_acceso: false } }),
}));
vi.mock("@/features/navigation/useEffectiveNavigation", () => ({
  useEffectiveNavigation: () => ({ items: [], loading: false, error: null, retry: vi.fn() }),
}));
vi.mock("@/features/navigation/components/RoleSidebar", () => ({ default: () => null }));

function mostrar(ruta: string) {
  render(<MemoryRouter initialEntries={[ruta]}><Routes>
    <Route element={<CapacitacionesLayout />}>
      <Route path="/evaluaciones" element={<p>Banco de evaluaciones</p>} />
      <Route path="/capacitaciones/cursos" element={<p>Catálogo de cursos</p>} />
    </Route>
  </Routes></MemoryRouter>);
}

describe("límite entre Capacitación y Evaluaciones", () => {
  it("permite evaluar aunque la empresa no tenga acceso a cursos", () => {
    mostrar("/evaluaciones");
    expect(screen.getByText("Banco de evaluaciones")).toBeInTheDocument();
  });

  it("mantiene el bloqueo de cursos cuando el módulo no está habilitado", () => {
    mostrar("/capacitaciones/cursos");
    expect(screen.queryByText("Catálogo de cursos")).not.toBeInTheDocument();
    expect(screen.getByText(/no tienes acceso a capacitaciones/i)).toBeInTheDocument();
  });
});
