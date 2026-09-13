import { render, screen } from "@testing-library/react";
import { Building2 } from "lucide-react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import RoleSidebar from "./RoleSidebar";

beforeEach(() => {
  window.matchMedia = vi.fn().mockImplementation(() => ({
    matches: false,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));
});

const sidebar = (
  <MemoryRouter initialEntries={["/superadmin/empresas"]}>
    <RoleSidebar
      items={[{ to: "/superadmin/empresas", label: "Empresas", icon: Building2 }]}
      storageKey="sidebar-test"
      avatarText="SA"
      userTitle="Administrador"
      userSubtitle="Plataforma"
      navLabel="Navegación SuperAdmin"
      footerLink=""
    />
  </MemoryRouter>
);

describe("RoleSidebar", () => {
  it("pinta la entrada activa y la barra con tokens, no con colores sueltos", () => {
    // Esta prueba reemplaza a la del parámetro `tone`, que existía para que la
    // barra de SuperAdmin se viera en marca mientras las demás seguían en
    // violeta. Al traer `preprod`, TODAS usan ya los tokens de la casa: el
    // parámetro solo podía elegir un aspecto que dejó de existir.
    render(sidebar);

    expect(screen.getByRole("button", { name: "Empresas" })).toHaveClass(
      "bg-sidebar-active"
    );
    expect(screen.getByRole("complementary")).toHaveClass("bg-sidebar");
  });

  it("no queda ni un violeta escrito a mano", () => {
    // Es la queja concreta que motivó la sincronización: la barra se veía
    // morada mientras los botones ya eran turquesa. Un color suelto aquí
    // sobrevive al siguiente cambio de paleta y la vuelve a producir.
    const { container } = render(sidebar);

    const clases = Array.from(container.querySelectorAll("*"))
      .map((n) => n.getAttribute("class") ?? "")
      .join(" ");

    expect(clases).not.toMatch(/violet-/);
    // Y tampoco el azul oscuro que llevaba escrito a pelo en el marcado.
    expect(clases).not.toMatch(/\[#071329\]/);
  });
});
