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

const sidebar = (tone: "legacy" | "rel") => (
  <MemoryRouter initialEntries={["/superadmin/empresas"]}>
    <RoleSidebar
      items={[{ to: "/superadmin/empresas", label: "Empresas", icon: Building2 }]}
      storageKey={`sidebar-test-${tone}`}
      tone={tone}
      avatarText="SA"
      userTitle="Administrador"
      userSubtitle="Plataforma"
      navLabel="Navegación SuperAdmin"
      footerLink=""
    />
  </MemoryRouter>
);

describe("RoleSidebar", () => {
  it("usa la identidad vigente en SuperAdmin sin cambiar las otras superficies", () => {
    const actual = render(sidebar("rel"));
    expect(screen.getByRole("button", { name: "Empresas" })).toHaveClass("bg-rel-accent");
    expect(screen.getByRole("complementary")).toHaveClass("bg-rel-dark");

    actual.unmount();
    render(sidebar("legacy"));
    expect(screen.getByRole("button", { name: "Empresas" })).toHaveClass("bg-violet-600");
    expect(screen.getByRole("complementary")).toHaveClass("bg-[#071329]");
  });
});
