import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import RecursosAbril360Page, { resourcePages } from "./RecursosAbril360Page";

describe("RecursosAbril360Page", () => {
  it("exposes the expected public resource center pages", () => {
    expect(resourcePages.map((page) => page.key)).toEqual([
      "manual-uso",
      "ficha-tecnica",
      "seguridad-cumplimiento",
      "certificacion",
    ]);
  });

  it("renders technical and regulatory references", () => {
    render(
      <MemoryRouter>
        <RecursosAbril360Page page="certificacion" />
      </MemoryRouter>,
    );

    expect(screen.getByRole("heading", { name: /Alcance, certificación y marco normativo/i })).toBeInTheDocument();
    expect(screen.getByText(/No reemplaza la valoración, interpretación ni firma/i)).toBeInTheDocument();
    expect(screen.getByText(/Psicología de confianza aplicada a la presentación/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Resolución 2646 de 2008/i })).toHaveAttribute(
      "href",
      expect.stringContaining("suin-juriscol.gov.co"),
    );
    expect(screen.getByRole("link", { name: /Ley 1581 de 2012/i })).toHaveAttribute(
      "href",
      expect.stringContaining("suin-juriscol.gov.co"),
    );
  });

  it("renders the expanded operating guide for the manual page", () => {
    render(
      <MemoryRouter>
        <RecursosAbril360Page page="manual-uso" />
      </MemoryRouter>,
    );

    expect(screen.getByRole("heading", { name: /Manual de uso ABRIL360/i })).toBeInTheDocument();
    expect(screen.getByText(/Ruta operativa recomendada/i)).toBeInTheDocument();
    expect(screen.getByText(/Mapa de navegación real del módulo/i)).toBeInTheDocument();
    expect(screen.getByText(/Controles previos al cierre/i)).toBeInTheDocument();
  });
});
