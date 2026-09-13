import { render, screen } from "@testing-library/react";
import { Building2 } from "lucide-react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import RoleSidebar from "./RoleSidebar";

/** Fija el ancho de ventana que lee `useIsMobile` y deja `matchMedia` inerte. */
function anchoDeVentana(ancho: number) {
  window.innerWidth = ancho;
  window.matchMedia = vi.fn().mockImplementation((consulta: string) => ({
    matches: ancho < 768,
    media: consulta,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));
}

beforeEach(() => {
  anchoDeVentana(1440);
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

  it("en un telefono se repliega a riel de iconos", () => {
    // `preprod` dejo el menu en 292 px fijos. En una pantalla de 390 px eso
    // deja 98 px para el contenido y la pagina entera se desborda de lado:
    // era el fallo real detras de las dos pruebas de extremo a extremo.
    anchoDeVentana(390);
    render(sidebar);

    expect(screen.getByRole("complementary")).toHaveClass("w-[96px]");
    // `min-w-0` es lo que hace que ese ancho se respete: sin el, el suelo de
    // `min-width: auto` del flex deja la barra en ~225 px y el riel es mentira.
    expect(screen.getByRole("complementary")).toHaveClass("min-w-0");
    // El rotulo desaparece del riel; el boton sigue teniendo nombre accesible
    // por su `title`, que es lo que lo hace utilizable sin texto a la vista.
    expect(screen.queryByText("Empresas")).toBeNull();
    expect(screen.getByRole("button", { name: "Empresas" })).toBeInTheDocument();
    // Y el boton de contraer se esconde: en el riel no hay nada que alternar.
    expect(
      screen.getByRole("button", { name: /contraer men/i })
    ).toHaveClass("hidden");
  });

  it("en escritorio sigue desplegado con sus rotulos", () => {
    // Contraprueba de la anterior: si el riel se aplicara siempre, esta falla.
    render(sidebar);

    expect(screen.getByRole("complementary")).toHaveClass("w-[292px]");
    expect(screen.getByText("Empresas")).toBeInTheDocument();
  });
});
