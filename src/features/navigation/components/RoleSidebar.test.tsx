import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import RoleSidebar from "./RoleSidebar";
import { projectNavigation } from "../navigationTree";

function sidebar(destinos: string[]) {
  return render(<MemoryRouter initialEntries={["/superadmin/empresas"]}><RoleSidebar
    items={projectNavigation(destinos)} storageKey="sidebar-navigation-test" tone="rel"
    avatarText="SA" userTitle="Administrador" userSubtitle="Plataforma"
    navLabel="Navegación principal" footerLink=""
  /></MemoryRouter>);
}

describe("navegación compartida", () => {
  it("muestra una sola opción como enlace directo con icono", () => {
    sidebar(["/superadmin/empresas"]);
    const enlaces = screen.getAllByRole("link", { name: "Empresas" });
    expect(enlaces.length).toBeGreaterThan(0);
    expect(enlaces[0].querySelector("svg")).not.toBeNull();
    expect(screen.queryByRole("button", { name: "Administración" })).toBeNull();
  });

  it("agrupa opciones autorizadas, conserva iconos y abre panel móvil", () => {
    sidebar(["/superadmin/empresas", "/superadmin/usuarios"]);
    const group = screen.getAllByRole("button", { name: "Administración" })[0];
    expect(group).toHaveAttribute("aria-expanded", "true");
    expect(screen.getAllByRole("link", { name: "Usuarios" })[0].querySelector("svg")).not.toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Abrir menú" }));
    expect(screen.getByRole("dialog", { name: "Menú de Abril360" })).toBeInTheDocument();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("dialog", { name: "Menú de Abril360" })).not.toBeInTheDocument();
  });

  it("no dibuja destinos ausentes y comunica el error con reintento", () => {
    const view = sidebar(["/superadmin/empresas"]);
    view.rerender(<MemoryRouter><RoleSidebar items={[]} storageKey="sidebar-navigation-test"
      avatarText="SA" userTitle="Administrador" userSubtitle="Plataforma"
      navLabel="Navegación principal" error="No pudimos cargar tu navegación."
      onRetry={() => undefined} /></MemoryRouter>);
    expect(screen.queryByRole("link", { name: "Empresas" })).toBeNull();
    expect(screen.getAllByRole("alert")[0]).toHaveTextContent("No pudimos cargar");
  });
});
