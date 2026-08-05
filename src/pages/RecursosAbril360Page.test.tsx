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

    expect(screen.getByRole("heading", { name: /Alcance, certificación y referencias/i })).toBeInTheDocument();
    expect(screen.getByText(/No reemplaza el criterio profesional/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /INVIMA/i })).toHaveAttribute(
      "href",
      expect.stringContaining("invima.gov.co"),
    );
    expect(screen.getByRole("link", { name: /Ley 1581/i })).toHaveAttribute(
      "href",
      expect.stringContaining("suin-juriscol.gov.co"),
    );
  });
});
